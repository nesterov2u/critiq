import test from "node:test";
import assert from "node:assert/strict";
import { errorCodes, reviewModes, screenTypes } from "@/lib/constants";
import {
  estimateBase64SizeBytes,
  extractStructuredOutput,
  isCritiqueResult,
  validateAnalyzeRequest
} from "@/lib/validation";

const validCritique = {
  overallScore: 8,
  summary: "Clear structure with a weak CTA focus.",
  visualHierarchy: {
    score: 8,
    feedback: "Headline and hero image lead the eye well."
  },
  uxUsability: {
    score: 7,
    issues: ["Primary CTA blends into surrounding cards."]
  },
  visualDesign: {
    score: 8,
    feedback: "Spacing is mostly consistent."
  },
  conversion: {
    score: 6,
    feedback: "Value proposition is clear but CTA emphasis is modest."
  },
  topProblems: ["CTA lacks contrast."],
  actionableImprovements: [
    {
      title: "Increase CTA contrast",
      description: "Use a stronger color and more surrounding whitespace."
    }
  ]
};

test("validateAnalyzeRequest accepts a valid payload", () => {
  const result = validateAnalyzeRequest({
    imageBase64: "data:image/png;base64,aGVsbG8=",
    screenType: screenTypes[0],
    reviewMode: reviewModes[0]
  });

  assert.equal(result.ok, true);
});

test("validateAnalyzeRequest rejects invalid screen type", () => {
  const result = validateAnalyzeRequest({
    imageBase64: "data:image/png;base64,aGVsbG8=",
    screenType: "Admin",
    reviewMode: reviewModes[0]
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, errorCodes.invalidPayload);
  }
});

test("validateAnalyzeRequest rejects unsupported image mime type", () => {
  const result = validateAnalyzeRequest({
    imageBase64: "data:image/svg+xml;base64,aGVsbG8=",
    screenType: screenTypes[0],
    reviewMode: reviewModes[0]
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, errorCodes.unsupportedImage);
  }
});

test("validateAnalyzeRequest rejects oversized payload", () => {
  const largeBase64 = "a".repeat(4_300_000);
  const result = validateAnalyzeRequest({
    imageBase64: `data:image/png;base64,${largeBase64}`,
    screenType: screenTypes[0],
    reviewMode: reviewModes[0]
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, errorCodes.imageTooLarge);
  }
});

test("estimateBase64SizeBytes calculates decoded size", () => {
  assert.equal(estimateBase64SizeBytes("aGVsbG8="), 5);
});

test("isCritiqueResult validates the critique contract", () => {
  assert.equal(isCritiqueResult(validCritique), true);
  assert.equal(
    isCritiqueResult({
      ...validCritique,
      visualHierarchy: { score: 11, feedback: "Too high." }
    }),
    false
  );
});

test("extractStructuredOutput prefers parsed structured content", () => {
  const payload = {
    output: [
      {
        content: [
          {
            parsed: validCritique
          }
        ]
      }
    ]
  };

  assert.deepEqual(extractStructuredOutput(payload), validCritique);
});

test("extractStructuredOutput falls back to output_text parsing", () => {
  const payload = {
    output_text: JSON.stringify(validCritique)
  };

  assert.deepEqual(extractStructuredOutput(payload), validCritique);
});
