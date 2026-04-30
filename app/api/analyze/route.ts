import { NextResponse } from "next/server";
import { extractJson, isAnalyzeRequest, isCritiqueResult } from "@/lib/validation";

const critiqueSchema = {
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

const prompt = `You are a senior product designer reviewing a UI screenshot.

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
- Use scores from 1 to 10.
- Return only valid JSON.
- If review mode is Roast mode, be sharper but still useful.`;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!isAnalyzeRequest(payload)) {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${prompt}

Screen type: ${payload.screenType}
Review mode: ${payload.reviewMode}`
              },
              {
                type: "input_image",
                image_url: payload.imageBase64,
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
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        { ok: false, error: `OpenAI request failed: ${errorText}` },
        { status: 502 }
      );
    }

    const completion = (await response.json()) as {
      output_text?: string;
    };

    const rawText = completion.output_text ?? "";
    const parsed = extractJson(rawText);

    if (!parsed || !isCritiqueResult(parsed)) {
      return NextResponse.json(
        { ok: false, error: "Model returned invalid critique JSON." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data: parsed });
  } catch (caughtError) {
    return NextResponse.json(
      {
        ok: false,
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Unexpected server error."
      },
      { status: 500 }
    );
  }
}
