//! Event types and trait definition.

use chrono::{DateTime, Utc};

/// Base trait for all events.
pub trait Event {
    /// Get the event type identifier.
    fn event_type(&self) -> &str;

    /// Get the timestamp when the event was recorded.
    fn recorded_at(&self) -> DateTime<Utc>;
}

/// Event emitted when a restock order is placed.
#[derive(Debug, Clone, PartialEq)]
pub struct RestockOrdered {
    pub quantity: i32,
    pub recorded_at: DateTime<Utc>,
}

impl RestockOrdered {
    pub const TYPE: &'static str = "restock_ordered";

    pub fn new(quantity: i32) -> Self {
        Self {
            quantity,
            recorded_at: Utc::now(),
        }
    }
}

impl Event for RestockOrdered {
    fn event_type(&self) -> &str {
        Self::TYPE
    }

    fn recorded_at(&self) -> DateTime<Utc> {
        self.recorded_at
    }
}
