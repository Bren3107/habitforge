import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Lazy-load transformer to avoid issues in script context
async function getEmbeddingPipeline() {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
}

async function generateEmbedding(text: string, extractor: any): Promise<number[]> {
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

function buildEmbeddingText(case_: any): string {
  // Combine relevant fields into a single text for embedding
  const profile = case_.user_profile;
  const constraints = (profile.constraints || []).join(", ");
  return [
    case_.habit_description,
    case_.success_strategy,
    `Profile: ${profile.time_available} available, ${profile.energy_level} energy, ${profile.schedule_type}`,
    `Constraints: ${constraints}`,
    `Principles: ${(case_.key_principles || []).join(", ")}`,
  ].filter(Boolean).join(". ");
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Loading embedding model...");
  const extractor = await getEmbeddingPipeline();
  console.log("Model loaded.");

  const categories = ["fitness", "productivity", "learning"];
  const fileMap: Record<string, string> = {
    fitness: "fitness-cases.json",
    productivity: "productivity-cases.json",
    learning: "learning-cases.json",
  };

  let totalProcessed = 0;

  for (const category of categories) {
    const filePath = path.join(process.cwd(), "data", "success-cases", fileMap[category]);
    const raw = fs.readFileSync(filePath, "utf-8");
    const cases: any[] = JSON.parse(raw);

    console.log(`\nProcessing ${cases.length} ${category} cases...`);

    for (const c of cases) {
      const text = buildEmbeddingText(c);
      const embedding = await generateEmbedding(text, extractor);

      const { error } = await supabase.from("success_cases").upsert({
        id: `${category}-${c.id}`,
        category: c.category,
        habit_description: c.habit_description,
        user_profile: c.user_profile,
        success_strategy: c.success_strategy,
        key_principles: c.key_principles,
        embedding,
      });

      if (error) {
        console.error(`Failed to upsert ${c.id}:`, error.message);
      } else {
        totalProcessed++;
        process.stdout.write(`\r  ${totalProcessed} cases uploaded`);
      }
    }
  }

  console.log(`\n\nDone! ${totalProcessed} cases uploaded to Supabase.`);
}

main().catch(console.error);
