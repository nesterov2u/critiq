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
