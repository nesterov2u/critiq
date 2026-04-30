import { jsonError, jsonSuccess } from "@/lib/api";
import {
  errorCodes,
  errorMessages,
  openAiTimeoutMs
} from "@/lib/constants";
import { buildCritiquePrompt, buildOpenAiPayload } from "@/lib/openai";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import {
  extractStructuredOutput,
  isCritiqueResult,
  validateAnalyzeRequest
} from "@/lib/validation";

function logServerError(code: string, error: unknown, details?: Record<string, unknown>) {
  console.error("[analyze]", {
    code,
    message: error instanceof Error ? error.message : String(error),
    ...details
  });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError(errorMessages.missingApiKey, errorCodes.serverError, 500);
  }

  const ip = getRequestIp(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return jsonError(errorMessages.rateLimited, errorCodes.rateLimited, 429);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    logServerError(errorCodes.invalidPayload, error, { ip });
    return jsonError(errorMessages.invalidJson, errorCodes.invalidPayload, 400);
  }

  const validatedPayload = validateAnalyzeRequest(payload);

  if (!validatedPayload.ok) {
    const status = validatedPayload.code === errorCodes.imageTooLarge ? 413 : 400;
    const message =
      validatedPayload.code === errorCodes.unsupportedImage
        ? errorMessages.unsupportedImage
        : validatedPayload.code === errorCodes.imageTooLarge
          ? errorMessages.imageTooLarge
          : errorMessages.invalidPayload;

    return jsonError(message, validatedPayload.code, status);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), openAiTimeoutMs);
    const prompt = buildCritiquePrompt(
      validatedPayload.data.screenType,
      validatedPayload.data.reviewMode
    );
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(buildOpenAiPayload(validatedPayload.data.imageBase64, prompt)),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorText = await response.text();
      logServerError(errorCodes.openAiFailure, errorText, {
        ip,
        status: response.status
      });

      return jsonError(errorMessages.openAiFailure, errorCodes.openAiFailure, 502);
    }

    const completion = (await response.json()) as unknown;
    const parsed = extractStructuredOutput(completion);

    if (!parsed || !isCritiqueResult(parsed)) {
      logServerError(errorCodes.invalidModelResponse, "Invalid structured output", { ip });
      return jsonError(
        errorMessages.invalidModelResponse,
        errorCodes.invalidModelResponse,
        502
      );
    }

    return jsonSuccess(parsed);
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";

    logServerError(isAbort ? errorCodes.openAiFailure : errorCodes.serverError, error, {
      ip
    });

    return jsonError(
      isAbort ? errorMessages.openAiFailure : errorMessages.serverError,
      isAbort ? errorCodes.openAiFailure : errorCodes.serverError,
      isAbort ? 504 : 500
    );
  }
}
