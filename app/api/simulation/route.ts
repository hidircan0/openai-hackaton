import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON değil." }, { status: 400 });
  }

  const serviceUrl = process.env.SIMULATION_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json(
      { error: "Simülasyon servisi ayarlı değil. SIMULATION_SERVICE_URL değerini tanımlayın." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/simulate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    });
    const result: unknown = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Fizik simülasyonu şu anda yanıt vermiyor. Python simülasyon servisini kontrol edin." },
      { status: 503 },
    );
  }
}
