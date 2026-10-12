"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { ReactNode } from "react";
import type { Group } from "three";

/** Camera effect only. Object positions and end states come from /engine. */
export function DepremSarsintisi({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (!active) { ref.current.position.x = 0; ref.current.position.z = 0; return; }
    const t = clock.elapsedTime;
    const fade = Math.max(0, 1 - ((t * 1000) % 1400) / 1400);
    ref.current.position.x = Math.sin(t * 48) * 0.035 * fade;
    ref.current.position.z = Math.cos(t * 41) * 0.025 * fade;
  });
  return <group ref={ref}>{children}</group>;
}
