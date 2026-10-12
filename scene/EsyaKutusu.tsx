"use client";
import { useMemo } from "react";
import { Box } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Quaternion, Vector3, type Group } from "three";
import { cmToWorld, tabanMerkezi, tabanOlculeri } from "./koordinat";
import type { Esya, Oda } from "./types";

export function EsyaKutusu({ esya, oda, riskli, deprem, siralama = 0 }: {
  esya: Esya; oda: Oda; riskli: boolean; deprem: boolean; siralama?: number;
}) {
  const ref = useRef<Group>(null);
  const physicsQuaternion = useRef(new Quaternion());
  const basis = useRef(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
  const inverseBasis = useRef(basis.current.clone().invert());
  const from = useMemo(() => tabanMerkezi(esya.taban), [esya.taban]);
  const to = useMemo(() => esya.t1 ? tabanMerkezi(esya.t1.taban) : from, [esya.t1, from]);
  const fromSize = useMemo(() => tabanOlculeri(esya.taban), [esya.taban]);
  const toSize = useMemo(() => esya.t1 ? tabanOlculeri(esya.t1.taban) : fromSize, [esya.t1, fromSize]);
  const [x, z, y] = cmToWorld(from[0], from[1], esya.z0 + esya.h / 2, oda);
  const [tx, tz, ty] = cmToWorld(to[0], to[1], (esya.t1?.z0 ?? esya.z0) + (esya.t1?.h ?? esya.h) / 2, oda);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const delay = siralama * 0.28;
    if (!deprem && !esya.track?.length) ref.current.userData.started = undefined;
    if (esya.track?.length && (deprem || ref.current.userData.started !== undefined)) {
      if (deprem && !ref.current.userData.playing) ref.current.userData.started = clock.elapsedTime;
      ref.current.userData.playing = deprem;
      const started = ref.current.userData.started as number;
      const elapsed = deprem ? Math.max(0, clock.elapsedTime - started) : esya.track[esya.track.length - 1][0] + delay;
      const last = esya.track[esya.track.length - 1];
      const simTime = Math.min(last[0], Math.max(0, elapsed - delay));
      let next = esya.track.findIndex((frame) => frame[0] >= simTime);
      if (next < 0) next = esya.track.length - 1;
      const current = esya.track[Math.max(0, next - 1)];
      const target = esya.track[next];
      const fraction = target[0] === current[0] ? 0 : Math.max(0, Math.min(1, (simTime - current[0]) / (target[0] - current[0])));
      const values = current.slice(1).map((value, index) => value + (target[index + 1] - value) * fraction);
      ref.current.position.set((values[0] - oda.Lx / 2) * 0.01, values[2] * 0.01, (oda.Ly / 2 - values[1]) * 0.01);
      physicsQuaternion.current.set(values[3], values[4], values[5], values[6]);
      ref.current.quaternion.copy(basis.current).multiply(physicsQuaternion.current).multiply(inverseBasis.current);
      return;
    }
    const p = deprem ? Math.max(0, Math.min(1, (clock.elapsedTime - (ref.current.userData.started ??= clock.elapsedTime) - delay) / 0.8)) : 0;
    ref.current.position.set(x + (tx - x) * p, y + (ty - y) * p, z + (tz - z) * p);
    const sx = fromSize[0] + (toSize[0] - fromSize[0]) * p;
    const sz = fromSize[1] + (toSize[1] - fromSize[1]) * p;
    ref.current.scale.set(sx, (esya.h + ((esya.t1?.h ?? esya.h) - esya.h) * p) * 0.01, sz);
    // A brief lean sells the fall; the endpoint remains exactly the engine's t1 box.
    const tilt = riskli && p > 0 && p < 1 ? Math.sin(p * Math.PI) * Math.PI / 2 : 0;
    // Source +y points toward world -z, so y-axis falls rotate around world x.
    if (esya.yon === "+y") ref.current.rotation.set(-tilt, 0, 0);
    else if (esya.yon === "-y") ref.current.rotation.set(tilt, 0, 0);
    else if (esya.yon === "+x") ref.current.rotation.set(0, 0, -tilt);
    else ref.current.rotation.set(0, 0, tilt);
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
