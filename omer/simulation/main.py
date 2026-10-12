from fastapi import FastAPI

from .engine import simulate
from .models import SimulationRequest

app = FastAPI(title="Sarsıntı Physics Simulation", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "PyBullet"}


@app.post("/simulate")
def simulate_room(request: SimulationRequest) -> dict:
    return simulate(request)
