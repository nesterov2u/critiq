import { reviewModes, screenTypes } from "@/lib/constants";

export type ScreenType = (typeof screenTypes)[number];
export type ReviewMode = (typeof reviewModes)[number];

export type CritiqueResult = {
  overallScore: number;
  summary: string;
  visualHierarchy: {
    score: number;
    feedback: string;
  };
  uxUsability: {
    score: number;
    issues: string[];
  };
  visualDesign: {
    score: number;
    feedback: string;
  };
  conversion: {
    score: number;
    feedback: string;
  };
  topProblems: string[];
  actionableImprovements: {
    title: string;
    description: string;
  }[];
};

export type AnalyzeRequest = {
  imageBase64: string;
  screenType: ScreenType;
  reviewMode: ReviewMode;
};

export type ApiErrorCode =
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_IMAGE"
  | "IMAGE_TOO_LARGE"
  | "RATE_LIMITED"
  | "OPENAI_FAILURE"
  | "INVALID_MODEL_RESPONSE"
  | "SERVER_ERROR";

export type AnalyzeSuccessResponse = {
  ok: true;
  data: CritiqueResult;
};

export type AnalyzeErrorResponse = {
  ok: false;
  error: string;
  code?: ApiErrorCode;
};

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;
