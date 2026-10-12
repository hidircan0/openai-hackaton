import { NextResponse } from "next/server";
import {
  createRoomFixedImage,
  FalConfigurationError,
  FalInputError,
} from "../../../../fal/room-fixed";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let photo: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    photo = form.get("photo");
  } catch {
    return NextResponse.json({ error: "Fotoğraf yüklenemedi." }, { status: 400 });
  }

  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "Bir oda fotoğrafı seçin." }, { status: 400 });
  }

  try {
    const imageUrl = await createRoomFixedImage(photo);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof FalInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof FalConfigurationError) {
      return NextResponse.json(
        { error: "Sunucuda FAL_KEY tanımlı değil. Vercel ortam değişkenlerini kontrol edin." },
        { status: 503 },
      );
    }
    console.error("fal.ai oda görseli üretimi başarısız oldu:", error);
    return NextResponse.json(
      { error: "fal.ai görseli üretemedi. Biraz sonra tekrar deneyin." },
      { status: 502 },
    );
  }
}
