from fastapi import FastAPI

from cem.kayma_skoru import kayma_skoru_hesapla

from .engine import exit_zone_penalties, simulate
from .models import SimulationRequest

app = FastAPI(title="Sarsıntı Physics Simulation", version="1.0.0")
SLIDING_SCORE_ALPHA = 2.0


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "PyBullet"}


@app.post("/simulate")
def simulate_room(request: SimulationRequest) -> dict:
    result = simulate(request)
    initial_penalties = exit_zone_penalties(request, result["items"])
    score_input = {
        "room": {"dimensions": request.room.dimensions.model_dump()},
        "items": result["items"],
        "criticalZones": result["criticalZones"],
        "penalties": {"alpha": SLIDING_SCORE_ALPHA, "impacts": initial_penalties},
    }
    score = kayma_skoru_hesapla(score_input)

    score_by_item_id = {item["id"]: item for item in score["items"]}
    for item in result["items"]:
        item_score = score_by_item_id.get(item["id"])
        if item_score is None:
            item["displacement"] = None
            item["impact"].setdefault("multiplier", None)
            continue
        item["displacement"] = item_score["displacement"]
        # `hit` and `hitZones` describe contact with risk zones; physical
        # furniture-to-furniture contacts remain in `hitItemIds`.
        item["impact"].update(item_score["impact"])

    result.update({
        "rawSafetyScore": score["rawSafetyScore"],
        "safetyScore": score["safetyScore"],
        "penalties": score["penalties"],
    })
    return result
