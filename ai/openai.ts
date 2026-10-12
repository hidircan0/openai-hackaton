import "server-only";

const API_URL = "https://api.openai.com/v1/responses";

export class OpenAIConfigurationError extends Error {}
export class OpenAIRequestError extends Error {}

export async function requestStructuredJson<T>(args: {
  name: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: Array<Record<string, unknown>>;
  timeoutMs?: number;
}): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new OpenAIConfigurationError("OPENAI_API_KEY tanımlı değil.");
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-6-sol",
      instructions: args.instructions,
      input: args.input,
      text: { format: { type: "json_schema", name: args.name, strict: true, schema: args.schema } },
    }),
    signal: AbortSignal.timeout(args.timeoutMs ?? 25_000),
  });
  const body = await response.json() as {
    output_text?: string;
    error?: { message?: string };
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (!response.ok) throw new OpenAIRequestError(body.error?.message || `OpenAI API ${response.status} yanıtı verdi.`);
  const text = body.output_text ?? body.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text")?.text;
  if (!text) throw new OpenAIRequestError("OpenAI yanıtında JSON metni bulunamadı.");
  try { return JSON.parse(text) as T; } catch { throw new OpenAIRequestError("OpenAI yanıtı geçerli JSON değil."); }
}

export function strictObject(properties: Record<string, unknown>) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}
