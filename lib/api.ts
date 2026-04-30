import { NextResponse } from "next/server";
import { errorMessages, type errorCodes } from "@/lib/constants";
import type { AnalyzeErrorResponse, AnalyzeSuccessResponse, CritiqueResult } from "@/lib/types";

export type ApiErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export function jsonSuccess(data: CritiqueResult) {
  return NextResponse.json<AnalyzeSuccessResponse>({ ok: true, data });
}

export function jsonError(
  error: string,
  code?: ApiErrorCode,
  status = 500
) {
  return NextResponse.json<AnalyzeErrorResponse>(
    {
      ok: false,
      error,
      code
    },
    { status }
  );
}

export function getClientErrorMessage(code?: ApiErrorCode) {
  switch (code) {
    case "UNSUPPORTED_IMAGE":
      return errorMessages.unsupportedImage;
    case "IMAGE_TOO_LARGE":
      return errorMessages.imageTooLarge;
    case "RATE_LIMITED":
      return errorMessages.rateLimited;
    case "OPENAI_FAILURE":
      return errorMessages.openAiFailure;
    case "INVALID_MODEL_RESPONSE":
      return errorMessages.invalidModelResponse;
    case "INVALID_PAYLOAD":
      return errorMessages.invalidPayload;
    case "SERVER_ERROR":
      return errorMessages.serverError;
    default:
      return errorMessages.serverError;
  }
}
