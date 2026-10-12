import { NextResponse } from "next/server";
import { createShakeVideo, FalShakeConfigurationError, FalShakeInputError } from "../../../../fal/shake-video";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Fotoğraf yüklenemedi." }, { status: 400 }); }
  const photo = form.get("photo");
  const summary = form.get("summary");
  if (!(photo instanceof File) || typeof summary !== "string") return NextResponse.json({ error: "Fotoğraf ve analiz özeti gerekli." }, { status: 400 });
  try { return NextResponse.json({ videoUrl: await createShakeVideo(photo, summary.slice(0, 900)) }); }
  catch (error) {
    if (error instanceof FalShakeConfigurationError) return NextResponse.json({ error: "Sunucuda FAL_KEY tanımlı değil. Vercel ortam değişkenlerini veya .env.local dosyasını kontrol edin." }, { status: 503 });
    if (error instanceof FalShakeInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("fal.ai sarsıntı videosu üretimi başarısız:", error);
    return NextResponse.json({ error: "fal.ai video üretemedi. fal.ai model erişimini ve bakiyeyi kontrol edin." }, { status: 502 });
  }
}
