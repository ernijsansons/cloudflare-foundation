/**
 * Brave Search API — independent web index (30B+ pages)
 * Free: 2,000 queries/month
 * API: https://api.search.brave.com/res/v1/web/search
 */

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export interface BraveSearchResponse {
  web?: {
    results?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

export async function braveSearch(
  query: string,
  apiKey: string,
  options?: { count?: number }
): Promise<BraveSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: String(options?.count ?? 10),
  });

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        "X-Subscription-Token": apiKey,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brave search failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as BraveSearchResponse;
  return (
    data.web?.results?.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    })) ?? []
  );
}
