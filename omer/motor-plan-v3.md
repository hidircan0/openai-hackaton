# Physics simulation implementation plan · v3

This file records the current implementation choices requested for the project. It supersedes conflicting v2 choices for engine/runtime, earthquake controls, and collision reporting. The remaining v2 details are design background, not requirements where they conflict with this file.

## Goal

Run a deterministic 3D rigid-body approximation on the server using Python and PyBullet. The user confirms whether each detected item is anchored, chooses earthquake intensity from 1 to 9, and chooses a duration from 5 to 60 seconds. Return each item's final pose and outcome, and report furniture-to-furniture collisions.

This is an approximate object-level simulation, not a structural assessment or an exact earthquake model.

## Request and response contract

`POST /api/simulation` accepts:

```json
{
  "room": { "dimensions": { "widthCm": 400, "depthCm": 300, "heightCm": 260 } },
  "items": [
    {
      "id": "bookcase-1",
      "type": "bookcase",
      "dimensions": { "widthCm": 80, "depthCm": 40, "heightCm": 190 },
      "before": {
        "footprint": { "x1": 50, "y1": 0, "x2": 130, "y2": 40 },
        "bottomZ": 0
      },
      "anchored": false
    }
  ],
  "earthquake": { "intensity": 5, "durationSeconds": 15 }
}
```

- All lengths and positions are in centimeters. `anchored` is explicitly supplied by the user for every item.
- `intensity` is an integer in `[1, 9]`; `durationSeconds` is an integer in `[5, 60]`. The initial calibration maps intensity linearly to PGA from `0.05g` through `0.50g`; values are simulation parameters, not a measured earthquake scale.
- The response contains `items[].outcome`, `items[].after`, and `items[].impact`. `impact.hit` is always boolean. `impact.hitItemIds` contains the IDs of other furniture items struck by that item, or `null` when there were no furniture-to-furniture contacts.
- A struck item also has `wasHit: true` and `hitByItemIds` containing the falling item's ID(s). Otherwise `wasHit` is false and `hitByItemIds` is `null`.
- A room-level `impact.hit` and `impact.itemIds` summarize all impacted furniture IDs. `itemIds` is `null` when no furniture item was hit. Floor and room-wall contacts are not included in this furniture collision list.
- A 20 fps pose track is returned for rendering. The browser only renders these poses; it does not simulate physics.

## Runtime

- Python 3.11 service at `omer/simulation`, using pinned `pybullet==3.2.7`, FastAPI, and Uvicorn.
- The Next.js `POST /api/simulation` route forwards validated input to the Python service. `SIMULATION_SERVICE_URL` configures the service URL.
- Docker Compose runs the web app and the Python service together. A hosted deployment must make the Python service reachable and set the same environment variable for Next.js.
- Fixed 120 Hz steps, stable item ordering, and deterministic collision settings. Duration controls simulated seconds; wall-clock request timeout must allow the maximum simulation.

## Implementation order

1. Define and validate the Python request/response schema, including all user-selected anchoring states and parameter bounds.
2. Build the PyBullet room and item bodies; apply a deterministic horizontal ground-acceleration waveform derived from intensity and duration.
3. Capture final pose, outcome, motion tracks, and furniture-to-furniture contacts; return `null` when the impacted-ID list is empty.
4. Expose `/simulate` and `/health` in FastAPI; add the Next.js forwarding route and Docker Compose service.
5. Hand the request/response contract to Rabii for the per-item anchored controls, intensity and duration sliders, and result display; UI implementation is outside Ömer's task.
6. Hand the Python service container and `SIMULATION_SERVICE_URL` requirement to Hıdırcan for Compose/deployment wiring; deployment configuration outside `omer/` is outside Ömer's task.
7. Hand the pose-track contract to Hıdırcan so the scene renders server-produced motion without running its own physics.

## Ownership boundary

Ömer's implementation scope is the Python simulation service, its input/output contract, and the backend forwarding route. The page UI belongs to Rabii; shared Compose and deployment configuration belongs to Hıdırcan. This plan documents those handoffs but does not authorize editing their files.

## Limits and safe interpretation

- Furniture dimensions, mass, and friction are estimates. Any default density/material values are simulation assumptions.
- The simulation does not evaluate the building structure or predict earthquake damage.
- This feature must not claim that a room or building is safe based only on the simulation result.
