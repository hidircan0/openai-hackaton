import { NextResponse } from "next/server";
import type { AnalyzeResponse } from "../../../scene/analyzeResponse";
import { type AnchoringAnswer, rescoreRoom, RescoreInputError, SimulationRequestError } from "../../../ai/analyze-room";
import { SimulationConfigurationError } from "../../../simulation/service-url";

export const runtime = "nodejs";
export const maxDuration = 60;
const ANSWERS = new Set(["evet", "hayir", "bilmiyorum"]);
const PROFILES = new Set(["isg", "ev", "okul"]);
const ANCHORED = new Set(["yes", "no", "uncertain"]);

/**
 * Kullanıcının "sabit mi" cevaplarıyla odayı yeniden simüle eder; GPT çağrılmaz.
 * Gövde: { analysis: AnalyzeResponse (önceki /api/analyze yanıtı), answers: { [itemId]: "evet" | "hayir" | "bilmiyorum" } }
 * Yanıt: yeni AnalyzeResponse (skor, riskler, 3D izleri ve kalan sorular güncel).
 */
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "İstek gövdesi geçerli JSON değil." }, { status: 400 }); }
  const { analysis, answers } = (body ?? {}) as { analysis?: unknown; answers?: unknown };
  if (!isAnalysis(analysis)) return NextResponse.json({ error: "Önceki analiz eksik ya da bozuk; odayı yeniden analiz edin." }, { status: 400 });
  if (!answers || typeof answers !== "object" || Array.isArray(answers) || !Object.values(answers).every((value) => typeof value === "string" && ANSWERS.has(value))) {
    return NextResponse.json({ error: "Cevaplar evet, hayir ya da bilmiyorum olmalı." }, { status: 400 });
  }
  try {
    return NextResponse.json(await rescoreRoom(analysis, answers as Record<string, AnchoringAnswer>));
  } catch (error) {
    if (error instanceof RescoreInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof SimulationConfigurationError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof SimulationRequestError) {
      console.error("PyBullet yeniden hesaplaması başarısız:", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("Yeniden hesaplama başarısız:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Yeniden hesaplama sırasında beklenmeyen hata oluştu." }, { status: 422 });
  }
}

function isAnalysis(value: unknown): value is AnalyzeResponse {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<AnalyzeResponse>;
  const dimensions = analysis.room?.dimensions;
  return typeof analysis.profile === "string" && PROFILES.has(analysis.profile)
    && !!dimensions && [dimensions.widthCm, dimensions.depthCm, dimensions.heightCm].every(Number.isFinite)
    && Array.isArray(analysis.room?.exits) && Array.isArray(analysis.risks) && typeof analysis.commentary?.roomComment === "string"
    && Number.isInteger(analysis.simulation?.intensity) && Number.isInteger(analysis.simulation?.durationSeconds)
    && Array.isArray(analysis.items) && analysis.items.every((item) => !!item && typeof item.id === "string" && typeof item.type === "string"
      && !!item.before?.footprint && !!item.dimensions && ANCHORED.has(item.anchored));
}
