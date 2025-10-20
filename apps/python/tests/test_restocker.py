"""Tests for restocker aggregate using Given-When-Then pattern."""

from typing import List

import pytest

from event_sourcing import (
    RestockCommandHandler,
    RestockOrder,
    RestockOrdered,
    EVENTS,
)


# Test DSL (Domain Specific Language) helpers
class EventBuilders:
    """Helper class for creating events in tests."""

    @staticmethod
    def restocked(quantity: int) -> RestockOrdered:
        """Create a RestockOrdered event."""
        return RestockOrdered(quantity)


class CommandBuilders:
    """Helper class for creating commands in tests."""

    @staticmethod
    def restock(quantity: int) -> RestockOrder:
        """Create a RestockOrder command."""
        return RestockOrder(quantity)


# Test fixture instances
events = EventBuilders()
commands = CommandBuilders()


class TestRestocker:
    """Test suite for restocker aggregate."""

    def setup_method(self):
        """Set up test fixtures before each test."""
        self._history: List[EVENTS] = []

    def given(self, event_list: List[EVENTS]) -> None:
        """GIVEN: Set up event history."""
        self._history = event_list

    def when(self, command: RestockOrder) -> List[EVENTS]:
        """WHEN: Execute a command and return published events."""
        command_handler = RestockCommandHandler(self._history)
        return command_handler.handle(command)

    def test_emits_restock_ordered_when_asked_to_restock(self):
        """Test that RestockOrdered event is emitted when stock is low."""
        # GIVEN: No previous restock history
        self.given([])

        # WHEN: We request a restock of 100 units
        result = self.when(commands.restock(100))

        # THEN: A RestockOrdered event should be published
        assert len(result) == 1
        assert result[0].type == "restock_ordered"
        assert result[0].quantity == 100

    def test_emits_no_restock_ordered_when_enough_stock_is_available(self):
        """Test that no event is emitted when stock is sufficient."""
        # GIVEN: Stock has been restocked twice before (150 units total)
        self.given([
            events.restocked(100),
            events.restocked(50)
        ])

        # WHEN: We request another restock of 50 units
        result = self.when(commands.restock(50))

        # THEN: No events should be published (we already have enough stock)
        assert result == []
