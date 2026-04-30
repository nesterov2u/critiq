import { rateLimitMaxRequests, rateLimitWindowMs } from "@/lib/constants";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs
    });

    return {
      allowed: true,
      remaining: rateLimitMaxRequests - 1
    };
  }

  if (existing.count >= rateLimitMaxRequests) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: rateLimitMaxRequests - existing.count
  };
}

export function resetRateLimitStore() {
  rateLimitStore.clear();
}
