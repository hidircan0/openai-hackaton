import "server-only";
import type { AnalyzeResponse } from "../scene/analyzeResponse";
import { detectRoom, type Detection, writeCommentary } from "./detect-room";

type PhysicsResult = {
  simulation: AnalyzeResponse["simulation"];
  items: Array<{
    id: string; outcome: "tipped" | "fell" | "slid" | "stationary"; after: { footprint: AnalyzeResponse["items"][number]["before"]["footprint"]; bottomZ: number; topZ: number; pose?: unknown }; track: number[][];
  }>;
};
type Rect = { x1: number; y1: number; x2: number; y2: number };
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
const level = (n: number) => n >= 20 ? [5, "TOLERE EDİLEMEZ"] : n >= 15 ? [4, "YÜKSEK"] : n >= 8 ? [3, "ORTA"] : n >= 2 ? [2, "DÜŞÜK"] : [1, "ÖNEMSİZ"];
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export class SimulationConfigurationError extends Error {}
export class SimulationRequestError extends Error {}

async function runPhysics(detection: Detection, intensity: number, durationSeconds: number): Promise<PhysicsResult> {
  const serviceUrl = process.env.SIMULATION_SERVICE_URL;
  if (!serviceUrl) throw new SimulationConfigurationError("SIMULATION_SERVICE_URL tanımlı değil.");
  const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/simulate`, {
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
      earthquake: { intensity, durationSeconds },
    }),
    signal: AbortSignal.timeout(55_000), cache: "no-store",
  });
  const result = await response.json() as PhysicsResult | { detail?: unknown; error?: string };
  if (!response.ok || !("simulation" in result) || !Array.isArray(result.items)) {
    const reason = "detail" in result ? JSON.stringify(result.detail) : "error" in result ? result.error : "Fizik servisi geçerli yanıt vermedi.";
    throw new SimulationRequestError(reason || "Fizik servisi geçerli yanıt vermedi.");
  }
  return result;
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
    const bounds = alongX
      ? { x1: positive ? Math.max(0, Lx - 100) : 0, y1: exit.startCm, x2: positive ? Lx : 100, y2: exit.endCm }
      : { x1: exit.startCm, y1: positive ? Math.max(0, Ly - 100) : 0, x2: exit.endCm, y2: positive ? Ly : 100 };
    zones.push({ id: `exit-zone-${i + 1}`, type: "exit", bounds, penaltyPoints: 30 });
  });
  return zones;
}

export async function analyzeRoom(photo: File, profile: string, intensity: number, durationSeconds: number): Promise<AnalyzeResponse> {
  if (!process.env.SIMULATION_SERVICE_URL) throw new SimulationConfigurationError("SIMULATION_SERVICE_URL tanımlı değil.");
  const detection = await detectRoom(photo, profile);
  const physics = await runPhysics(detection, intensity, durationSeconds);
  const criticalZones = makeZones(detection);
  const physicsById = new Map(physics.items.map((item) => [item.id, item]));
  const { widthCm: Lx, depthCm: Ly, heightCm: Lz } = detection.room.dimensions;
  const baseItems = detection.items.map((item) => {
    const simulated = physicsById.get(item.id);
    if (!simulated) throw new Error(`Fizik servisi ${item.id} öğesini döndürmedi.`);
    const isMoving = simulated.outcome !== "stationary";
    const hitZones = criticalZones.filter((zone) => zone.type !== "exit" && overlap(simulated.after.footprint, zone.bounds) > 0).map((zone) => zone.type);
    const multiplier = isMoving ? (item.dimensions.heightCm >= 180 ? 1 : item.dimensions.heightCm >= 120 ? 0.7 : 0.4) * (item.fragile ? 1.3 : 1) : null;
    const rules = simulated.outcome === "tipped" ? ["R1"] : simulated.outcome === "fell" ? ["R3"] : simulated.outcome === "slid" ? ["R1"] : [];
    return { ...item, after: simulated.after, triggeredRules: rules, track: simulated.track, _zones: hitZones, _multiplier: multiplier, _outcome: simulated.outcome };
  });
  const eligible = baseItems.filter((item) => !["bed", "door", "cable", "extinguisher"].includes(item.type));
  const volume = (item: typeof baseItems[number]) => item.dimensions.widthCm * item.dimensions.depthCm * item.dimensions.heightCm;
  const totalVolume = eligible.reduce((sum, item) => sum + volume(item), 0) || 1;
  const fullItems: AnalyzeResponse["items"] = baseItems.map((item) => {
    const from = item.before.footprint, to = item.after.footprint;
    const dx = Math.abs((from.x1 + from.x2 - to.x1 - to.x2) / 2) / Lx;
    const dy = Math.abs((from.y1 + from.y2 - to.y1 - to.y2) / 2) / Ly;
    const dz = Math.abs((item.before.bottomZ + item.before.topZ - item.after.bottomZ - item.after.topZ) / 2) / Lz;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) / Math.sqrt(3);
    const eligibleItem = eligible.some((entry) => entry.id === item.id);
    const displacement = eligibleItem ? { d: +d.toFixed(4), volumeWeight: +(volume(item) / totalVolume).toFixed(4) } : null;
    const { _zones, _multiplier, _outcome, ...rest } = item;
    return { ...rest, simulationOutcome: _outcome, displacement, impact: { hit: _zones.length > 0, multiplier: _zones.length ? _multiplier : null, hitZones: _zones } };
  });
  const slidingIndex = fullItems.reduce((sum, item) => sum + (item.displacement?.d ?? 0) * (item.displacement?.volumeWeight ?? 0), 0);
  const impactMap = new Map<string, { itemId: string; multiplier: number; points: number }>();
  fullItems.forEach((item) => item.impact.hitZones.forEach((zone) => {
    const points = criticalZones.find((entry) => entry.type === zone)?.penaltyPoints ?? 0;
    const multiplier = item.impact.multiplier ?? 0;
    if (multiplier > (impactMap.get(zone)?.multiplier ?? 0)) impactMap.set(zone, { itemId: item.id, multiplier, points: points * multiplier });
  }));
  const impacts = [...impactMap].map(([zone, value]) => ({ zone, itemId: value.itemId, points: +value.points.toFixed(2), rule: "R1" }));
  const sliding = 200 * slidingIndex;
  const total = sliding + impacts.reduce((sum, item) => sum + item.points, 0);
  const risks: AnalyzeResponse["risks"] = fullItems.filter((item) => item.triggeredRules.length || item.anchored !== "yes").map((item) => {
    const zone = item.impact.hitZones[0] ?? null;
    const likelihood = item.anchored === "no" ? item.dimensions.heightCm >= 180 && item.hasHeavyOrFragileLoad ? 5 : 4 : item.anchored === "uncertain" ? 3 : 1;
    const severity = zone === "bed" ? 5 : zone === "work_area" ? 4 : 2;
    const riskScore = likelihood * severity;
    const [n, label] = level(riskScore);
    return { id: `risk-${item.id}`, itemId: item.id, rule: item.triggeredRules[0] ?? "R1", hazard: `${item.type} için sarsıntı sırasında hareket veya düşme riski.`, zone, likelihood, severity, riskScore, level: n as number, levelLabel: label as string, reason: "Gerekçe hazırlanıyor.", recommendedAction: item.fragile ? "Cam veya aynayı yatak ve çalışma alanlarından uzakta güvenle sabitleyin." : "Yüksek eşyayı uygun bağlantı elemanlarıyla duvara sabitleyin.", owner: profile === "isg" ? "İSG uzmanı" : "Kullanıcı", due: "Öncelikli", approvalStatus: "pending" };
  });
  const rawSafetyScore = clamp(100 - total);
  const analysis: AnalyzeResponse = {
    profile, simulation: physics.simulation,
    safetyScore: Math.round(rawSafetyScore), rawSafetyScore: +rawSafetyScore.toFixed(2), room: detection.room,
    items: fullItems, criticalZones, risks,
    penalties: { alpha: 2, slidingIndex: +slidingIndex.toFixed(4), sliding: +sliding.toFixed(2), impacts, total: +total.toFixed(2) },
    commentary: { roomComment: "Analiz yorumu hazırlanıyor." },
    riskLevelScale: { "1": "Önemsiz", "2": "Düşük", "3": "Orta", "4": "Yüksek", "5": "Tolere edilemez" },
    note: "PyBullet tabanlı yaklaşık eşya hareketi simülasyonu. Fotoğraftan çıkarılan ölçüler tahminidir; yapısal deprem dayanımı analizi değildir.",
  };
  try {
    const commentary = await writeCommentary(profile, { safetyScore: analysis.safetyScore, risks: analysis.risks.map(({ itemId, hazard, zone, likelihood, severity, riskScore, recommendedAction }) => ({ itemId, hazard, zone, likelihood, severity, riskScore, recommendedAction })) });
    analysis.commentary.roomComment = commentary.roomComment;
    analysis.risks = analysis.risks.map((risk) => {
      const generated = commentary.riskComments.find((entry) => entry.itemId === risk.itemId);
      return generated ? { ...risk, reason: generated.reason, recommendedAction: generated.recommendedAction } : risk;
    });
  } catch (error) { console.error("OpenAI yorum üretimi başarısız:", error); }
  return analysis;
}
