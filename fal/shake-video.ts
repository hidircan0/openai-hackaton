import "server-only";
import { fal } from "@fal-ai/client";

export class FalShakeConfigurationError extends Error {}
export class FalShakeInputError extends Error {}

export async function createShakeVideo(photo: File, summary: string): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new FalShakeConfigurationError("FAL_KEY tanımlı değil.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size < 1 || photo.size > 4 * 1024 * 1024) throw new FalShakeInputError("JPEG, PNG veya WebP biçiminde, en fazla 4 MB bir fotoğraf yükleyin.");
  fal.config({ credentials: key });
  const result = await fal.subscribe("fal-ai/vidu/image-to-video", {
    input: {
      image_url: photo,
      prompt: `Create a short, realistic illustrative earthquake shaking video from this exact room image. Preserve the same room, objects, layout, and camera view. Show the camera and loose furniture trembling, then the identified unsecured objects moving/falling as described: ${summary}. No people, no text, no structural damage, no collapse, no fire. This is a visual illustration, not an engineering simulation.`,
      movement_amplitude: "large",
    },
  });
  const url = result.data.video?.url;
  if (!url) throw new Error("fal.ai yanıtında video bulunamadı.");
  return url;
}
