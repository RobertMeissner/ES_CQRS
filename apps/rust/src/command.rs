//! Command types and trait definition.

/// Base trait for all commands.
pub trait Command {}

/// Command to request a restock order.
#[derive(Debug, Clone, PartialEq)]
pub struct RestockOrder {
    pub quantity: i32,
}

impl RestockOrder {
    pub fn new(quantity: i32) -> Self {
        Self { quantity }
    }
}

impl Command for RestockOrder {}
