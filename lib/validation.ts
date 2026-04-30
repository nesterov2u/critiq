import {
  type AnalyzeRequest,
  type CritiqueResult,
  reviewModes,
  screenTypes
} from "@/lib/types";

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
