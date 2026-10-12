from __future__ import annotations

import math
from collections import defaultdict
from typing import Any

import pybullet as bullet

from .models import ItemInput, SimulationRequest

CM_PER_M = 100.0
GRAVITY = 9.81
FIXED_STEP = 1 / 120
RECORD_EVERY = 6  # 20 poses per simulated second
ROOM_WALL_THICKNESS_M = 0.10
# Ground acceleration that tears an unanchored wall-mounted item off its hook.
WALL_HOOK_BREAK_G = 0.30
MATERIALS: dict[str, tuple[float, float]] = {
    "bookcase": (250, 0.50), "wardrobe": (150, 0.50), "cabinet": (150, 0.50),
    "shelf": (120, 0.50), "refrigerator": (180, 0.45), "tv": (150, 0.40),
    "desk": (60, 0.55), "table": (60, 0.55), "chair": (40, 0.55),
    "sofa": (60, 0.60), "bed": (100, 0.70), "mirror": (2500, 0.35),
    "glass": (2500, 0.35), "stack": (400, 0.45), "default": (120, 0.50),
}


def _metres(value_cm: float) -> float:
    return value_cm / CM_PER_M


def _item_center(item: ItemInput) -> list[float]:
    footprint = item.before.footprint
    return [
        _metres((footprint.x1 + footprint.x2) / 2),
        _metres((footprint.y1 + footprint.y2) / 2),
        _metres(item.before.bottomZ + item.dimensions.heightCm / 2),
    ]


def _make_room(client: int, width_m: float, depth_m: float, height_m: float) -> list[int]:
    wall = ROOM_WALL_THICKNESS_M
    floor_shape = bullet.createCollisionShape(
        bullet.GEOM_BOX, halfExtents=[width_m / 2, depth_m / 2, wall / 2], physicsClientId=client
    )
    floor = bullet.createMultiBody(
        baseMass=0, baseCollisionShapeIndex=floor_shape,
        basePosition=[width_m / 2, depth_m / 2, -wall / 2], physicsClientId=client,
    )
    bodies = [floor]

    wall_shapes = [
        ([wall / 2, depth_m / 2, height_m / 2], [-wall / 2, depth_m / 2, height_m / 2]),
        ([wall / 2, depth_m / 2, height_m / 2], [width_m + wall / 2, depth_m / 2, height_m / 2]),
        ([width_m / 2, wall / 2, height_m / 2], [width_m / 2, -wall / 2, height_m / 2]),
        ([width_m / 2, wall / 2, height_m / 2], [width_m / 2, depth_m + wall / 2, height_m / 2]),
    ]
    for half_extents, position in wall_shapes:
        shape = bullet.createCollisionShape(bullet.GEOM_BOX, halfExtents=half_extents, physicsClientId=client)
        bodies.append(bullet.createMultiBody(
            baseMass=0, baseCollisionShapeIndex=shape, basePosition=position, physicsClientId=client
        ))
    return bodies


def _make_item(client: int, item: ItemInput) -> tuple[int, float]:
    width = _metres(item.dimensions.widthCm)
    depth = _metres(item.dimensions.depthCm)
    height = _metres(item.dimensions.heightCm)
    volume = width * depth * height
    density, friction = MATERIALS.get(item.type.lower(), MATERIALS["default"])
    mass = 0 if item.anchored else max(0.25, volume * density)
    shape = bullet.createCollisionShape(
        bullet.GEOM_BOX,
        halfExtents=[width / 2, depth / 2, height / 2],
        physicsClientId=client,
    )
    body = bullet.createMultiBody(
        baseMass=mass,
        baseCollisionShapeIndex=shape,
        basePosition=_item_center(item),
        baseOrientation=[0, 0, 0, 1],
        physicsClientId=client,
    )
    bullet.changeDynamics(
        body, -1, lateralFriction=friction, spinningFriction=0.02,
        rollingFriction=0.01, restitution=0, angularDamping=0.16,
        physicsClientId=client,
    )
    return body, mass


def _pga_g(intensity: int) -> float:
    # Calibration range: 0.05g at level 1 through 0.80g at level 9. A 60 cm deep,
    # 200 cm tall wardrobe needs about 0.3g to overturn, so tall unanchored
    # furniture only slides at moderate levels and tips at the strongest ones.
    return 0.05 + (intensity - 1) * (0.75 / 8)


def _acceleration(t: float, duration: float, pga: float) -> tuple[float, float]:
    ramp = min(1.0, duration / 4)
    envelope = min(1.0, t / ramp, max(0.0, (duration - t) / ramp))
    frequency_hz = 1.5
    x = pga * GRAVITY * envelope * math.sin(2 * math.pi * frequency_hz * t)
    y = pga * GRAVITY * 0.64 * envelope * math.sin(2 * math.pi * frequency_hz * 0.8 * t + math.pi / 3)
    return x, y


def _pose(client: int, body: int, half_extents_m: list[float]) -> dict[str, Any]:
    position, quaternion = bullet.getBasePositionAndOrientation(body, physicsClientId=client)
    rotation = bullet.getMatrixFromQuaternion(quaternion)
    half_x = abs(rotation[0]) * half_extents_m[0] + abs(rotation[1]) * half_extents_m[1] + abs(rotation[2]) * half_extents_m[2]
    half_y = abs(rotation[3]) * half_extents_m[0] + abs(rotation[4]) * half_extents_m[1] + abs(rotation[5]) * half_extents_m[2]
    half_z = abs(rotation[6]) * half_extents_m[0] + abs(rotation[7]) * half_extents_m[1] + abs(rotation[8]) * half_extents_m[2]
    x, y, z = (value * CM_PER_M for value in position)
    hx, hy, hz = (value * CM_PER_M for value in (half_x, half_y, half_z))
    return {
        "position": {"x": round(x, 3), "y": round(y, 3), "z": round(z, 3)},
        "rotation": {"x": round(quaternion[0], 6), "y": round(quaternion[1], 6), "z": round(quaternion[2], 6), "w": round(quaternion[3], 6)},
        "footprint": {"x1": round(x - hx, 3), "y1": round(y - hy, 3), "x2": round(x + hx, 3), "y2": round(y + hy, 3)},
        "bottomZ": round(z - hz, 3),
        "topZ": round(z + hz, 3),
    }


def _tilt_degrees(quaternion: tuple[float, ...] | list[float]) -> float:
    matrix = bullet.getMatrixFromQuaternion(quaternion)
    vertical_cosine = max(-1.0, min(1.0, matrix[8]))
    return math.degrees(math.acos(vertical_cosine))


def _overlaps_zone(footprint: dict[str, float], zone: Any) -> bool:
    bounds = zone.bounds
    overlap_x = min(footprint["x2"], bounds.x2) - max(footprint["x1"], bounds.x1)
    overlap_y = min(footprint["y2"], bounds.y2) - max(footprint["y1"], bounds.y1)
    return overlap_x > 0 and overlap_y > 0


def exit_zone_penalties(request: SimulationRequest, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return one R4 penalty if an exit corridor has less than 60 cm clear width."""
    worst: tuple[float, str, float] | None = None
    for zone in request.criticalZones:
        if zone.type != "exit":
            continue

        bounds = zone.bounds
        width_x = bounds.x2 - bounds.x1
        width_y = bounds.y2 - bounds.y1
        cross_axis, travel_axis = ("x", "y") if width_x <= width_y else ("y", "x")
        cross_min = getattr(bounds, f"{cross_axis}1")
        cross_max = getattr(bounds, f"{cross_axis}2")
        travel_min = getattr(bounds, f"{travel_axis}1")
        travel_max = getattr(bounds, f"{travel_axis}2")
        cross_width = cross_max - cross_min

        blockers: list[tuple[str, float, float, float, float]] = []
        travel_events = {travel_min, travel_max}
        for item in items:
            footprint = item["after"]["footprint"]
            item_cross_min = max(cross_min, footprint[f"{cross_axis}1"])
            item_cross_max = min(cross_max, footprint[f"{cross_axis}2"])
            item_travel_min = max(travel_min, footprint[f"{travel_axis}1"])
            item_travel_max = min(travel_max, footprint[f"{travel_axis}2"])
            if item_cross_max <= item_cross_min or item_travel_max <= item_travel_min:
                continue
            blockers.append((item["id"], item_cross_min, item_cross_max, item_travel_min, item_travel_max))
            travel_events.update((item_travel_min, item_travel_max))

        sorted_events = sorted(travel_events)
        minimum_clear_width = cross_width
        blocking_item_id: str | None = None
        for start, end in zip(sorted_events, sorted_events[1:]):
            if end <= start:
                continue
            midpoint = (start + end) / 2
            active = [blocker for blocker in blockers if blocker[3] < midpoint < blocker[4]]
            intervals = sorted((blocker[1], blocker[2], blocker[0]) for blocker in active)
            covered_width = 0.0
            union_end = cross_min
            widest_blocker: tuple[float, str] | None = None
            for interval_start, interval_end, item_id in intervals:
                covered_width += max(0.0, interval_end - max(interval_start, union_end))
                union_end = max(union_end, interval_end)
                item_width = interval_end - interval_start
                if widest_blocker is None or item_width > widest_blocker[0]:
                    widest_blocker = (item_width, item_id)
            clear_width = cross_width - covered_width
            if clear_width < minimum_clear_width:
                minimum_clear_width = clear_width
                blocking_item_id = widest_blocker[1] if widest_blocker else None

        if minimum_clear_width < 60 and zone.penaltyPoints > 0:
            candidate = (minimum_clear_width, blocking_item_id or "", zone.penaltyPoints)
            if worst is None or candidate[0] < worst[0]:
                worst = candidate

    if worst is None:
        return []
    return [{"zone": "exit", "itemId": worst[1] or None, "points": worst[2], "rule": "R4"}]


def simulate(request: SimulationRequest) -> dict[str, Any]:
    dimensions = request.room.dimensions
    width_m, depth_m, height_m = map(_metres, (dimensions.widthCm, dimensions.depthCm, dimensions.heightCm))
    duration = float(request.earthquake.durationSeconds)
    steps = int(round(duration / FIXED_STEP))
    pga = _pga_g(request.earthquake.intensity)
    client = bullet.connect(bullet.DIRECT)
    if client < 0:
        raise RuntimeError("Could not start the PyBullet simulation.")

    try:
        bullet.resetSimulation(physicsClientId=client)
        bullet.setGravity(0, 0, -GRAVITY, physicsClientId=client)
        bullet.setTimeStep(FIXED_STEP, physicsClientId=client)
        bullet.setPhysicsEngineParameter(
            fixedTimeStep=FIXED_STEP, numSolverIterations=50,
            deterministicOverlappingPairs=1, enableFileCaching=0,
            physicsClientId=client,
        )
        room_bodies = _make_room(client, width_m, depth_m, height_m)
        del room_bodies  # Room contacts are intentionally excluded from item collision IDs.

        body_to_id: dict[int, str] = {}
        id_to_body: dict[str, int] = {}
        masses: dict[int, float] = {}
        half_extents: dict[str, list[float]] = {}
        wall_hooks: list[int] = []
        for item in sorted(request.items, key=lambda value: value.id):
            body, mass = _make_item(client, item)
            body_to_id[body] = item.id
            id_to_body[item.id] = body
            masses[body] = mass
            if item.wallMounted and mass > 0:
                # Without a hook the item would start in mid-air and drop at t=0.
                wall_hooks.append(bullet.createConstraint(
                    body, -1, -1, -1, bullet.JOINT_FIXED, [0, 0, 0], [0, 0, 0], _item_center(item),
                    physicsClientId=client,
                ))
            half_extents[item.id] = [
                _metres(item.dimensions.widthCm) / 2,
                _metres(item.dimensions.depthCm) / 2,
                _metres(item.dimensions.heightCm) / 2,
            ]

        tracks: dict[str, list[list[float]]] = {item.id: [] for item in request.items}
        max_tilt: dict[str, float] = defaultdict(float)
        fell_from_start: set[str] = set()
        contact_targets: dict[str, set[str]] = defaultdict(set)
        impacted_by: dict[str, set[str]] = defaultdict(set)
        initial_centers = {item.id: _item_center(item) for item in request.items}
        initial_bottoms = {item.id: _metres(item.before.bottomZ) for item in request.items}

        for step in range(steps):
            t = step * FIXED_STEP
            accel_x, accel_y = _acceleration(t, duration, pga)
            if wall_hooks and math.hypot(accel_x, accel_y) > WALL_HOOK_BREAK_G * GRAVITY:
                for constraint in wall_hooks:
                    bullet.removeConstraint(constraint, physicsClientId=client)
                wall_hooks.clear()
            for body, mass in masses.items():
                if mass <= 0:
                    continue
                position, _ = bullet.getBasePositionAndOrientation(body, physicsClientId=client)
                # Apply the inertial earthquake load at the support plane so tall
                # objects receive a realistic overturning moment as well as slide.
                lower, _ = bullet.getAABB(body, physicsClientId=client)
                force_position = [position[0], position[1], lower[2]]
                bullet.applyExternalForce(
                    body, -1, [-mass * accel_x, -mass * accel_y, 0], force_position,
                    bullet.WORLD_FRAME, physicsClientId=client,
                )
            bullet.stepSimulation(physicsClientId=client)

            for body, item_id in body_to_id.items():
                position, quaternion = bullet.getBasePositionAndOrientation(body, physicsClientId=client)
                angle = _tilt_degrees(quaternion)
                max_tilt[item_id] = max(max_tilt[item_id], angle)
                if initial_bottoms[item_id] - (position[2] - half_extents[item_id][2]) > 0.10:
                    fell_from_start.add(item_id)
                if step % RECORD_EVERY == 0 or step == steps - 1:
                    qx, qy, qz, qw = quaternion
                    tracks[item_id].append([
                        round(t, 4), round(position[0] * CM_PER_M, 3),
                        round(position[1] * CM_PER_M, 3), round(position[2] * CM_PER_M, 3),
                        round(qx, 6), round(qy, 6), round(qz, 6), round(qw, 6),
                    ])

            for contact in bullet.getContactPoints(physicsClientId=client):
                body_a, body_b = contact[1], contact[2]
                if body_a not in body_to_id or body_b not in body_to_id:
                    continue
                id_a, id_b = body_to_id[body_a], body_to_id[body_b]
                falling_a = max_tilt[id_a] > 45 or id_a in fell_from_start
                falling_b = max_tilt[id_b] > 45 or id_b in fell_from_start
                if falling_a:
                    contact_targets[id_a].add(id_b)
                    impacted_by[id_b].add(id_a)
                if falling_b:
                    contact_targets[id_b].add(id_a)
                    impacted_by[id_a].add(id_b)

        output_items: list[dict[str, Any]] = []
        global_impacted_ids: set[str] = set()
        collisions: set[tuple[str, str]] = set()
        for item in sorted(request.items, key=lambda value: value.id):
            body = id_to_body[item.id]
            final_pose = _pose(client, body, half_extents[item.id])
            start = initial_centers[item.id]
            end = [
                _metres(final_pose["position"]["x"]),
                _metres(final_pose["position"]["y"]),
                _metres(final_pose["position"]["z"]),
            ]
            moved_cm = math.dist(start, end) * CM_PER_M
            if max_tilt[item.id] > 45:
                outcome = "tipped"
            elif item.id in fell_from_start:
                outcome = "fell"
            elif moved_cm >= 2:
                outcome = "slid"
            else:
                outcome = "stationary"

            hit_ids = sorted(contact_targets[item.id]) or None
            hit_zones: list[str] = []
            if outcome in {"tipped", "fell"}:
                for zone in request.criticalZones:
                    if zone.type != "exit" and _overlaps_zone(final_pose["footprint"], zone):
                        if zone.type not in hit_zones:
                            hit_zones.append(zone.type)
            if hit_ids:
                global_impacted_ids.update(hit_ids)
                collisions.update((item.id, target_id) for target_id in hit_ids)
            output_items.append({
                "id": item.id,
                "type": item.type,
                "anchored": item.anchored,
                "outcome": outcome,
                "before": {
                    **item.before.model_dump(),
                    "topZ": item.before.bottomZ + item.dimensions.heightCm,
                },
                "after": {
                    "footprint": final_pose["footprint"],
                    "bottomZ": final_pose["bottomZ"],
                    "topZ": final_pose["topZ"],
                    "pose": {
                        "position": final_pose["position"],
                        "rotation": final_pose["rotation"],
                    },
                },
                "impact": {
                    "hit": bool(hit_zones),
                    "hitItemIds": hit_ids,
                    "hitZones": hit_zones,
                },
                "wasHit": bool(impacted_by[item.id]),
                "hitByItemIds": sorted(impacted_by[item.id]) or None,
                "track": tracks[item.id],
            })

        impacted = sorted(global_impacted_ids) or None
        return {
            "simulation": {
                "engine": "PyBullet",
                "mode": "physics",
                "intensity": request.earthquake.intensity,
                "pgaG": round(pga, 4),
                "durationSeconds": request.earthquake.durationSeconds,
                "fixedStepHz": round(1 / FIXED_STEP),
                "trackFps": round(1 / (FIXED_STEP * RECORD_EVERY)),
            },
            "items": output_items,
            "criticalZones": [zone.model_dump(exclude_none=True) for zone in request.criticalZones],
            "impact": {"hit": bool(impacted), "itemIds": impacted},
            "collisions": [
                {"sourceItemId": source_id, "targetItemId": target_id}
                for source_id, target_id in sorted(collisions)
            ],
        }
    finally:
        bullet.disconnect(physicsClientId=client)
