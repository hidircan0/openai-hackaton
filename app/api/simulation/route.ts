import { NextResponse } from "next/server";
import { getSimulationServiceUrl, SimulationConfigurationError } from "../../../simulation/service-url";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "İstek gövdesi geçerli JSON değil." }, { status: 400 });
  }

  let serviceUrl: string;
  try {
    serviceUrl = getSimulationServiceUrl();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof SimulationConfigurationError ? error.message : "Simülasyon servisi ayarı geçersiz." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${serviceUrl}/simulate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    });
    const result: unknown = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: `Fizik servisine (${serviceUrl}) bağlanılamadı: ${error instanceof Error ? error.message : "Bağlantı kurulamadı."}` },
      { status: 503 },
    );
  }
}
