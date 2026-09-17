/**
 * Vision layer — Claude reads photos and returns STRUCTURED JSON only.
 *
 * The output schema below has no cost, price, or verdict fields — that is
 * structurally impossible for this function to return. All numbers shown
 * to the user come from the rules layer (lib/rules/calculate-cost.ts),
 * which consumes this output as input.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { RoomType, VisionAnalysis } from "@/lib/types";

const ConditionSchema = z.enum(["good", "fair", "poor"]);

const VisionAnalysisSchema = z.object({
  roomType: z.enum([
    "bathroom",
    "kitchen",
    "basement",
    "bedroom",
    "living",
    "whole-home",
    "addition",
    "deck",
  ]),
  detectedFixtures: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      condition: ConditionSchema,
      estimatedAge: z.string(),
      replaceRecommended: z.boolean(),
    }),
  ),
  detectedFinishes: z.array(
    z.object({
      surface: z.enum(["floor", "wall", "ceiling", "counter"]),
      material: z.string(),
      condition: ConditionSchema,
    }),
  ),
  overallCondition: ConditionSchema,
  issues: z.array(
    z.object({
      severity: z.enum(["minor", "moderate", "major"]),
      label: z.string(),
      description: z.string(),
      affectedArea: z.string(),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `You are a visual inspector for a home renovation company. You are shown photos of a room a homeowner wants to renovate. Your only job is to report what is visible in the photos as structured data: the room type, the fixtures and finishes present with their condition, and any visible problems.

Rules:
- Report only what you can actually see. Do not guess ages, dimensions, or brands you cannot determine from the photo — give a reasonable range instead (e.g. "10-15 years") based on visible wear.
- Never estimate cost, price, or dollar amounts of any kind — that is handled separately and is not your job.
- Never give a renovation recommendation or verdict — only report observed facts.
- If you're unsure about something, reflect that with a lower confidence score rather than guessing.`;

export interface PhotoInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

// Local-dev fallback: without a billed Anthropic API key, skip the real
// vision call and return an honest "not yet analyzed" result — the same
// shape the estimate page already renders as a pending-analysis notice.
// Storage, the rules engine, and persistence all still run for real.
function placeholderVisionAnalysis(roomType: RoomType): VisionAnalysis {
  return {
    roomType,
    detectedFixtures: [],
    detectedFinishes: [],
    overallCondition: "fair",
    issues: [],
    confidence: 0,
  };
}

export async function analyzePhotos(
  roomTypeHint: RoomType,
  photos: PhotoInput[],
): Promise<VisionAnalysis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[analyzePhotos] ANTHROPIC_API_KEY not set — returning placeholder vision analysis for local testing.",
    );
    return placeholderVisionAnalysis(roomTypeHint);
  }

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...photos.map((photo) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: photo.mediaType,
              data: photo.base64,
            },
          })),
          {
            type: "text" as const,
            text: `The homeowner says this is a ${roomTypeHint}. Analyze these photos and report the room type, fixtures, finishes, overall condition, and any visible issues.`,
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(VisionAnalysisSchema),
    },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Claude did not return a valid photo analysis.");
  }

  return {
    ...parsed,
    issues: parsed.issues.map((issue, index) => ({
      id: `issue-${index + 1}`,
      ...issue,
    })),
  };
}
