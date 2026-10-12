"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { Bolgeler } from "./Bolgeler";
import { EsyaKutusu } from "./EsyaKutusu";
import { DepremSarsintisi } from "./deprem";
import { cmToWorld } from "./koordinat";
import type { Bolge, Esya, Oda } from "./types";

export type SahneProps = {
  oda: Oda;
  esyalar: Esya[];
  bolgeler: Bolge[];
  riskliEsyaIdleri: string[];
  deprem: boolean;
  className?: string;
};

export function Sahne({ oda, esyalar, bolgeler, riskliEsyaIdleri, deprem, className }: SahneProps) {
  const w = oda.Lx / 100, d = oda.Ly / 100;
  return <div className={className} style={{ width: "100%", height: "100%", minHeight: 360 }}>
    <Canvas camera={{ position: [w * 0.9, Math.max(3, oda.Lz / 100), d * 1.05], fov: 42 }}>
      <color attach="background" args={["#0B0C10"]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 7, 5]} intensity={2.1} />
      <Suspense fallback={null}>
        <DepremSarsintisi active={deprem}>
          <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, d]} />
            <meshStandardMaterial color="#151518" roughness={1} />
          </mesh>
          <gridHelper args={[Math.max(w, d), Math.max(2, Math.round(Math.max(w, d) / 0.5)), "#2C3444", "#1F2633"]} position={[0, 0.002, 0]} />
          <mesh position={[0, 0.025, -d / 2]}><boxGeometry args={[w, 0.05, 0.05]} /><meshBasicMaterial color="#2C3444" /></mesh>
          <mesh position={[0, 0.025, d / 2]}><boxGeometry args={[w, 0.05, 0.05]} /><meshBasicMaterial color="#2C3444" /></mesh>
          <mesh position={[-w / 2, 0.025, 0]}><boxGeometry args={[0.05, 0.05, d]} /><meshBasicMaterial color="#2C3444" /></mesh>
          <mesh position={[w / 2, 0.025, 0]}><boxGeometry args={[0.05, 0.05, d]} /><meshBasicMaterial color="#2C3444" /></mesh>
          <Bolgeler bolgeler={bolgeler} oda={oda} />
          {esyalar.map((esya, index) => <EsyaKutusu key={esya.id} esya={esya} oda={oda} riskli={riskliEsyaIdleri.includes(esya.id)} deprem={deprem} siralama={index} />)}
        </DepremSarsintisi>
      </Suspense>
      <OrbitControls makeDefault target={[0, 0.8, 0]} minDistance={2} maxDistance={Math.max(10, w + d)} />
    </Canvas>
  </div>;
}
