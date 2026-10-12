import "server-only";

import { fal } from "@fal-ai/client";

// Vercel Functions cap request payloads at 4.5 MB, including multipart overhead.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class FalConfigurationError extends Error {}
export class FalInputError extends Error {}

/** Create an illustrative “after” image. This output is not used by the risk engine. */
export async function createRoomFixedImage(photo: File): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new FalConfigurationError("FAL_KEY tanımlı değil.");
  if (!ACCEPTED_TYPES.has(photo.type)) {
    throw new FalInputError("JPEG, PNG veya WebP biçiminde fotoğraf yükleyin.");
  }
  if (photo.size === 0 || photo.size > MAX_IMAGE_BYTES) {
    throw new FalInputError("Fotoğraf boş veya 4 MB sınırını aşıyor.");
  }

  fal.config({ credentials: key });
  const result = await fal.subscribe("fal-ai/flux-kontext/dev", {
    input: {
      image_url: photo,
      num_images: 1,
      output_format: "jpeg",
      prompt: [
        "Edit this exact room photograph to show a realistic earthquake-safety improvement after state.",
        "Keep the same room, camera angle, perspective, architecture, walls, floor, windows, lighting, and all object identities and positions as much as possible.",
        "Visually secure tall bookcases and wardrobes to the wall with small realistic anti-tip brackets or straps; secure a television on its stand; move heavy loose objects to low shelves; keep doors and escape paths clear.",
        "Do not add people, do not add text, labels, diagrams, logos, or hazards. Do not claim structural reinforcement.",
        "Photorealistic, subtle practical safety changes only.",
      ].join(" "),
    },
  });

  const imageUrl = result.data.images?.[0]?.url;
  if (!imageUrl) throw new Error("fal.ai yanıtında üretilen görsel bulunamadı.");
  return imageUrl;
}
