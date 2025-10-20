"""Restocker aggregate and command handler implementation."""

from abc import ABC, abstractmethod
from typing import List

from .command import COMMANDS, RestockOrder
from .event import EVENTS, RestockOrdered
from .command_handler import CommandHandler


class RestockCommandHandler(CommandHandler):
    """Command handler for restock commands."""

    def __init__(self, events: List[EVENTS]):
        self._history = events
        self._publish: List[EVENTS] = []

    def handle(self, command: COMMANDS) -> List[EVENTS]:
        """Handle a restock command."""
        if isinstance(command, RestockOrder):
            state = RestockerState(self._history)
            restocker = Restocker(state)
            events = restocker.handle(command)
            self._publish = events
            return events
        return []


class Aggregate(ABC):
    """Base class for aggregates."""

    @abstractmethod
    def handle(self, command: COMMANDS) -> List[EVENTS]:
        """Handle a command and return emitted events."""
        pass


class RestockerState:
    """State rebuilt from restock events."""

    def __init__(self, events: List[EVENTS]):
        self.quantity = 0

        for event in events:
            if event.type == RestockOrdered.TYPE:
                self.quantity += event.quantity


class Restocker(Aggregate):
    """Aggregate that handles restock commands."""

    def __init__(self, state: RestockerState):
        self.state = state

    def handle(self, command: COMMANDS) -> List[EVENTS]:
        """Handle a command and return emitted events."""
        if isinstance(command, RestockOrder):
            if self.state.quantity < 100:
                return [RestockOrdered(command.quantity)]
        return []
