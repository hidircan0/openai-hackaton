"use client";
import { useMemo } from "react";
import { Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { cmToWorld, tabanMerkezi, tabanOlculeri } from "./koordinat";
import type { Esya, Oda } from "./types";

export function EsyaKutusu({ esya, oda, riskli, deprem, siralama = 0 }: {
  esya: Esya; oda: Oda; riskli: boolean; deprem: boolean; siralama?: number;
}) {
  const ref = useRef<Group>(null);
  const from = useMemo(() => tabanMerkezi(esya.taban), [esya.taban]);
  const to = useMemo(() => esya.t1 ? tabanMerkezi(esya.t1.taban) : from, [esya.t1, from]);
  const fromSize = useMemo(() => tabanOlculeri(esya.taban), [esya.taban]);
  const toSize = useMemo(() => esya.t1 ? tabanOlculeri(esya.t1.taban) : fromSize, [esya.t1, fromSize]);
  const [x, z, y] = cmToWorld(from[0], from[1], esya.z0 + esya.h / 2, oda);
  const [tx, tz, ty] = cmToWorld(to[0], to[1], (esya.t1?.z0 ?? esya.z0) + (esya.t1?.h ?? esya.h) / 2, oda);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const delay = siralama * 0.28;
    if (!deprem) ref.current.userData.started = undefined;
    const p = deprem ? Math.max(0, Math.min(1, (clock.elapsedTime - (ref.current.userData.started ??= clock.elapsedTime) - delay) / 0.8)) : 0;
    ref.current.position.set(x + (tx - x) * p, y + (ty - y) * p, z + (tz - z) * p);
    const sx = fromSize[0] + (toSize[0] - fromSize[0]) * p;
    const sz = fromSize[1] + (toSize[1] - fromSize[1]) * p;
    ref.current.scale.set(sx, (esya.h + ((esya.t1?.h ?? esya.h) - esya.h) * p) * 0.01, sz);
    // A brief lean sells the fall; the endpoint remains exactly the engine's t1 box.
    ref.current.rotation.z = riskli && p > 0 && p < 1 ? -Math.sin(p * Math.PI) * Math.PI / 3 : 0;
  });

  return <group ref={ref} position={[x, y, z]}>
    <Box args={[1, 1, 1]}>
      <meshStandardMaterial color={riskli ? "#F0676B" : "#596579"} roughness={0.76} />
    </Box>
    <Box args={[1.01, 1.01, 1.01]}>
      <meshBasicMaterial color={riskli ? "#F0676B" : "#A7A3B3"} wireframe transparent opacity={0.32} />
    </Box>
  </group>;
}
