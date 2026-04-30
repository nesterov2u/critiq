import { openAiModel } from "@/lib/constants";

export const critiqueSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overallScore",
    "summary",
    "visualHierarchy",
    "uxUsability",
    "visualDesign",
    "conversion",
    "topProblems",
    "actionableImprovements"
  ],
  properties: {
    overallScore: { type: "number" },
    summary: { type: "string" },
    visualHierarchy: {
      type: "object",
      additionalProperties: false,
      required: ["score", "feedback"],
      properties: {
        score: { type: "number" },
        feedback: { type: "string" }
      }
    },
    uxUsability: {
      type: "object",
      additionalProperties: false,
      required: ["score", "issues"],
      properties: {
        score: { type: "number" },
        issues: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    visualDesign: {
      type: "object",
      additionalProperties: false,
      required: ["score", "feedback"],
      properties: {
        score: { type: "number" },
        feedback: { type: "string" }
      }
    },
    conversion: {
      type: "object",
      additionalProperties: false,
      required: ["score", "feedback"],
      properties: {
        score: { type: "number" },
        feedback: { type: "string" }
      }
    },
    topProblems: {
      type: "array",
      items: { type: "string" }
    },
    actionableImprovements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        }
      }
    }
  }
} as const;

const basePrompt = `You are a senior product designer reviewing a UI screenshot.

Analyze:
1. Visual hierarchy
2. UX and usability
3. Typography, spacing, contrast, layout
4. Conversion effectiveness
5. Top problems
6. Actionable improvements

Rules:
- Avoid generic advice.
- Be specific and practical.
- Do not invent invisible interactions.
- Mention uncertainty if something cannot be determined from the screenshot.
- Write every text field in the JSON output in Russian.
- Use scores from 1 to 10.
- Return only valid JSON.
- If review mode is Roast mode, be sharper but still useful.`;

export function buildCritiquePrompt(screenType: string, reviewMode: string) {
  return `${basePrompt}

Screen type: ${screenType}
Review mode: ${reviewMode}`;
}

export function buildOpenAiPayload(fileId: string, prompt: string) {
  return {
    model: openAiModel,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt
          },
          {
            type: "input_image",
            file_id: fileId,
            detail: "high"
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "design_critique",
        strict: true,
        schema: critiqueSchema
      }
    }
  };
}

export function buildImageFileName(mimeType: string) {
  const subtype = mimeType.split("/")[1] ?? "png";
  const normalizedSubtype = subtype === "jpeg" ? "jpg" : subtype;

  return `critiq-upload.${normalizedSubtype}`;
}
