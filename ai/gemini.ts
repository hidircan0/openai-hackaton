import "server-only";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiConfigurationError extends Error {}
export class GeminiRequestError extends Error {}

export async function requestStructuredJson<T>(args: {
  name: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: Array<Record<string, unknown>>;
  timeoutMs?: number;
}): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiConfigurationError("GEMINI_API_KEY tanımlı değil.");

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const response = await fetch(`${API_URL}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: args.instructions }] },
      contents: args.input,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(args.schema),
      },
    }),
    signal: AbortSignal.timeout(args.timeoutMs ?? 25_000),
  });

  const body = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
    error?: { message?: string };
  };
  if (!response.ok) throw new GeminiRequestError(body.error?.message || `Gemini API ${response.status} yanıtı verdi.`);
  const text = body.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
  if (!text) throw new GeminiRequestError(body.promptFeedback?.blockReason
    ? `Gemini isteği engellendi: ${body.promptFeedback.blockReason}`
    : "Gemini yanıtında JSON metni bulunamadı.");
  try { return JSON.parse(text) as T; } catch { throw new GeminiRequestError("Gemini yanıtı geçerli JSON değil."); }
}

export function strictObject(properties: Record<string, unknown>) {
  return { type: "object", properties, required: Object.keys(properties), propertyOrdering: Object.keys(properties), additionalProperties: false };
}

function toGeminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toGeminiSchema);
  if (!value || typeof value !== "object") return value;
  const schema = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(schema)) {
    // Gemini's generationConfig.responseSchema does not accept this JSON Schema field.
    if (key === "additionalProperties") continue;
    if (key === "propertyOrdering" && Array.isArray(entry)) {
      normalized[key] = entry;
      continue;
    }
    if (key === "type" && Array.isArray(entry)) {
      const types = entry.filter((type) => type !== "null");
      normalized.type = String(types[0] ?? "string").toUpperCase();
      if (entry.includes("null")) normalized.nullable = true;
    } else if (key === "type" && typeof entry === "string") {
      normalized.type = entry.toUpperCase();
    } else if (key === "enum" && Array.isArray(entry)) {
      normalized.enum = entry.filter((item) => item !== null);
      if (entry.includes(null)) normalized.nullable = true;
    } else {
      normalized[key] = toGeminiSchema(entry);
    }
  }
  return normalized;
}
