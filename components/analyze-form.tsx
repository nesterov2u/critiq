"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Brain,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  errorCodes,
  errorMessages,
  maxImageSizeBytes,
  maxImageSizeLabel,
  reviewModes,
  screenTypes,
  supportedImageMimeTypes
} from "@/lib/constants";
import type {
  AnalyzeResponse,
  CritiqueResult,
  ReviewMode,
  ScreenType
} from "@/lib/types";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read image."));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

function getUploadValidationError(file: File) {
  const normalizedType = file.type.toLowerCase();

  if (!supportedImageMimeTypes.includes(normalizedType as (typeof supportedImageMimeTypes)[number])) {
    return errorMessages.unsupportedImage;
  }

  if (file.size > maxImageSizeBytes) {
    return errorMessages.imageTooLarge;
  }

  return "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getErrorMessage(response: AnalyzeResponse | null) {
  if (!response || response.ok) {
    return errorMessages.serverError;
  }

  if (response.error) {
    if (response.code === errorCodes.serverError) {
      return response.error;
    }
  }

  switch (response.code) {
    case errorCodes.invalidPayload:
      return errorMessages.invalidPayload;
    case errorCodes.unsupportedImage:
      return errorMessages.unsupportedImage;
    case errorCodes.imageTooLarge:
      return errorMessages.imageTooLarge;
    case errorCodes.rateLimited:
      return errorMessages.rateLimited;
    case errorCodes.openAiFailure:
      return errorMessages.openAiFailure;
    case errorCodes.invalidModelResponse:
      return errorMessages.invalidModelResponse;
    case errorCodes.serverError:
      return response.error || errorMessages.serverError;
    default:
      return response.error || errorMessages.serverError;
  }
}

function ScoreBadge({
  score,
  tone = "default"
}: {
  score: number;
  tone?: "default" | "dark";
}) {
  return (
    <div
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        tone === "dark"
          ? "bg-primary text-primary-foreground"
          : "bg-[#edf4ff] text-foreground"
      ].join(" ")}
    >
      {score}/10
    </div>
  );
}

function MetricRow({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-foreground/55">{label}</p>
      <p className="text-[1.85rem] font-medium leading-none text-foreground">{value}</p>
      <p
        className={[
          "text-sm",
          tone === "positive"
            ? "text-green-600"
            : tone === "warning"
              ? "text-amber-600"
              : "text-foreground/55"
        ].join(" ")}
      >
        {tone === "positive" ? "Норма" : tone === "warning" ? "Нужна проверка" : "В реальном времени"}
      </p>
    </div>
  );
}

function RadialScore({ score }: { score: number }) {
  const dots = Array.from({ length: 24 });

  return (
    <div className="relative flex aspect-square items-center justify-center">
      <div className="absolute inset-0">
        {dots.map((_, index) => {
          const rotation = (360 / dots.length) * index;

          return (
            <span
              key={rotation}
              className="absolute left-1/2 top-1/2 h-[45%] w-px -translate-x-1/2 -translate-y-full origin-bottom bg-gradient-to-t from-[#d4e3f8] to-transparent"
              style={{ transform: `translate(-50%, -100%) rotate(${rotation}deg)` }}
            >
              <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 rounded-full bg-[#88afdb]" />
            </span>
          );
        })}
      </div>
      <div className="relative rounded-full bg-white/80 px-10 py-12 text-center shadow-[0_18px_40px_rgba(113,143,193,0.14)]">
        <div className="font-display text-6xl leading-none text-foreground">{score}%</div>
        <div className="mt-3 text-sm text-foreground/60">Индекс качества</div>
      </div>
    </div>
  );
}

function TrendLine({ points }: { points: number[] }) {
  return (
    <div className="relative h-44 rounded-[24px] bg-[#f7f9fe] p-4">
      <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-[#d1ddef]" />
      <div className="flex h-full items-end justify-between gap-2">
        {points.map((point, index) => (
          <div key={`${point}-${index}`} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="mx-auto size-3 rounded-full border-4 border-[#f7f9fe] bg-[#7da4d9]"
              style={{ marginBottom: `${point}%` }}
            />
            <div className="mt-3 h-px bg-[#dde7f6]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">
          {eyebrow}
        </p>
        <h3 className="font-display text-[2.15rem] leading-none text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function AnalyzeForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [screenType, setScreenType] = useState<ScreenType>("Лендинг");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("Нейтральный");
  const [result, setResult] = useState<CritiqueResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedAnalyze, setHasAttemptedAnalyze] = useState(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string>("");

  const hasImage = useMemo(() => Boolean(file && previewUrl), [file, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const trendPoints = useMemo(() => {
    if (!result) {
      return [46, 44, 50, 47, 56, 52, 58];
    }

    return [
      result.visualHierarchy.score * 6,
      result.uxUsability.score * 6,
      result.visualDesign.score * 6,
      result.conversion.score * 6,
      result.overallScore * 6,
      Math.min(result.overallScore * 6 + 4, 84),
      Math.max(result.overallScore * 6 - 3, 28)
    ];
  }, [result]);

  const topProblems = result?.topProblems ?? [
    "После анализа здесь появятся ключевые проблемы и трение в иерархии или CTA.",
    "Система сохраняет последний успешный результат на экране.",
    "Для самого точного ревью загружайте один чистый и читаемый экран."
  ];

  const improvements = result?.actionableImprovements ?? [
    {
      title: "Более точные точки решения",
      description: "AI предложит конкретные тактические изменения интерфейса вместо расплывчатых советов."
    },
    {
      title: "Критика, основанная на скриншоте",
      description: "Анализ опирается на видимые элементы интерфейса и не выдумывает скрытые взаимодействия."
    }
  ];

  const updateFile = (nextFile: File | null) => {
    setError("");

    if (!nextFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(null);
      setPreviewUrl("");
      return;
    }

    const validationError = getUploadValidationError(nextFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  const resetUpload = () => {
    updateFile(null);
    setHasAttemptedAnalyze(false);
    setResult(null);
    setLastAnalyzedAt("");
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFile(event.target.files?.[0] ?? null);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    updateFile(event.dataTransfer.files?.[0] ?? null);
  };

  const onAnalyze = async () => {
    if (!file) {
      setError("Загрузите скриншот перед запуском анализа.");
      return;
    }

    const validationError = getUploadValidationError(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setHasAttemptedAnalyze(true);
    setIsLoading(true);
    setError("");

    try {
      const imageBase64 = await toBase64(file);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64,
          screenType,
          reviewMode
        })
      });

      const rawPayload = (await response.json().catch(() => null)) as AnalyzeResponse | null;

      if (!rawPayload) {
        throw new Error("Сервер вернул нечитаемый ответ.");
      }

      if (!response.ok || !rawPayload.ok) {
        throw new Error(getErrorMessage(rawPayload));
      }

      setResult(rawPayload.data);
      setLastAnalyzedAt(
        new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "long",
          hour: "2-digit",
          minute: "2-digit"
        }).format(new Date())
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : errorMessages.serverError
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[40px] border border-white/20 bg-white/8 px-4 py-4 shadow-[0_24px_80px_rgba(58,87,134,0.18)] backdrop-blur-[10px] sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-x-1/3 top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-6%] top-24 h-96 w-96 rounded-full border border-white/20" />
        <div className="absolute left-[55%] top-10 grid grid-cols-6 gap-2 opacity-20">
          {Array.from({ length: 54 }).map((_, index) => (
            <span key={index} className="size-1.5 rounded-full bg-white" />
          ))}
        </div>
      </div>

      <div className="relative z-10 space-y-5">
        <header className="flex items-center gap-3 text-white">
          <div className="flex items-center gap-3 text-white">
            <div className="flex size-10 items-center justify-center rounded-full border border-white/35 bg-white/15 backdrop-blur-md">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-display text-[2rem] leading-none">Critiq</p>
              <p className="text-sm text-white/72">AI-анализ дизайна</p>
            </div>
          </div>
        </header>

        <section className="pt-3">
          <div className="space-y-4 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/82 backdrop-blur-md">
              <ScanSearch className="size-3.5" />
              Обзор дизайн-критики
            </div>
            <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Обзор интерфейсной диагностики
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/82 sm:text-xl">
              AI-интерпретация иерархии интерфейса, UX-проблем, конверсионного трения
              и визуального качества по одному скриншоту.
            </p>
          </div>
        </section>

        <section>
          <Card className="overflow-hidden">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-10">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#567ab0]">
                  <Upload className="size-3.5" />
                  Первый шаг
                </div>
                <div className="space-y-3">
                  <h2 className="font-display text-4xl leading-[0.95] text-foreground sm:text-5xl">
                    Сначала загрузите скриншот
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-foreground/68 sm:text-lg">
                    Это главный вход в продукт. Загрузите один чистый экран, а затем выберите
                    тип интерфейса и режим ревью для более точной критики.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-foreground/62">
                  <div className="rounded-full bg-[#f4f8ff] px-4 py-2">
                    PNG, JPG, WEBP, GIF
                  </div>
                  <div className="rounded-full bg-[#f4f8ff] px-4 py-2">
                    До {maxImageSizeLabel}
                  </div>
                  <div className="rounded-full bg-[#f4f8ff] px-4 py-2">
                    Один экран = лучший результат
                  </div>
                </div>
              </div>

              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
                className="group flex min-h-[20rem] cursor-pointer flex-col items-center justify-center rounded-[36px] border border-dashed border-[#b7ccef] bg-[#f7faff] px-8 py-10 text-center transition hover:border-[#7ca5d8] hover:bg-white"
              >
                <input type="file" accept="image/*" className="sr-only" onChange={onInputChange} />
                {hasImage ? (
                  <div className="flex w-full max-w-xl flex-col items-center">
                    <div className="mb-5 rounded-full bg-[#e7f0ff] p-6 text-[#5d7fb5] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <ImagePlus className="size-9" />
                    </div>
                    <p className="text-2xl font-medium text-foreground">
                      Скриншот загружен
                    </p>
                    <p className="mt-3 text-base leading-8 text-foreground/62">
                      {file?.name ?? "Файл готов к анализу"}
                    </p>
                    <Button
                      className="mt-8 h-14 w-full max-w-sm text-base"
                      onClick={(event) => {
                        event.preventDefault();
                        void onAnalyze();
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoaderCircle className="mr-2 size-4 animate-spin" />
                          Анализируем
                        </>
                      ) : (
                        "Запустить анализ"
                      )}
                    </Button>
                    <div className="mt-3 text-sm text-foreground/52">
                      Или нажмите сюда ещё раз, чтобы заменить файл
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 rounded-full bg-[#e7f0ff] p-7 text-[#5d7fb5] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <Upload className="size-10" />
                    </div>
                    <p className="text-2xl font-medium text-foreground">
                      Перетащите скриншот для анализа
                    </p>
                    <p className="mt-4 max-w-lg text-lg leading-9 text-foreground/62">
                      PNG, JPG, WEBP или GIF до {maxImageSizeLabel}. Один чистый экран даёт лучший результат.
                    </p>
                    <div className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm">
                      Или нажмите, чтобы выбрать файл
                    </div>
                  </>
                )}
              </label>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <Card className="xl:col-span-4">
            <div className="space-y-6 p-5 sm:p-6">
              <SectionTitle eyebrow="Входные данные" title="Сеанс анализа" />

              <div className="rounded-[24px] bg-[#f7f9fe] p-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#dfe7f4] pb-3">
                    <span className="flex items-center gap-2 text-foreground/65">
                      <span className="size-2 rounded-full bg-[#7aa2d7]" />
                      Статус
                    </span>
                    <span className="font-medium text-foreground">
                      {isLoading
                        ? "Анализируем"
                        : result
                          ? "Анализ готов"
                          : hasImage
                            ? "Готов к запуску"
                            : "Ожидает скриншот"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#dfe7f4] pb-3">
                    <span className="flex items-center gap-2 text-foreground/65">
                      <span className="size-2 rounded-full bg-[#4e6ea8]" />
                      Файл
                    </span>
                    <span className="max-w-[13rem] truncate text-right font-medium text-foreground">
                      {file?.name ?? "Не загружен"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#dfe7f4] pb-3">
                    <span className="flex items-center gap-2 text-foreground/65">
                      <span className="size-2 rounded-full bg-[#8eaee0]" />
                      Размер
                    </span>
                    <span className="font-medium text-foreground">
                      {file ? formatFileSize(file.size) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-[#dfe7f4] pb-3">
                    <span className="flex items-center gap-2 text-foreground/65">
                      <span className="size-2 rounded-full bg-[#1d1b3a]" />
                      Режим ревью
                    </span>
                    <span className="font-medium text-foreground">{reviewMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-foreground/65">
                      <span className="size-2 rounded-full bg-[#dbe7fb]" />
                      Тип экрана
                    </span>
                    <span className="font-medium text-foreground">{screenType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-foreground/65">
                      <span className="size-2 rounded-full bg-[#dbe7fb]" />
                      Последний запуск
                    </span>
                    <span className="font-medium text-foreground">
                      {lastAnalyzedAt || "Ещё не запускался"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f7f9fe] p-4">
                <p className="text-sm font-medium text-foreground">Что показывает карточка</p>
                <p className="mt-2 text-sm leading-7 text-foreground/62">
                  Здесь собрана полезная сводка по текущей сессии: какой скриншот выбран, в
                  каком режиме будет идти критика, какой тип экрана анализируется и когда
                  последний раз запускался анализ.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4 xl:col-span-3">
            <Card>
              <div className="space-y-5 p-5 sm:p-6">
                <SectionTitle eyebrow="Управление" title="Параметры" />

                <div className="space-y-3 rounded-[24px] bg-[#f7f9fe] p-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Готовность скриншота</span>
                      <span className="text-[#5b85c1]">{hasImage ? "Загружен" : "Ожидание"}</span>
                    </div>
                    <div className="h-4 rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8ab1e3] to-[#5e87c2]"
                        style={{ width: hasImage ? "84%" : "22%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Глубина анализа</span>
                      <span className="text-[#5b85c1]">{isLoading ? "В процессе" : "Готов"}</span>
                    </div>
                    <div className="h-4 rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6f9ad2] to-[#bad2ee]"
                        style={{
                          width: isLoading
                            ? "88%"
                            : reviewMode === "Roast mode"
                              ? "92%"
                              : reviewMode === "Сеньор-дизайнер"
                                ? "78%"
                                : "62%"
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Select
                    label="Тип экрана"
                    value={screenType}
                    onChange={(event) => setScreenType(event.target.value as ScreenType)}
                  >
                    {screenTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Режим ревью"
                    value={reviewMode}
                    onChange={(event) => setReviewMode(event.target.value as ReviewMode)}
                  >
                    {reviewModes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>

                <Button
                  variant="secondary"
                  className="h-12"
                  onClick={resetUpload}
                  disabled={isLoading}
                >
                  Сбросить сессию
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="space-y-4 p-5 sm:p-6">
                <SectionTitle eyebrow="Общий индекс" title="Индекс качества" />
                <RadialScore score={result ? result.overallScore * 10 : 92} />
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden xl:col-span-5">
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.95fr_0.95fr]">
              <div className="space-y-5">
                <SectionTitle
                  eyebrow="Результат анализа"
                  title={result ? "Итог критики" : "Готово к анализу"}
                  action={result ? <ScoreBadge score={result.overallScore} tone="dark" /> : null}
                />

                <p className="max-w-xl text-base leading-8 text-foreground/68 sm:text-[1.05rem]">
                  {result?.summary ??
                    "Здесь появится структурированная интерпретация загруженного экрана: иерархия, usability, визуальный дизайн и конверсионное давление."}
                </p>

                <div className="grid grid-cols-2 gap-5">
                  <MetricRow
                    label="Визуальная иерархия"
                    value={result ? `${result.visualHierarchy.score}.0` : "8.2"}
                    tone="positive"
                  />
                  <MetricRow
                    label="Визуальный дизайн"
                    value={result ? `${result.visualDesign.score}.0` : "8.6"}
                    tone="positive"
                  />
                  <MetricRow
                    label="UX / usability"
                    value={result ? `${result.uxUsability.score}.0` : "6.4"}
                    tone="warning"
                  />
                  <MetricRow
                    label="Конверсия"
                    value={result ? `${result.conversion.score}.0` : "7.8"}
                    tone={result && result.conversion.score < 7 ? "warning" : "positive"}
                  />
                </div>

                {error ? (
                  <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] bg-[#eaf2fe] p-4">
                <div className="flex h-full min-h-[22rem] flex-col justify-between rounded-[26px] border border-white/45 bg-[#dce9fb] p-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full bg-white/65 px-4 py-2 text-sm text-foreground/72">
                      {hasImage ? "Превью загружено" : "Скриншота пока нет"}
                    </div>
                    {hasImage ? (
                      <Button
                        variant="ghost"
                        className="h-10 bg-white/50 px-4 text-xs"
                        onClick={resetUpload}
                        disabled={isLoading}
                      >
                        Удалить
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-1 items-center justify-center py-6">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Uploaded screenshot preview"
                        className="max-h-[25rem] w-full rounded-[22px] object-contain shadow-[0_18px_60px_rgba(80,108,150,0.18)]"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center text-[#6a84b0]">
                        <div className="rounded-full bg-white/70 p-5">
                          <ImagePlus className="size-10" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Капсула превью</p>
                          <p className="mt-2 max-w-xs text-sm leading-6 text-foreground/55">
                            Здесь появится снимок интерфейса, пока система готовит критику.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-white px-3 py-2 shadow-[0_8px_24px_rgba(78,97,140,0.12)]">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary text-white">
                        <Brain className="size-4" />
                      </div>
                      <span>Состояние критики</span>
                    </div>
                    <div className="rounded-full bg-[#f2f6fd] px-4 py-2 text-sm font-medium text-foreground">
                      {isLoading ? "Анализируем" : result ? "Готово" : "Ожидаем ввод"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-4">
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                    Индекс стабильности
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="font-display text-6xl leading-none text-foreground">
                      {result ? result.overallScore * 10 : 82}
                    </div>
                    <div className="pb-2 text-foreground/55">/100</div>
                  </div>
                  <p className="mt-2 text-lg text-foreground/68">Индекс стабильности восприятия</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-sm text-foreground/65 shadow-sm">
                  Стабильно
                </div>
              </div>
              <TrendLine points={trendPoints} />
            </div>
          </Card>

          <Card className="xl:col-span-3">
            <div className="space-y-5 p-5 sm:p-6">
              <SectionTitle eyebrow="Главные проблемы" title="Карта проблем" />
              <div className="space-y-3">
                {topProblems.slice(0, 3).map((problem) => (
                  <div key={problem} className="rounded-[22px] bg-[#f6f9ff] px-4 py-4 text-sm leading-7 text-foreground/72">
                    {problem}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-5">
            <div className="space-y-5 p-5 sm:p-6">
              <SectionTitle eyebrow="Следующий шаг" title="Практические улучшения" />
              <TrendLine points={[64, 62, 62, 81, 55, 61, 68]} />
              <div className="space-y-3">
                {improvements.slice(0, 2).map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-[24px] bg-[#f7f9fe] p-4"
                  >
                    <div className="max-w-xl">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-foreground/66">
                        {item.description}
                      </p>
                    </div>
                    <div className="rounded-full bg-white p-2 shadow-sm">
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </section>
      </div>
    </div>
  );
}
