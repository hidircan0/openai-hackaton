from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from cem.kayma_skoru.esya_tipleri import ESYA_TIPLERI, KAYMA_DISI_TIPLER


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Dimensions(StrictModel):
    widthCm: float = Field(gt=0, le=2000)
    depthCm: float = Field(gt=0, le=2000)
    heightCm: float = Field(gt=0, le=2000)


class RoomDimensions(StrictModel):
    widthCm: float = Field(gt=0, le=10000)
    depthCm: float = Field(gt=0, le=10000)
    heightCm: float = Field(gt=0, le=10000)


class Footprint(StrictModel):
    x1: float
    y1: float
    x2: float
    y2: float

    @model_validator(mode="after")
    def has_area(self) -> "Footprint":
        if self.x2 <= self.x1 or self.y2 <= self.y1:
            raise ValueError("Footprint must have positive width and depth.")
        return self


class CriticalZone(StrictModel):
    id: str | None = Field(default=None, min_length=1, max_length=120)
    type: Literal["bed", "work_area", "exit"]
    bounds: Footprint
    penaltyPoints: float = Field(ge=0, le=100)


class BeforePose(StrictModel):
    footprint: Footprint
    bottomZ: float = Field(ge=0, le=10000)


class Room(StrictModel):
    dimensions: RoomDimensions


class ItemInput(StrictModel):
    id: str = Field(min_length=1, max_length=120)
    type: str
    dimensions: Dimensions
    before: BeforePose
    anchored: bool
    # Hung on a wall (mirror, wall TV); an unanchored one stays on its hook until strong shaking.
    wallMounted: bool = False

    @field_validator("type")
    @classmethod
    def known_item_type(cls, value: str) -> str:
        if value not in ESYA_TIPLERI:
            valid_types = ", ".join(sorted(ESYA_TIPLERI))
            raise ValueError(f"Unknown item type {value!r}; expected one of: {valid_types}.")
        return value


class Earthquake(StrictModel):
    intensity: int = Field(ge=1, le=9)
    durationSeconds: int = Field(ge=5, le=60)


class SimulationRequest(StrictModel):
    room: Room
    items: list[ItemInput] = Field(min_length=1, max_length=25)
    criticalZones: list[CriticalZone] = Field(default_factory=list, max_length=50)
    earthquake: Earthquake

    @model_validator(mode="after")
    def validate_room_items(self) -> "SimulationRequest":
        dimensions = self.room.dimensions
        ids = [item.id for item in self.items]
        if len(ids) != len(set(ids)):
            raise ValueError("Item IDs must be unique.")

        zone_ids = [zone.id for zone in self.criticalZones if zone.id is not None]
        if len(zone_ids) != len(set(zone_ids)):
            raise ValueError("Critical zone IDs must be unique.")

        penalties_by_type: dict[str, float] = {}
        for zone in self.criticalZones:
            previous_penalty = penalties_by_type.setdefault(zone.type, zone.penaltyPoints)
            if previous_penalty != zone.penaltyPoints:
                raise ValueError(f"All {zone.type} zones must have the same penaltyPoints value.")
            bounds = zone.bounds
            if bounds.x1 < 0 or bounds.y1 < 0:
                raise ValueError(f"Critical zone {zone.id or zone.type} starts outside the room.")
            if bounds.x2 > dimensions.widthCm or bounds.y2 > dimensions.depthCm:
                raise ValueError(f"Critical zone {zone.id or zone.type} extends outside the room.")

        for item in self.items:
            footprint = item.before.footprint
            if footprint.x1 < 0 or footprint.y1 < 0:
                raise ValueError(f"Item {item.id} starts outside the room.")
            if footprint.x2 > dimensions.widthCm or footprint.y2 > dimensions.depthCm:
                raise ValueError(f"Item {item.id} extends outside the room.")
            if item.before.bottomZ + item.dimensions.heightCm > dimensions.heightCm:
                raise ValueError(f"Item {item.id} extends above the room ceiling.")
            actual_width = footprint.x2 - footprint.x1
            actual_depth = footprint.y2 - footprint.y1
            if abs(actual_width - item.dimensions.widthCm) > 1 or abs(actual_depth - item.dimensions.depthCm) > 1:
                raise ValueError(f"Item {item.id} dimensions must match its footprint within 1 cm.")

        if not any(item.type not in KAYMA_DISI_TIPLER for item in self.items):
            raise ValueError("At least one item type supported by the sliding score is required.")
        return self
