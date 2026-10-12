from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, model_validator


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


class BeforePose(StrictModel):
    footprint: Footprint
    bottomZ: float = Field(ge=0, le=10000)


class Room(StrictModel):
    dimensions: RoomDimensions


class ItemInput(StrictModel):
    id: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=80)
    dimensions: Dimensions
    before: BeforePose
    anchored: bool


class Earthquake(StrictModel):
    intensity: int = Field(ge=1, le=9)
    durationSeconds: int = Field(ge=5, le=60)


class SimulationRequest(StrictModel):
    room: Room
    items: list[ItemInput] = Field(min_length=1, max_length=25)
    earthquake: Earthquake

    @model_validator(mode="after")
    def validate_room_items(self) -> "SimulationRequest":
        dimensions = self.room.dimensions
        ids = [item.id for item in self.items]
        if len(ids) != len(set(ids)):
            raise ValueError("Item IDs must be unique.")

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
        return self
