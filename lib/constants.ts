export const screenTypes = [
  "Landing page",
  "Mobile app",
  "Dashboard",
  "E-commerce",
  "SaaS product"
] as const;

export const reviewModes = [
  "Neutral",
  "Senior designer",
  "Roast mode"
] as const;

export const supportedImageMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif"
] as const;

export const maxImageSizeBytes = 3 * 1024 * 1024;
export const maxImageSizeLabel = "3 MB";

export const rateLimitWindowMs = 60_000;
export const rateLimitMaxRequests = 5;

export const openAiModel = "gpt-4.1-mini";
export const openAiTimeoutMs = 25_000;

export const errorMessages = {
  invalidPayload: "Invalid request payload.",
  invalidJson: "Request body must be valid JSON.",
  missingApiKey: "OPENAI_API_KEY is not configured.",
  unsupportedImage: "Upload a PNG, JPG, WEBP, or GIF image.",
  imageTooLarge: `Image must be smaller than ${maxImageSizeLabel}.`,
  rateLimited: "Too many analysis requests. Please wait a minute and try again.",
  openAiFailure: "The AI analysis request failed. Please try again.",
  invalidModelResponse: "The model returned an invalid critique response.",
  networkError: "Network error. Please check your connection and try again.",
  serverError: "Unexpected server error. Please try again."
} as const;

export const errorCodes = {
  invalidPayload: "INVALID_PAYLOAD",
  unsupportedImage: "UNSUPPORTED_IMAGE",
  imageTooLarge: "IMAGE_TOO_LARGE",
  rateLimited: "RATE_LIMITED",
  openAiFailure: "OPENAI_FAILURE",
  invalidModelResponse: "INVALID_MODEL_RESPONSE",
  serverError: "SERVER_ERROR"
} as const;
