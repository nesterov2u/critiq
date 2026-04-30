import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "@/app/api/analyze/route";
import { errorCodes, rateLimitMaxRequests, reviewModes, screenTypes } from "@/lib/constants";
import { resetRateLimitStore } from "@/lib/rate-limit";

const originalFetch = global.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;

const validPayload = {
  imageBase64: "data:image/png;base64,aGVsbG8=",
  screenType: screenTypes[0],
  reviewMode: reviewModes[0]
};

const critique = {
  overallScore: 8,
  summary: "Полезная критика интерфейса.",
  visualHierarchy: {
    score: 8,
    feedback: "Контраст и акценты читаются уверенно."
  },
  uxUsability: {
    score: 7,
    issues: ["Навигационные элементы выглядят недостаточно заметно."]
  },
  visualDesign: {
    score: 8,
    feedback: "Отступы в целом выглядят последовательно."
  },
  conversion: {
    score: 6,
    feedback: "Иерархию CTA стоит сделать заметно сильнее."
  },
  topProblems: ["Главный CTA недостаточно выделен."],
  actionableImprovements: [
    {
      title: "Усилить главный CTA",
      description: "Добавьте больше контраста и свободного пространства вокруг кнопки."
    }
  ]
};

function createRequest(body: string, ip = "127.0.0.1") {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip
    },
    body
  });
}

test.beforeEach(() => {
  resetRateLimitStore();
  process.env.OPENAI_API_KEY = "test-key";
});

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey) {
    process.env.OPENAI_API_KEY = originalApiKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

test("POST returns 500 when OPENAI_API_KEY is missing", async () => {
  delete process.env.OPENAI_API_KEY;

  const response = await POST(createRequest(JSON.stringify(validPayload)));
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.equal(payload.ok, false);
  assert.equal(payload.code, errorCodes.serverError);
});

test("POST returns 400 for malformed JSON", async () => {
  const response = await POST(createRequest("{"));
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.code, errorCodes.invalidPayload);
});

test("POST returns 429 when rate limit is exceeded", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("/v1/files")) {
      return new Response(JSON.stringify({ id: "file_123" }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        output: [{ content: [{ parsed: critique }] }]
      }),
      { status: 200 }
    );
  };

  for (let index = 0; index < rateLimitMaxRequests; index += 1) {
    const response = await POST(createRequest(JSON.stringify(validPayload), "10.0.0.1"));
    assert.notEqual(response.status, 429);
  }

  const limitedResponse = await POST(
    createRequest(JSON.stringify(validPayload), "10.0.0.1")
  );
  const payload = await limitedResponse.json();

  assert.equal(limitedResponse.status, 429);
  assert.equal(payload.code, errorCodes.rateLimited);
});

test("POST returns 502 when OpenAI fails", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("/v1/files")) {
      return new Response("upstream failure", { status: 500 });
    }

    return new Response("upstream failure", { status: 500 });
  };

  const response = await POST(createRequest(JSON.stringify(validPayload)));
  const payload = await response.json();

  assert.equal(response.status, 502);
  assert.equal(payload.ok, false);
  assert.equal(payload.code, errorCodes.openAiFailure);
});

test("POST returns 502 when model response is invalid", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("/v1/files")) {
      return new Response(JSON.stringify({ id: "file_123" }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({ summary: "missing most required fields" })
      }),
      { status: 200 }
    );
  };

  const response = await POST(createRequest(JSON.stringify(validPayload)));
  const payload = await response.json();

  assert.equal(response.status, 502);
  assert.equal(payload.ok, false);
  assert.equal(payload.code, errorCodes.invalidModelResponse);
});

test("POST returns structured critique data on success", async () => {
  global.fetch = async (input) => {
    const url = String(input);

    if (url.includes("/v1/files")) {
      return new Response(JSON.stringify({ id: "file_123" }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        output: [{ content: [{ parsed: critique }] }]
      }),
      { status: 200 }
    );
  };

  const response = await POST(createRequest(JSON.stringify(validPayload)));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.deepEqual(payload.data, critique);
});
