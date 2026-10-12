import { NextResponse } from "next/server";
import { analyzeRoom, SimulationConfigurationError, SimulationRequestError } from "../../../ai/analyze-room";
import { OpenAIConfigurationError, OpenAIRequestError } from "../../../ai/openai";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Fotoğraf yüklenemedi." }, { status: 400 }); }
  const photo = form.get("photo");
  const profile = form.get("profile");
  const intensity = Number(form.get("intensity") ?? 5);
  const durationSeconds = Number(form.get("durationSeconds") ?? 10);
  if (!(photo instanceof File)) return NextResponse.json({ error: "Bir oda fotoğrafı seçin." }, { status: 400 });
  if (!ACCEPTED_TYPES.has(photo.type) || photo.size < 1 || photo.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "JPEG, PNG veya WebP biçiminde, en fazla 4 MB bir fotoğraf yükleyin." }, { status: 400 });
  if (profile !== "isg" && profile !== "ev" && profile !== "okul") return NextResponse.json({ error: "Analiz profili geçersiz." }, { status: 400 });
  if (!Number.isInteger(intensity) || intensity < 1 || intensity > 9 || !Number.isInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 60) return NextResponse.json({ error: "Sarsıntı şiddeti 1–9, süresi 5–60 saniye olmalıdır." }, { status: 400 });
  try {
    return NextResponse.json(await analyzeRoom(photo, profile, intensity, durationSeconds));
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) return NextResponse.json({ error: "Sunucuda OPENAI_API_KEY tanımlı değil. Vercel ortam değişkenlerini veya .env.local dosyasını kontrol edin." }, { status: 503 });
    if (error instanceof OpenAIRequestError) {
      console.error("OpenAI analiz çağrısı başarısız:", error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "OpenAI fotoğrafı analiz edemedi. API anahtarını, model erişimini ve kota durumunu kontrol edip tekrar deneyin." }, { status: 502 });
    }
    if (error instanceof SimulationConfigurationError) return NextResponse.json({ error: "Sunucuda SIMULATION_SERVICE_URL tanımlı değil. PyBullet servisini dağıtıp bu adresi ekleyin." }, { status: 503 });
    if (error instanceof SimulationRequestError) {
      console.error("PyBullet simülasyonu başarısız:", error.message);
      return NextResponse.json({ error: "PyBullet simülasyon servisi isteği işleyemedi. Servis adresini ve oda ölçülerini kontrol edin." }, { status: 502 });
    }
    console.error("Oda analizi başarısız:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analiz sırasında beklenmeyen hata oluştu." }, { status: 422 });
  }
}
