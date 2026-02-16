/**
 * Unified web search — uses Tavily and/or Brave
 * Triangulates when both available for higher confidence
 * Supports advanced depth and site-restricted searches
 */

import { tavilySearch } from "./tavily-search";
import { braveSearch } from "./brave-search";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  provider: "tavily" | "brave";
}

export interface WebSearchOptions {
  maxResults?: number;
  useTavily?: boolean;
  useBrave?: boolean;
  searchDepth?: "basic" | "advanced";
  siteRestriction?: string;
  deduplicate?: boolean;
}

export async function webSearch(
  query: string,
  env: { TAVILY_API_KEY?: string; BRAVE_API_KEY?: string },
  options?: WebSearchOptions
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const useTavily = options?.useTavily ?? !!env.TAVILY_API_KEY;
  const useBrave = options?.useBrave ?? !!env.BRAVE_API_KEY;
  const maxResults = options?.maxResults ?? 10;
  const searchDepth = options?.searchDepth ?? "basic";
  const siteRestriction = options?.siteRestriction;
  const deduplicate = options?.deduplicate ?? true;

  const effectiveQuery = siteRestriction
    ? `site:${siteRestriction} ${query}`
    : query;

  if (useTavily && env.TAVILY_API_KEY) {
    try {
      const tavily = await tavilySearch(effectiveQuery, env.TAVILY_API_KEY, {
        maxResults,
        searchDepth,
      });
      for (const r of tavily.results ?? []) {
        results.push({
          title: r.title,
          url: r.url,
          content: r.content ?? "",
          provider: "tavily",
        });
      }
    } catch (e) {
      console.warn("Tavily search failed:", e);
    }
  }

  if (useBrave && env.BRAVE_API_KEY) {
    try {
      const brave = await braveSearch(effectiveQuery, env.BRAVE_API_KEY, {
        count: maxResults,
      });
      for (const r of brave) {
        results.push({
          title: r.title,
          url: r.url,
          content: r.description ?? "",
          provider: "brave",
        });
      }
    } catch (e) {
      console.warn("Brave search failed:", e);
    }
  }

  if (results.length === 0) {
    return [
      {
        title: "Search unavailable",
        url: "",
        content: "Configure TAVILY_API_KEY or BRAVE_API_KEY for web search. See planning-machine README.",
        provider: "tavily",
      },
    ];
  }

  if (deduplicate) {
    return deduplicateResults(results);
  }

  return results;
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = r.url || r.title + r.content.slice(0, 100);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
