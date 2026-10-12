/** Current POST /api/analyze response shape. Spatial measurements are centimeters. */
export type AnalyzeResponse = {
  profile: string;
  safetyScore: number;
  rawSafetyScore: number;
  room: {
    type: string;
    dimensions: { widthCm: number; depthCm: number; heightCm: number };
    exits: Array<{ type: string; wall: string; startCm: number; endCm: number; widthCm: number }>;
    warnings: string[];
  };
  items: Array<{
    id: string;
    type: string;
    before: { footprint: { x1: number; y1: number; x2: number; y2: number }; bottomZ: number; topZ: number };
    after: { footprint: { x1: number; y1: number; x2: number; y2: number }; bottomZ: number; topZ: number };
    dimensions: { widthCm: number; depthCm: number; heightCm: number };
    fallDirection: { description: string; axis: "+x" | "-x" | "+y" | "-y" | null };
    anchored: "yes" | "no" | "uncertain";
    wallMounted: boolean;
    hasHeavyOrFragileLoad: boolean;
    fragile: boolean;
    confidence: number;
    triggeredRules: string[];
    displacement: { d: number; volumeWeight: number } | null;
    impact: { multiplier: number; hitZones: string[] } | null;
  }>;
  criticalZones: Array<{
    id: string;
    type: "bed" | "exit" | "work_area";
    bounds: { x1: number; y1: number; x2: number; y2: number };
    penaltyPoints: number;
  }>;
  risks: Array<{
    id: string;
    itemId: string | null;
    rule: string;
    hazard: string;
    zone: string | null;
    likelihood: number;
    severity: number;
    riskScore: number;
    level: number;
    levelLabel: string;
    reason: string;
    recommendedAction: string;
    owner: string;
    due: string;
    approvalStatus: string;
  }>;
  penalties: {
    alpha: number;
    slidingIndex: number;
    sliding: number;
    impacts: Array<{ zone: string; itemId: string; points: number }>;
    total: number;
  };
  commentary: { roomComment: string };
  riskLevelScale: Record<string, string>;
  note: string;
};
