"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ImagePlus, LoaderCircle, Sparkles, Upload } from "lucide-react";
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

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
      {score}/10
    </div>
  );
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

function getErrorMessage(response: AnalyzeResponse | null) {
  if (!response || response.ok) {
    return errorMessages.serverError;
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
      return errorMessages.serverError;
    default:
      return response.error || errorMessages.serverError;
  }
}

export function AnalyzeForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [screenType, setScreenType] = useState<ScreenType>("Landing page");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("Neutral");
  const [result, setResult] = useState<CritiqueResult | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedAnalyze, setHasAttemptedAnalyze] = useState(false);

  const hasImage = useMemo(() => Boolean(file && previewUrl), [file, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      setError("Upload a screenshot before starting analysis.");
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
        throw new Error("The server returned an unreadable response.");
      }

      if (!response.ok || !rawPayload.ok) {
        throw new Error(getErrorMessage(rawPayload));
      }

      setResult(rawPayload.data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : errorMessages.serverError
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-5 sm:p-7">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
              <Sparkles className="size-3.5" />
              Structured AI review
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Design Critique AI
            </h1>
            <p className="max-w-xl text-sm leading-6 text-foreground/65 sm:text-base">
              Upload a UI screenshot, choose the context, and get a critique that stays
              concrete instead of generic.
            </p>
          </div>

          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="group flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-foreground/20 bg-white/55 px-6 py-12 text-center transition hover:border-primary/50 hover:bg-white/70"
          >
            <input type="file" accept="image/*" className="sr-only" onChange={onInputChange} />
            <div className="mb-4 rounded-full bg-secondary p-4 text-foreground/70">
              <Upload className="size-6" />
            </div>
            <p className="text-base font-medium">Drag and drop your screenshot</p>
            <p className="mt-2 text-sm text-foreground/60">
              or click to browse PNG, JPG, WEBP, or GIF up to {maxImageSizeLabel}
            </p>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Screen type"
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
              label="Review mode"
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="min-w-36"
              onClick={onAnalyze}
              disabled={!hasImage || isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                "Analyze"
              )}
            </Button>
            <Button
              variant="secondary"
              className="min-w-36"
              onClick={resetUpload}
              disabled={isLoading}
            >
              Reset
            </Button>
            <p className="text-sm text-foreground/55">
              Screenshot goes to the vision model with your chosen review angle.
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Screenshot preview
            </h2>
            {hasImage ? (
              <div className="flex items-center gap-2">
                <span className="max-w-44 truncate text-xs text-foreground/45">{file?.name}</span>
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-xs"
                  onClick={resetUpload}
                  disabled={isLoading}
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex min-h-80 items-center justify-center rounded-[24px] border bg-white/55">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded screenshot preview"
                className="max-h-[32rem] w-full rounded-[20px] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-foreground/45">
                <ImagePlus className="size-10" />
                <p className="text-sm">Your uploaded interface will appear here.</p>
              </div>
            )}
          </div>
        </Card>

        {result ? (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/55">
                    Overall score
                  </p>
                  <div className="text-5xl font-semibold tracking-tight">
                    {result.overallScore}
                  </div>
                </div>
                <ScoreBadge score={result.overallScore} />
              </div>
              <p className="mt-4 text-sm leading-6 text-foreground/75">{result.summary}</p>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Visual hierarchy</h3>
                  <ScoreBadge score={result.visualHierarchy.score} />
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {result.visualHierarchy.feedback}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">UX / usability</h3>
                  <ScoreBadge score={result.uxUsability.score} />
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
                  {result.uxUsability.issues.map((issue) => (
                    <li key={issue} className="rounded-2xl bg-secondary/55 px-3 py-2">
                      {issue}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Visual design</h3>
                  <ScoreBadge score={result.visualDesign.score} />
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {result.visualDesign.feedback}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Conversion</h3>
                  <ScoreBadge score={result.conversion.score} />
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {result.conversion.feedback}
                </p>
              </Card>
            </div>

            <Card className="p-5">
              <h3 className="font-semibold">Top problems</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
                {result.topProblems.map((problem) => (
                  <li key={problem} className="rounded-2xl bg-secondary/55 px-3 py-2">
                    {problem}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold">Actionable improvements</h3>
              <div className="mt-3 space-y-3">
                {result.actionableImprovements.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-secondary/55 p-4">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-foreground/70">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 sm:p-7">
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/55">
                Analysis result
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {hasAttemptedAnalyze ? "Analysis did not complete" : "No critique yet"}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-foreground/65">
                {hasAttemptedAnalyze
                  ? "Fix the issue above and run the analysis again. The app will keep the latest successful critique once you have one."
                  : "Upload a screen, choose the context, and run analysis to see structured design feedback here."}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
