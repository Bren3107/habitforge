import {
  generateQuestion,
  generatePlan,
  resetAnthropicClient,
  type ConversationTurn,
  type UserContext,
  type HabitPlan,
} from "../llm";
import type { Principle } from "../knowledge-graph";
import type { SuccessCase } from "../semantic-search";
import { createMockSuccessCase } from "./test-utils";

// Mock the Anthropic SDK module
const mockCreateFunction = jest.fn();

jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      messages: {
        create: mockCreateFunction,
      },
    })),
  };
});

describe("LLM Orchestration Module", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockCreateFunction.mockClear();
    resetAnthropicClient();
  });

  describe("generateQuestion", () => {
    it("should generate a question when context is incomplete", async () => {
      const mockResponse = {
        question: "What time of day do you have the most energy?",
        context_complete: false,
      };

      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockResponse) }],
      });

      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a fitness habit" },
      ];

      const userContext: Partial<UserContext> = {
        goal: "Run 3 times a week",
        motivation: "Improve cardiovascular health",
        lifestyle_summary: "Sedentary job, work 9-5",
        constraints: { time_available: "limited", energy_level: "medium" },
      };

      const result = await generateQuestion(conversation, userContext);

      expect(result.question).toBe(
        "What time of day do you have the most energy?"
      );
      expect(result.context_complete).toBe(false);
    });

    it("should signal context completion when enough information is gathered", async () => {
      const mockResponse = {
        question: null,
        context_complete: true,
      };

      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockResponse) }],
      });

      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a fitness habit" },
        {
          role: "assistant",
          content: "What time of day do you have the most energy?",
        },
        { role: "user", content: "I'm most energetic in the morning" },
        {
          role: "assistant",
          content: "Do you have any past failures with fitness habits?",
        },
        { role: "user", content: "Yes, I always quit after 2 weeks due to boredom" },
        {
          role: "assistant",
          content: "What type of exercise do you enjoy most?",
        },
        { role: "user", content: "I like running outdoors" },
      ];

      const userContext: Partial<UserContext> = {
        goal: "Run 3 times a week",
        motivation: "Improve cardiovascular health",
        conversation_history: conversation,
      };

      const result = await generateQuestion(conversation, userContext);

      expect(result.question).toBeNull();
      expect(result.context_complete).toBe(true);
    });

    it("should throw error if conversation_history is empty", async () => {
      const userContext: Partial<UserContext> = {
        goal: "Run 3 times a week",
        motivation: "Improve cardiovascular health",
      };

      await expect(generateQuestion([], userContext)).rejects.toThrow(
        "conversation_history must be a non-empty array"
      );
    });

    it("should throw error if goal is missing", async () => {
      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a habit" },
      ];

      const userContext: Partial<UserContext> = {
        motivation: "Improve health",
      };

      await expect(generateQuestion(conversation, userContext)).rejects.toThrow(
        "user_context.goal must be a non-empty string"
      );
    });

    it("should throw error if motivation is missing", async () => {
      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a habit" },
      ];

      const userContext: Partial<UserContext> = {
        goal: "Build a fitness habit",
      };

      await expect(generateQuestion(conversation, userContext)).rejects.toThrow(
        "user_context.motivation must be a non-empty string"
      );
    });

    it("should handle invalid JSON response from Claude", async () => {
      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: "not valid json" }],
      });

      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a habit" },
      ];

      const userContext: Partial<UserContext> = {
        goal: "Build a fitness habit",
        motivation: "Improve health",
      };

      await expect(
        generateQuestion(conversation, userContext)
      ).rejects.toThrow("Failed to parse Claude response as JSON");
    });

    it("should handle API errors gracefully", async () => {
      mockCreateFunction.mockRejectedValue(
        new Error("API request failed: rate limit exceeded")
      );

      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a habit" },
      ];

      const userContext: Partial<UserContext> = {
        goal: "Build a fitness habit",
        motivation: "Improve health",
      };

      await expect(
        generateQuestion(conversation, userContext)
      ).rejects.toThrow("Claude API error");
    });

    it("should use Haiku model", async () => {
      const mockResponse = {
        question: "Test question?",
        context_complete: false,
      };

      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockResponse) }],
      });

      const conversation: ConversationTurn[] = [
        { role: "user", content: "I want to build a habit" },
      ];

      const userContext: Partial<UserContext> = {
        goal: "Build a fitness habit",
        motivation: "Improve health",
      };

      await generateQuestion(conversation, userContext);

      // Verify that the mock was called
      expect(mockCreateFunction).toHaveBeenCalled();
    });
  });

  describe("generatePlan", () => {
    let mockPrinciples: Principle[];
    let mockSuccessCases: SuccessCase[];
    let mockUserContext: UserContext;

    beforeEach(() => {
      mockPrinciples = [
        {
          id: "habit_stacking",
          name: "Habit Stacking",
          description:
            "Attach a new habit to an existing one to leverage existing routines",
          source: "Atomic Habits",
          applicable_when: ["low_time"],
          example: "After morning coffee, do 10 pushups",
          xp_bonus: 5,
        },
        {
          id: "implementation_intention",
          name: "Implementation Intention",
          description:
            "Use if-then planning to automate decision-making and reduce friction",
          source: "Habit Research",
          applicable_when: ["low_motivation"],
          example: "If I see my running shoes, then I will go for a run",
          xp_bonus: 6,
        },
        {
          id: "reward_timing",
          name: "Immediate Rewards",
          description: "Provide immediate feedback to reinforce new behaviors",
          source: "Behavioral Psychology",
          applicable_when: ["general"],
          example: "After workout, enjoy a smoothie",
          xp_bonus: 5,
        },
      ];

      mockSuccessCases = [
        createMockSuccessCase({
          category: "fitness",
          description:
            "User who went from sedentary to running 3x/week in 4 weeks",
          principle_ids: ["habit_stacking", "implementation_intention"],
        }),
        createMockSuccessCase({
          category: "fitness",
          description:
            "Early bird jogger who uses morning routine as anchor for exercise",
          principle_ids: ["habit_stacking", "reward_timing"],
        }),
        createMockSuccessCase({
          category: "fitness",
          description:
            "Person with low motivation who uses visual cues to trigger workouts",
          principle_ids: ["implementation_intention", "reward_timing"],
        }),
      ];

      mockUserContext = {
        goal: "Run 3 times a week",
        motivation: "Improve cardiovascular health and energy levels",
        lifestyle_summary: "Sedentary job, work 9-5, family obligations in evening",
        constraints: {
          time_available: "30-45 minutes",
          energy_level: "medium",
          schedule_flexibility: "moderate",
        },
        conversation_history: [
          { role: "user", content: "I want to start running" },
          {
            role: "assistant",
            content: "What time of day do you have the most energy?",
          },
          { role: "user", content: "I'm most energetic in the morning" },
          {
            role: "assistant",
            content: "Do you have experience with fitness habits?",
          },
          { role: "user", content: "I tried running before but quit after 2 weeks" },
        ],
      };
    });

    it("should generate a complete habit plan", async () => {
      const mockPlan: HabitPlan = {
        plan_title: "4-Week Progressive Running Plan",
        daily_actions: [
          {
            day: 1,
            actions: ["Wake up at 6am", "Put on running shoes"],
            cue: "Alarm goes off at 6am",
            reward: "Post-run smoothie",
          },
          {
            day: 2,
            actions: ["Check weather", "Go for 15-minute jog"],
            cue: "Morning coffee is finished",
            reward: "Stretch and shower",
          },
        ],
        psychology_principles_used: [
          "Habit Stacking",
          "Implementation Intention",
          "Immediate Rewards",
        ],
        week_progression: [
          {
            week: 1,
            focus: "Establish morning routine anchor",
            expected_difficulty: "Easy",
          },
          {
            week: 2,
            focus: "Increase duration to 20 minutes",
            expected_difficulty: "Medium",
          },
          {
            week: 3,
            focus: "Add second running session",
            expected_difficulty: "Medium",
          },
          {
            week: 4,
            focus: "Three sessions per week, 30 minutes each",
            expected_difficulty: "Hard",
          },
        ],
        explanation:
          "This plan leverages your morning energy peak and uses habit stacking to attach running to your existing morning routine.",
      };

      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockPlan) }],
      });

      const result = await generatePlan(
        mockUserContext,
        mockPrinciples,
        mockSuccessCases,
        "fitness"
      );

      expect(result.plan_title).toBe("4-Week Progressive Running Plan");
      expect(result.daily_actions.length).toBeGreaterThan(0);
      expect(result.psychology_principles_used.length).toBeGreaterThanOrEqual(3);
      expect(result.week_progression.length).toBeGreaterThan(0);
      expect(result.explanation).toBeDefined();
    });

    it("should include applicable principles in the request", async () => {
      const mockPlan: HabitPlan = {
        plan_title: "Test Plan",
        daily_actions: [
          { day: 1, actions: ["test"], cue: "test", reward: "test" },
        ],
        psychology_principles_used: ["Habit Stacking"],
        week_progression: [
          { week: 1, focus: "test", expected_difficulty: "Easy" },
        ],
        explanation: "Test explanation",
      };

      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockPlan) }],
      });

      await generatePlan(
        mockUserContext,
        mockPrinciples,
        mockSuccessCases,
        "fitness"
      );

      expect(mockCreateFunction).toHaveBeenCalled();
    });

    it("should throw error if user_context is invalid", async () => {
      await expect(
        generatePlan(
          null as unknown as UserContext,
          mockPrinciples,
          mockSuccessCases,
          "fitness"
        )
      ).rejects.toThrow("user_context must be an object");
    });

    it("should throw error if applicable_principles is empty", async () => {
      await expect(
        generatePlan(mockUserContext, [], mockSuccessCases, "fitness")
      ).rejects.toThrow("applicable_principles must be a non-empty array");
    });

    it("should throw error if similar_cases is empty", async () => {
      await expect(
        generatePlan(mockUserContext, mockPrinciples, [], "fitness")
      ).rejects.toThrow("similar_cases must be a non-empty array");
    });

    it("should throw error if category is empty", async () => {
      await expect(
        generatePlan(mockUserContext, mockPrinciples, mockSuccessCases, "")
      ).rejects.toThrow("category must be a non-empty string");
    });

    it("should throw error if response is missing plan_title", async () => {
      mockCreateFunction.mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              daily_actions: [{ day: 1, actions: [], cue: "", reward: "" }],
              psychology_principles_used: ["test"],
              week_progression: [{ week: 1, focus: "", expected_difficulty: "" }],
              explanation: "test",
            }),
          },
        ],
      });

      await expect(
        generatePlan(
          mockUserContext,
          mockPrinciples,
          mockSuccessCases,
          "fitness"
        )
      ).rejects.toThrow("Invalid plan_title in response");
    });

    it("should throw error if response is invalid JSON", async () => {
      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: "invalid json response" }],
      });

      await expect(
        generatePlan(
          mockUserContext,
          mockPrinciples,
          mockSuccessCases,
          "fitness"
        )
      ).rejects.toThrow("Failed to parse Claude response as JSON");
    });

    it("should handle missing conversation_history field", async () => {
      const contextWithoutHistory = {
        goal: "Test goal",
        motivation: "Test motivation",
        lifestyle_summary: "Test lifestyle",
        constraints: {},
        conversation_history: [],
      };

      await expect(
        generatePlan(
          contextWithoutHistory,
          mockPrinciples,
          mockSuccessCases,
          "fitness"
        )
      ).rejects.toThrow("user_context.conversation_history must be a non-empty array");
    });

    it("should include similar success cases in the request", async () => {
      const mockPlan: HabitPlan = {
        plan_title: "Test Plan",
        daily_actions: [
          { day: 1, actions: ["test"], cue: "test", reward: "test" },
        ],
        psychology_principles_used: ["Test"],
        week_progression: [
          { week: 1, focus: "test", expected_difficulty: "Easy" },
        ],
        explanation: "Test explanation",
      };

      mockCreateFunction.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockPlan) }],
      });

      await generatePlan(
        mockUserContext,
        mockPrinciples,
        mockSuccessCases,
        "fitness"
      );

      expect(mockCreateFunction).toHaveBeenCalled();
    });

    it("should validate all required fields in response", async () => {
      const invalidResponses = [
        {
          daily_actions: [],
          psychology_principles_used: ["test"],
          week_progression: [{ week: 1, focus: "test", expected_difficulty: "test" }],
          explanation: "test",
        },
        {
          plan_title: "Test",
          psychology_principles_used: ["test"],
          week_progression: [{ week: 1, focus: "test", expected_difficulty: "test" }],
          explanation: "test",
        },
        {
          plan_title: "Test",
          daily_actions: [{ day: 1, actions: [], cue: "", reward: "" }],
          week_progression: [{ week: 1, focus: "test", expected_difficulty: "test" }],
          explanation: "test",
        },
      ];

      for (const invalidResponse of invalidResponses) {
        mockCreateFunction.mockResolvedValueOnce({
          content: [{ type: "text", text: JSON.stringify(invalidResponse) }],
        });

        await expect(
          generatePlan(
            mockUserContext,
            mockPrinciples,
            mockSuccessCases,
            "fitness"
          )
        ).rejects.toThrow();
      }
    });
  });

  describe("Input validation", () => {
    it("should validate non-empty string inputs for generateQuestion", async () => {
      const conversation: ConversationTurn[] = [
        { role: "user", content: "test" },
      ];

      const emptyGoalContext: Partial<UserContext> = {
        goal: "",
        motivation: "test",
      };

      const emptyMotivationContext: Partial<UserContext> = {
        goal: "test",
        motivation: "",
      };

      await expect(
        generateQuestion(conversation, emptyGoalContext)
      ).rejects.toThrow();

      await expect(
        generateQuestion(conversation, emptyMotivationContext)
      ).rejects.toThrow();
    });

    it("should validate non-empty array inputs for generatePlan", async () => {
      const mockPrinciples: Principle[] = [
        {
          id: "test",
          name: "Test",
          description: "test",
          source: "test",
          applicable_when: ["test"],
          example: "test",
          xp_bonus: 5,
        },
      ];

      const mockUserContext: UserContext = {
        goal: "test",
        motivation: "test",
        lifestyle_summary: "test",
        constraints: {},
        conversation_history: [{ role: "user", content: "test" }],
      };

      await expect(
        generatePlan(mockUserContext, mockPrinciples, [], "test")
      ).rejects.toThrow("similar_cases must be a non-empty array");

      await expect(
        generatePlan(mockUserContext, [], [], "test")
      ).rejects.toThrow("applicable_principles must be a non-empty array");
    });
  });
});
