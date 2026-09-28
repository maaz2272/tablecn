import { createFetch } from "@better-fetch/fetch";
import { z } from "zod";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export const $fetch = createFetch({
  baseURL: getBaseUrl(),
  throw: false,
  retry: {
    type: "linear",
    attempts: 2,
    delay: 200,
  },
});

export const apiErrorSchema = z.object({
  error: z.string(),
  issues: z.array(z.any()).optional(),
});
