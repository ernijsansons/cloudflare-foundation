/**
 * Robust JSON extraction from LLM responses.
 * Handles: markdown fences, conversational prefixes, nested structures.
 */

export interface ExtractJSONOptions {
  /** If true, prefer extracting objects over arrays when both are present */
  preferObject?: boolean;
}

/**
 * Extract JSON from LLM response text.
 * Tries multiple strategies in order of confidence:
 * 1. Markdown code fence (```json ... ```)
 * 2. Balanced brace extraction for objects
 * 3. Balanced bracket extraction for arrays
 * 4. Direct parse of trimmed text
 *
 * When preferObject is true and the response contains both an object and array,
 * the object will be returned. This is useful when the schema expects an object
 * but the LLM may have returned an array.
 */
export function extractJSON<T = unknown>(text: string, options?: ExtractJSONOptions): T {
  const preferObject = options?.preferObject ?? true; // Default to preferring objects

  // 1. Try markdown code fence first (highest confidence)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const candidate = fenceMatch[1]!.trim();
    try {
      const parsed = JSON.parse(candidate);
      // If preferObject and we got an array, check if there's an object elsewhere
      if (preferObject && Array.isArray(parsed)) {
        const objectExtracted = extractBalancedJSON(text);
        if (objectExtracted) {
          try {
            const objParsed = JSON.parse(objectExtracted);
            if (!Array.isArray(objParsed)) {
              return objParsed as T;
            }
          } catch {
            // Fall through to return the array
          }
        }
      }
      return parsed as T;
    } catch {
      // Fence content wasn't valid JSON, continue to other methods
    }
  }

  // 2. Balanced brace extraction (handles conversational prefixes)
  const extracted = extractBalancedJSON(text);
  if (extracted) {
    try {
      return JSON.parse(extracted) as T;
    } catch {
      // Matched braces but invalid JSON inside
    }
  }

  // 3. Try array extraction (only if we didn't find an object, or preferObject is false)
  const arrayExtracted = extractBalancedArray(text);
  if (arrayExtracted) {
    try {
      return JSON.parse(arrayExtracted) as T;
    } catch {
      // Matched brackets but invalid JSON inside
    }
  }

  // 4. Last resort: try parsing entire text
  try {
    return JSON.parse(text.trim()) as T;
  } catch {
    throw new Error(
      `Failed to extract JSON from LLM response. ` +
        `First 100 chars: "${text.slice(0, 100).replace(/\n/g, "\\n")}..."`
    );
  }
}

/**
 * Extract the first balanced JSON object from text.
 * Handles escaped characters inside strings.
 */
function extractBalancedJSON(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\" && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Extract the first balanced JSON array from text.
 * Handles escaped characters inside strings.
 */
function extractBalancedArray(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\" && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === "]") {
      depth--;
      if (depth === 0 && start >= 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}
