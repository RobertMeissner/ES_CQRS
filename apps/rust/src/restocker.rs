//! Restocker aggregate and command handler implementation.

use crate::command::{Command, RestockOrder};
use crate::command_handler::CommandHandler;
use crate::event::{Event, RestockOrdered};

/// Command handler for restock commands.
pub struct RestockCommandHandler {
    history: Vec<RestockOrdered>,
    publish: Vec<RestockOrdered>,
}

impl RestockCommandHandler {
    /// Create a new command handler with the given event history.
    pub fn new(history: Vec<RestockOrdered>) -> Self {
        Self {
            history,
            publish: Vec::new(),
        }
    }

    /// Get the published events.
    pub fn published(&self) -> &[RestockOrdered] {
        &self.publish
    }
}

impl CommandHandler<RestockOrder, RestockOrdered> for RestockCommandHandler {
    fn handle(&mut self, command: &RestockOrder) -> Vec<RestockOrdered> {
        let state = RestockerState::new(&self.history);
        let mut restocker = Restocker::new(state);
        let events = restocker.handle(command);
        self.publish = events.clone();
        events
    }
}

/// Aggregate trait for handling commands.
pub trait Aggregate<C: Command, E: Event> {
    /// Handle a command and return emitted events.
    fn handle(&mut self, command: &C) -> Vec<E>;
}

/// State rebuilt from restock events.
#[derive(Debug, Clone)]
pub struct RestockerState {
    pub quantity: i32,
}

impl RestockerState {
    /// Create state by replaying events.
    pub fn new(events: &[RestockOrdered]) -> Self {
        let mut quantity = 0;

        for event in events {
            if event.event_type() == RestockOrdered::TYPE {
                quantity += event.quantity;
            }
        }

        Self { quantity }
    }
}

/// Aggregate that handles restock commands.
pub struct Restocker {
    state: RestockerState,
}

impl Restocker {
    pub fn new(state: RestockerState) -> Self {
        Self { state }
    }
}

impl Aggregate<RestockOrder, RestockOrdered> for Restocker {
    fn handle(&mut self, command: &RestockOrder) -> Vec<RestockOrdered> {
        if self.state.quantity < 100 {
            vec![RestockOrdered::new(command.quantity)]
        } else {
            vec![]
        }
    }
}
