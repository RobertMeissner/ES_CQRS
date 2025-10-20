"""Event base class and concrete events."""

from abc import ABC
from datetime import datetime
from typing import Union


class Event(ABC):
    """Base class for all events."""

    def __init__(self, recorded_at: datetime):
        self.type: str = ""
        self.recorded_at = recorded_at


class RestockOrdered(Event):
    """Event emitted when a restock order is placed."""

    TYPE: str = "restock_ordered"

    def __init__(self, quantity: int):
        super().__init__(datetime.now())
        self.type = RestockOrdered.TYPE
        self.quantity = quantity


# Type alias for all event types
EVENTS = Union[RestockOrdered]
