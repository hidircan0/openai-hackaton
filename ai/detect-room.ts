import "server-only";
import { requestStructuredJson, strictObject } from "./openai";
import { buildDetectRoomInstructions, DETECT_ROOM_USER_TEXT } from "./prompts/detect-room-prompt";

export type Detection = {
  room: { type: string; dimensions: { widthCm: number; depthCm: number; heightCm: number }; exits: Array<{ type: string; wall: string; startCm: number; endCm: number; widthCm: number }>; warnings: string[] };
  items: Array<{ id: string; type: string; before: { footprint: { x1: number; y1: number; x2: number; y2: number }; bottomZ: number; topZ: number }; dimensions: { widthCm: number; depthCm: number; heightCm: number }; fallDirection: { description: string; axis: "+x" | "-x" | "+y" | "-y" | null }; anchored: "yes" | "no" | "uncertain"; wallMounted: boolean; hasHeavyOrFragileLoad: boolean; fragile: boolean; confidence: number }>;
};

const number = { type: "number" };
const text = { type: "string" };
const footprint = strictObject({ x1: number, y1: number, x2: number, y2: number });
const schema = strictObject({
  room: strictObject({
    type: text,
    dimensions: strictObject({ widthCm: number, depthCm: number, heightCm: number }),
    exits: { type: "array", items: strictObject({ type: text, wall: { type: "string", enum: ["+x", "-x", "+y", "-y"] }, startCm: number, endCm: number, widthCm: number }) },
    warnings: { type: "array", items: text },
  }),
  items: { type: "array", maxItems: 25, items: strictObject({
    id: text,
    type: { type: "string", enum: ["bookcase", "wardrobe", "cabinet", "shelf", "tv", "mirror", "glass", "desk", "chair", "sofa", "refrigerator", "stack", "bed", "door", "cable", "extinguisher"] },
    before: strictObject({ footprint, bottomZ: number, topZ: number }),
    dimensions: strictObject({ widthCm: number, depthCm: number, heightCm: number }),
    fallDirection: strictObject({ description: text, axis: { type: ["string", "null"], enum: ["+x", "-x", "+y", "-y", null] } }),
    anchored: { type: "string", enum: ["yes", "no", "uncertain"] },
    wallMounted: { type: "boolean" }, hasHeavyOrFragileLoad: { type: "boolean" }, fragile: { type: "boolean" }, confidence: number,
  }) },
});

export async function detectRoom(photo: File, profile: string, timeoutMs = 60_000): Promise<Detection> {
  const dataUrl = `data:${photo.type};base64,${Buffer.from(await photo.arrayBuffer()).toString("base64")}`;
  const output = await requestStructuredJson<Detection>({
    name: "room_detection",
    schema,
    timeoutMs,
    instructions: buildDetectRoomInstructions(profile),
    input: [{ role: "user", content: [
      { type: "input_text", text: DETECT_ROOM_USER_TEXT },
      { type: "input_image", image_url: dataUrl, detail: "high" },
    ] }],
  });
  const { widthCm, depthCm, heightCm } = output.room.dimensions;
  if (![widthCm, depthCm, heightCm].every((value) => Number.isFinite(value) && value > 0)) throw new Error("Fotoğraftan oda ölçüleri çıkarılamadı; daha geniş açıdan yeni fotoğraf deneyin.");
  if (output.items.length === 0) throw new Error("Fotoğrafta analiz edilebilir eşya bulunamadı.");
  // Tekrarlanan kimlikler analyze-room.ts'de sıra ekiyle düzeltilir.
  if (output.items.length > 25) throw new Error("Algılanan eşya listesi 25 öğeyi aşamaz; daha dar açılı bir fotoğraf deneyin.");
  const items = output.items.map((item) => {
    const f = item.before.footprint;
    const height = item.before.topZ - item.before.bottomZ;
    if (![f.x1, f.y1, f.x2, f.y2, item.before.bottomZ, item.before.topZ, item.confidence].every(Number.isFinite) || f.x1 < 0 || f.y1 < 0 || f.x2 <= f.x1 || f.y2 <= f.y1 || f.x2 > widthCm || f.y2 > depthCm || item.before.bottomZ < 0 || height <= 0 || item.before.topZ > heightCm || item.confidence < 0 || item.confidence > 1) throw new Error(`Fotoğraftan geçerli oda içinde ölçü çıkarılamadı: ${item.id}`);
    return { ...item, dimensions: { widthCm: f.x2 - f.x1, depthCm: f.y2 - f.y1, heightCm: height } };
  });
  return { ...output, items };
}

export type Commentary = { roomComment: string; riskComments: Array<{ itemId: string; reason: string; recommendedAction: string }> };
const commentarySchema = strictObject({
  roomComment: text,
  riskComments: { type: "array", items: strictObject({ itemId: text, reason: text, recommendedAction: text }) },
});

export async function writeCommentary(profile: string, calculated: Record<string, unknown>, timeoutMs = 18_000): Promise<Commentary> {
  return requestStructuredJson<Commentary>({
    name: "room_commentary",
    schema: commentarySchema,
    timeoutMs,
    instructions: "Türkçe, kısa ve anlaşılır gerekçe/önlem yaz. Yalnızca verilen riskleri açıkla. Skor ve tüm sayısal hesaplar sabittir; yeni sayı, skor veya risk ekleme, hiçbir sayısal değeri değiştirme. Fotoğrafta görünmeyen bilgiyi uydurma. İSG profili profesyonel, ev/okul profili sade dille yazılsın.",
    input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ profile, ...calculated }) }] }],
  });
}
