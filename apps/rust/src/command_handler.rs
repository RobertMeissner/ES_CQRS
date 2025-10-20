//! Command handler trait definition.

use crate::command::Command;
use crate::event::Event;

/// Base trait for all command handlers.
pub trait CommandHandler<C: Command, E: Event> {
    /// Handle a command and return emitted events.
    fn handle(&mut self, command: &C) -> Vec<E>;
}
