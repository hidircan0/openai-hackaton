import "server-only";
import type { AnalyzeResponse } from "../scene/analyzeResponse";
import { getSimulationServiceUrl } from "../simulation/service-url";
import { detectRoom, type Detection, writeCommentary } from "./detect-room";

type Item = AnalyzeResponse["items"][number];
// Skor Python servisinde cem/kayma_skoru ile hesaplanır ve bu yanıtla gelir; burada yeniden hesaplanmaz.
type PhysicsResult = {
  simulation: AnalyzeResponse["simulation"];
  items: Array<{
    id: string; outcome: Item["simulationOutcome"]; after: Item["after"] & { pose?: unknown }; track: number[][];
    displacement: Item["displacement"]; impact: Item["impact"];
  }>;
  rawSafetyScore: number;
  safetyScore: number;
  penalties: Omit<AnalyzeResponse["penalties"], "impacts"> & { impacts: Array<{ zone: string; itemId: string | null; points: number; rule?: string }> };
};
const level = (n: number) => n >= 20 ? [5, "TOLERE EDİLEMEZ"] : n >= 15 ? [4, "YÜKSEK"] : n >= 8 ? [3, "ORTA"] : n >= 2 ? [2, "DÜŞÜK"] : [1, "ÖNEMSİZ"];
const round = (n: number, digits: number) => +n.toFixed(digits);
// Kayma dışı tipler (cem/kayma_skoru/esya_tipleri.py); en az bir eşya bunların dışında olmalı.
const SLIDING_EXCLUDED_TYPES = new Set(["bed", "door", "cable", "extinguisher"]);
// /api/analyze en fazla 120 sn çalışır (route maxDuration); tüm adımlar bu bütçeye sığdırılır.
const TIME_BUDGET_MS = 110_000;
const DETECTION_TIMEOUT_MS = 60_000;
const SIMULATION_TIMEOUT_MS = 55_000;
const COMMENTARY_TIMEOUT_MS = 18_000;
const MIN_COMMENTARY_MS = 5_000;

export class SimulationRequestError extends Error {}

async function runPhysics(detection: Detection, criticalZones: AnalyzeResponse["criticalZones"], intensity: number, durationSeconds: number, timeoutMs: number): Promise<PhysicsResult> {
  let response: Response;
  let result: Partial<PhysicsResult> & { detail?: unknown; error?: string };
  // Süre sınırı yanıt gövdesini okurken de dolabilir; ikisi birlikte yakalanır.
  try {
    response = await fetch(`${getSimulationServiceUrl()}/simulate`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        room: { dimensions: detection.room.dimensions },
        items: detection.items.map((item) => ({
          id: item.id, type: item.type, dimensions: {
            ...item.dimensions,
            widthCm: item.before.footprint.x2 - item.before.footprint.x1,
            depthCm: item.before.footprint.y2 - item.before.footprint.y1,
          },
          before: { footprint: item.before.footprint, bottomZ: item.before.bottomZ },
          anchored: item.anchored === "yes",
        })),
        criticalZones,
        earthquake: { intensity, durationSeconds },
      }),
      signal: AbortSignal.timeout(timeoutMs), cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new SimulationRequestError(`Fizik simülasyonu ${Math.round(timeoutMs / 1000)} saniyede tamamlanmadı.`);
    throw new SimulationRequestError(`Fizik servisine bağlanılamadı: ${error instanceof Error ? error.message : "bilinmeyen hata"}`);
  }
  try {
    result = await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new SimulationRequestError(`Fizik simülasyonu ${Math.round(timeoutMs / 1000)} saniyede tamamlanmadı.`);
    throw new SimulationRequestError(`Fizik servisi JSON olmayan yanıt verdi (HTTP ${response.status}).`);
  }
  if (!response.ok || !result.simulation || !Array.isArray(result.items)) {
    const reason = result.detail !== undefined ? JSON.stringify(result.detail) : result.error;
    throw new SimulationRequestError(reason || `Fizik servisi geçerli yanıt vermedi (HTTP ${response.status}).`);
  }
  if (typeof result.rawSafetyScore !== "number" || typeof result.safetyScore !== "number" || !result.penalties) {
    throw new SimulationRequestError("Fizik servisi güvenlik skorunu döndürmedi; servis cem/kayma_skoru ile birlikte mi dağıtıldı?");
  }
  return result as PhysicsResult;
}

/** Python servisinin reddedeceği model çıktılarını fiziğe gitmeden yakalar. */
function checkDetection(detection: Detection): Detection {
  if (!detection.items.some((item) => !SLIDING_EXCLUDED_TYPES.has(item.type))) {
    throw new Error("Fotoğrafta skora girecek eşya bulunamadı (yalnızca yatak, kapı, kablo veya söndürücü görüldü). Mobilyaların göründüğü bir fotoğraf deneyin.");
  }
  // Model aynı id'yi iki kez üretirse servis isteği reddeder; tekrar edenlere sıra eki verilir.
  const used = new Set<string>();
  const items = detection.items.map((item) => {
    let id = item.id;
    for (let n = 2; used.has(id); n++) id = `${item.id}-${n}`;
    used.add(id);
    return id === item.id ? item : { ...item, id };
  });
  return { ...detection, items };
}

function makeZones(detection: Detection): AnalyzeResponse["criticalZones"] {
  const { widthCm: Lx, depthCm: Ly } = detection.room.dimensions;
  const zones: AnalyzeResponse["criticalZones"] = [];
  for (const item of detection.items) {
    const f = item.before.footprint;
    if (item.type === "bed") zones.push({ id: `bed-zone-${zones.length + 1}`, type: "bed", bounds: { x1: Math.max(0, f.x1 - 20), y1: Math.max(0, f.y1 - 20), x2: Math.min(Lx, f.x2 + 20), y2: Math.min(Ly, f.y2 + 20) }, penaltyPoints: 25 });
    if (item.type === "desk") zones.push({ id: `work-zone-${zones.length + 1}`, type: "work_area", bounds: { x1: Math.max(0, f.x1 - 20), y1: Math.max(0, f.y1 - 20), x2: Math.min(Lx, f.x2 + 20), y2: Math.min(Ly, f.y2 + 80) }, penaltyPoints: 15 });
  }
  detection.room.exits.forEach((exit, i) => {
    const alongX = exit.wall.includes("x");
    const positive = exit.wall.startsWith("+");
    // Kapı aralığı oda sınırlarına kırpılır; servis oda dışına taşan ya da alanı olmayan bölgeyi reddeder.
    const wallLength = alongX ? Ly : Lx;
    const start = Math.max(0, Math.min(exit.startCm, exit.endCm));
    const end = Math.min(wallLength, Math.max(exit.startCm, exit.endCm));
    if (!(end > start)) return;
    const bounds = alongX
      ? { x1: positive ? Math.max(0, Lx - 100) : 0, y1: start, x2: positive ? Lx : Math.min(Lx, 100), y2: end }
      : { x1: start, y1: positive ? Math.max(0, Ly - 100) : 0, x2: end, y2: positive ? Ly : Math.min(Ly, 100) };
    zones.push({ id: `exit-zone-${i + 1}`, type: "exit", bounds, penaltyPoints: 30 });
  });
  return zones;
}

export async function analyzeRoom(photo: File, profile: string, intensity: number, durationSeconds: number): Promise<AnalyzeResponse> {
  const startedAt = Date.now();
  const remainingMs = () => TIME_BUDGET_MS - (Date.now() - startedAt);
  getSimulationServiceUrl(); // Modele istek atmadan önce servis ayarını doğrula.
  const detection = checkDetection(await detectRoom(photo, profile, Math.min(DETECTION_TIMEOUT_MS, remainingMs())));
  const criticalZones = makeZones(detection);
  const physics = await runPhysics(detection, criticalZones, intensity, durationSeconds, Math.min(SIMULATION_TIMEOUT_MS, remainingMs()));
  const physicsById = new Map(physics.items.map((item) => [item.id, item]));
  const items: AnalyzeResponse["items"] = detection.items.map((item) => {
    const simulated = physicsById.get(item.id);
    if (!simulated) throw new SimulationRequestError(`Fizik servisi ${item.id} öğesini döndürmedi.`);
    const rules = simulated.outcome === "tipped" ? ["R1"] : simulated.outcome === "fell" ? ["R3"] : simulated.outcome === "slid" ? ["R1"] : [];
    const displacement = simulated.displacement && { d: round(simulated.displacement.d, 4), volumeWeight: round(simulated.displacement.volumeWeight, 4) };
    const { hit, multiplier, hitZones } = simulated.impact;
    return { ...item, after: simulated.after, triggeredRules: rules, track: simulated.track, simulationOutcome: simulated.outcome, displacement, impact: { hit, multiplier, hitZones } };
  });
  const ruleByItem = new Map(items.map((item) => [item.id, item.triggeredRules[0] ?? "R1"]));
  const penalties: AnalyzeResponse["penalties"] = {
    alpha: physics.penalties.alpha,
    slidingIndex: round(physics.penalties.slidingIndex, 4),
    sliding: round(physics.penalties.sliding, 2),
    impacts: physics.penalties.impacts.map((impact) => ({ zone: impact.zone, itemId: impact.itemId ?? "", points: round(impact.points, 2), rule: impact.rule ?? ruleByItem.get(impact.itemId ?? "") ?? "R1" })),
    total: round(physics.penalties.total, 2),
  };
  const risks: AnalyzeResponse["risks"] = items.filter((item) => item.triggeredRules.length || item.anchored !== "yes").map((item) => {
    const zone = item.impact.hitZones[0] ?? null;
    const likelihood = item.anchored === "no" ? item.dimensions.heightCm >= 180 && item.hasHeavyOrFragileLoad ? 5 : 4 : item.anchored === "uncertain" ? 3 : 1;
    const severity = zone === "bed" ? 5 : zone === "work_area" ? 4 : 2;
    const riskScore = likelihood * severity;
    const [n, label] = level(riskScore);
    return { id: `risk-${item.id}`, itemId: item.id, rule: item.triggeredRules[0] ?? "R1", hazard: `${item.type} için sarsıntı sırasında hareket veya düşme riski.`, zone, likelihood, severity, riskScore, level: n as number, levelLabel: label as string, reason: "Gerekçe hazırlanıyor.", recommendedAction: item.fragile ? "Cam veya aynayı yatak ve çalışma alanlarından uzakta güvenle sabitleyin." : "Yüksek eşyayı uygun bağlantı elemanlarıyla duvara sabitleyin.", owner: profile === "isg" ? "İSG uzmanı" : "Kullanıcı", due: "Öncelikli", approvalStatus: "pending" };
  });
  const analysis: AnalyzeResponse = {
    profile, simulation: physics.simulation,
    safetyScore: physics.safetyScore, rawSafetyScore: round(physics.rawSafetyScore, 2), room: detection.room,
    items, criticalZones, risks, penalties,
    commentary: { roomComment: "Analiz yorumu hazırlanıyor." },
    riskLevelScale: { "1": "Önemsiz", "2": "Düşük", "3": "Orta", "4": "Yüksek", "5": "Tolere edilemez" },
    note: "PyBullet tabanlı yaklaşık eşya hareketi simülasyonu. Fotoğraftan çıkarılan ölçüler tahminidir; yapısal deprem dayanımı analizi değildir.",
  };
  // Yorum için yeterli süre kalmadıysa atlanır; skor ve riskler yine döner.
  const commentaryMs = Math.min(COMMENTARY_TIMEOUT_MS, remainingMs());
  if (commentaryMs < MIN_COMMENTARY_MS) {
    console.error(`OpenAI yorumu atlandı: süre bütçesinde ${commentaryMs} ms kaldı.`);
    return analysis;
  }
  try {
    const commentary = await writeCommentary(profile, { safetyScore: analysis.safetyScore, risks: analysis.risks.map(({ itemId, hazard, zone, likelihood, severity, riskScore, recommendedAction }) => ({ itemId, hazard, zone, likelihood, severity, riskScore, recommendedAction })) }, commentaryMs);
    analysis.commentary.roomComment = commentary.roomComment;
    analysis.risks = analysis.risks.map((risk) => {
      const generated = commentary.riskComments.find((entry) => entry.itemId === risk.itemId);
      return generated ? { ...risk, reason: generated.reason, recommendedAction: generated.recommendedAction } : risk;
    });
  } catch (error) { console.error("OpenAI yorum üretimi başarısız:", error); }
  return analysis;
}
