// Server-only Sanity client used for mutations (e.g. stock decrement).
// Requires SANITY_API_WRITE_TOKEN to be set in the environment.
// NEVER import this from a client component — the token must stay on the server.
import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export const hasWriteToken = !!process.env.SANITY_API_WRITE_TOKEN;
