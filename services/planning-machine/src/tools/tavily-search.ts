/**
 * Tavily Search — AI-optimized web search
 * Free: 1,000 searches/month
 * MCP: https://mcp.tavily.com/mcp/?tavilyApiKey=KEY
 * API: https://api.tavily.com/search
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilySearchResult[];
  query: string;
  answer?: string;
}

export async function tavilySearch(
  query: string,
  apiKey: string,
  options?: { maxResults?: number; searchDepth?: "basic" | "advanced" }
): Promise<TavilySearchResponse> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: options?.searchDepth ?? "basic",
      max_results: options?.maxResults ?? 10,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<TavilySearchResponse>;
}
