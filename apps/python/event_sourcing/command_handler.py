"""Command handler base class."""

from abc import ABC, abstractmethod
from typing import List

from .command import COMMANDS
from .event import EVENTS


class CommandHandler(ABC):
    """Base class for all command handlers."""

    @abstractmethod
    def handle(self, command: COMMANDS) -> List[EVENTS]:
        """Handle a command and return emitted events."""
        pass
