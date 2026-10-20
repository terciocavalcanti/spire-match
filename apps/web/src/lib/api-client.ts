import { SpireApiClient } from "@spire/api-client";

export const apiClient = new SpireApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
});
