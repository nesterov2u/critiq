import {
  errorCodes,
  maxImageSizeBytes,
  reviewModes,
  screenTypes,
  supportedImageMimeTypes
} from "@/lib/constants";
import type { AnalyzeRequest, CritiqueResult } from "@/lib/types";

type ValidationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: (typeof errorCodes)[keyof typeof errorCodes];
    };

const score = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 10;

const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function isAnalyzeRequest(value: unknown): value is AnalyzeRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.imageBase64 === "string" &&
    payload.imageBase64.length > 0 &&
    screenTypes.includes(payload.screenType as AnalyzeRequest["screenType"]) &&
    reviewModes.includes(payload.reviewMode as AnalyzeRequest["reviewMode"])
  );
}

export function isSupportedImageMimeType(value: string) {
  return supportedImageMimeTypes.includes(
    value as (typeof supportedImageMimeTypes)[number]
  );
}

export function isDataUrl(value: string) {
  return /^data:[a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

export function getImageMimeType(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match?.[1]?.toLowerCase() ?? null;
}

export function getBase64Body(dataUrl: string) {
  const parts = dataUrl.split(",", 2);
  return parts[1] ?? "";
}

export function estimateBase64SizeBytes(base64: string) {
  const normalized = base64.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;

  return Math.floor((normalized.length * 3) / 4) - padding;
}

export function validateAnalyzeRequest(value: unknown): ValidationResult<AnalyzeRequest> {
  if (!isAnalyzeRequest(value)) {
    return {
      ok: false,
      code: errorCodes.invalidPayload
    };
  }

  if (!isDataUrl(value.imageBase64)) {
    return {
      ok: false,
      code: errorCodes.invalidPayload
    };
  }

  const mimeType = getImageMimeType(value.imageBase64);

  if (!mimeType || !isSupportedImageMimeType(mimeType)) {
    return {
      ok: false,
      code: errorCodes.unsupportedImage
    };
  }

  const sizeInBytes = estimateBase64SizeBytes(getBase64Body(value.imageBase64));

  if (sizeInBytes > maxImageSizeBytes) {
    return {
      ok: false,
      code: errorCodes.imageTooLarge
    };
  }

  return {
    ok: true,
    data: value
  };
}

export function isCritiqueResult(value: unknown): value is CritiqueResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, unknown>;
  const visualHierarchy = result.visualHierarchy as Record<string, unknown>;
  const uxUsability = result.uxUsability as Record<string, unknown>;
  const visualDesign = result.visualDesign as Record<string, unknown>;
  const conversion = result.conversion as Record<string, unknown>;

  return (
    score(result.overallScore) &&
    typeof result.summary === "string" &&
    !!visualHierarchy &&
    score(visualHierarchy.score) &&
    typeof visualHierarchy.feedback === "string" &&
    !!uxUsability &&
    score(uxUsability.score) &&
    isStringArray(uxUsability.issues) &&
    !!visualDesign &&
    score(visualDesign.score) &&
    typeof visualDesign.feedback === "string" &&
    !!conversion &&
    score(conversion.score) &&
    typeof conversion.feedback === "string" &&
    isStringArray(result.topProblems) &&
    Array.isArray(result.actionableImprovements) &&
    result.actionableImprovements.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).title === "string" &&
        typeof (item as Record<string, unknown>).description === "string"
    )
  );
}

export function extractJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function extractStructuredOutput(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
        parsed?: unknown;
      }>;
    }>;
  };

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content?.parsed) {
        return content.parsed;
      }
    }
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        const parsed = extractJson(content.text);

        if (parsed) {
          return parsed;
        }
      }
    }
  }

  if (typeof response.output_text === "string") {
    return extractJson(response.output_text);
  }

  return null;
}
