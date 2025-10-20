//! Event sourcing framework in Rust.

pub mod command;
pub mod command_handler;
pub mod event;
pub mod restocker;

// Re-exports for convenience
pub use command::{Command, RestockOrder};
pub use command_handler::CommandHandler;
pub use event::{Event, RestockOrdered};
pub use restocker::{Aggregate, Restocker, RestockCommandHandler, RestockerState};

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper struct for creating events in tests.
    struct EventBuilders;

    impl EventBuilders {
        fn restocked(quantity: i32) -> RestockOrdered {
            RestockOrdered::new(quantity)
        }
    }

    /// Helper struct for creating commands in tests.
    struct CommandBuilders;

    impl CommandBuilders {
        fn restock(quantity: i32) -> RestockOrder {
            RestockOrder::new(quantity)
        }
    }

    /// Test fixture for Given-When-Then tests.
    struct TestFixture {
        history: Vec<RestockOrdered>,
    }

    impl TestFixture {
        fn new() -> Self {
            Self {
                history: Vec::new(),
            }
        }

        /// GIVEN: Set up event history.
        fn given(&mut self, events: Vec<RestockOrdered>) {
            self.history = events;
        }

        /// WHEN: Execute a command and return published events.
        fn when(&self, command: RestockOrder) -> Vec<RestockOrdered> {
            let mut handler = RestockCommandHandler::new(self.history.clone());
            handler.handle(&command)
        }
    }

    #[test]
    fn test_emits_restock_ordered_when_asked_to_restock() {
        // Test that RestockOrdered event is emitted when stock is low
        let mut fixture = TestFixture::new();

        // GIVEN: No previous restock history
        fixture.given(vec![]);

        // WHEN: We request a restock of 100 units
        let result = fixture.when(CommandBuilders::restock(100));

        // THEN: A RestockOrdered event should be published
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].event_type(), "restock_ordered");
        assert_eq!(result[0].quantity, 100);
    }

    #[test]
    fn test_emits_no_restock_ordered_when_enough_stock_is_available() {
        // Test that no event is emitted when stock is sufficient
        let mut fixture = TestFixture::new();

        // GIVEN: Stock has been restocked twice before (150 units total)
        fixture.given(vec![
            EventBuilders::restocked(100),
            EventBuilders::restocked(50),
        ]);

        // WHEN: We request another restock of 50 units
        let result = fixture.when(CommandBuilders::restock(50));

        // THEN: No events should be published (we already have enough stock)
        assert_eq!(result.len(), 0);
    }
}
