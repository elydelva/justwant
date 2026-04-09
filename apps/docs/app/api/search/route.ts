import { sources } from "@/lib/sources";
import { createFromSource } from "fumadocs-core/search/server";

export const { GET } = createFromSource(sources.cache, {
  language: "english",
});
