export const screenTypes = [
  "Лендинг",
  "Мобильное приложение",
  "Дашборд",
  "E-commerce",
  "SaaS-продукт"
] as const;

export const reviewModes = [
  "Нейтральный",
  "Сеньор-дизайнер",
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
  invalidPayload: "Некорректные данные запроса.",
  invalidJson: "Тело запроса должно быть валидным JSON.",
  missingApiKey: "OPENAI_API_KEY не настроен.",
  unsupportedImage: "Загрузите изображение PNG, JPG, WEBP или GIF.",
  imageTooLarge: `Изображение должно быть меньше ${maxImageSizeLabel}.`,
  rateLimited: "Слишком много запросов на анализ. Подождите минуту и попробуйте снова.",
  openAiFailure: "Не удалось получить AI-анализ. Попробуйте ещё раз.",
  invalidModelResponse: "Модель вернула некорректный результат анализа.",
  networkError: "Ошибка сети. Проверьте подключение и попробуйте снова.",
  serverError: "Непредвиденная ошибка сервера. Попробуйте снова."
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
