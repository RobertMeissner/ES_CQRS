"""Command base class and concrete commands."""

from abc import ABC
from typing import Union


class Command(ABC):
    """Base class for all commands."""

    pass


class RestockOrder(Command):
    """Command to request a restock order."""

    def __init__(self, quantity: int):
        self.quantity = quantity


# Type alias for all command types
COMMANDS = Union[RestockOrder, None]
