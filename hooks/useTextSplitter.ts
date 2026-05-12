"use client";
import { useRef } from "react";

export interface SplitLine {
  text: string;
  italic?: boolean;
}

export interface CharEntry {
  char: string;
  lineIndex: number;
  globalIndex: number;
  isSpace: boolean;
}

export function useTextSplitter(lines: SplitLine[]) {
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  let gi = 0;
  const chars: CharEntry[] = [];
  for (const [lineIndex, line] of lines.entries()) {
    for (const char of line.text.split("")) {
      chars.push({ char, lineIndex, globalIndex: gi++, isSpace: char === " " });
    }
  }

  const charsByLine = lines.map((_, li) => chars.filter((c) => c.lineIndex === li));

  return { chars, charsByLine, charRefs, totalChars: gi };
}
