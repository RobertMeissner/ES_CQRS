# Minimal Event Sourcing & CQRS Implementation

## Overview
A minimal TypeScript implementation of Event Sourcing and CQRS with an in-memory event store, read model, and CLI.

## Architecture

### Core Components

1. **Event Store** (`src/infrastructure/event_store.ts`)
   - In-memory event storage with file persistence
   - Append-only event stream
   - Saves events to `events.json` file
   - Automatically loads events on startup
   - Simple API: `append()`, `getAll()`, `clear()`, `save()`, `load()`

2. **Read Model** (`src/read_models/products.ts`)
   - Products catalog projection
   - Projects `AddProduct` and `RestockOrdered` events
   - Handles `QueryCatalog` queries

3. **Domain Events** (`src/domain/Event.ts`)
   - `AddProduct`: Add a new product
   - `RestockOrdered`: Restock a product
   - `CapacityDefined`: Define product capacity
   - `ThresholdReached`: Stock threshold reached

4. **Queries** (`src/domain/Query.ts`)
   - `QueryCatalog`: Query the product catalog

## Usage

### Run Tests
```bash
npm test
```

**Test Coverage:** 47 tests across 4 test suites
- `read_model.test.ts` - Read model projections (7 tests)
- `restocker.test.ts` - Command handlers and sagas (17 tests)
- `event_store.test.ts` - Event store persistence (13 tests)
- `integration.test.ts` - End-to-end integration (10 tests)

Coverage includes:
- ✅ Happy path scenarios
- ✅ Edge cases (empty states, zero values, etc.)
- ✅ Unhappy paths (invalid data, missing files)
- ✅ Persistence and event replay
- ✅ Full integration flows

### Run Example
```bash
npm run example
```

Output:
```
Event Sourcing Example

Event applied: add_product
Event applied: add_product
Event applied: restock_ordered
Event applied: restock_ordered

Product Catalog:
{ broccoli: 20, lasagne: 50 }
```

### Run CLI (loop)
```bash
npm run cli
```

Commands:
- `add <product_id>` - Add a product
- `restock <product_id> <qty>` - Restock a product
- `catalog` - Query product catalog
- `clear` - Clear all events
- `exit` - Exit the CLI

Example session:
```
> add broccoli
Product 'broccoli' added
> add lasagne
Product 'lasagne' added
> restock lasagne 50
Restocked 'lasagne' with 50 units
> catalog
Product Catalog:
{
  "broccoli": 0,
  "lasagne": 50
}
> exit
Goodbye!
```

**Persistence**: Events are automatically saved to `events.json` after each command. When you restart the CLI, all events are reloaded and the read model is rebuilt from the event history.

## File Structure

```
src/
├── domain/                      # Domain layer
│   ├── Event.ts                 # Event definitions
│   ├── Command.ts               # Command definitions
│   ├── Query.ts                 # Query definitions
│   ├── read_model.ts            # ReadModel interface
│   ├── aggregate.ts             # Aggregate interface
│   └── saga.ts                  # Saga interface
├── infrastructure/
│   └── event_store.ts           # In-memory event store
├── read_models/
│   └── products.ts              # Products read model
├── cli/
│   └── loop.ts                  # CLI implementation
├── example.ts                   # Usage example
└── read_model.test.ts           # Read model tests
```

## Key Principles

1. **Event Sourcing**: All state changes are captured as events
2. **CQRS**: Commands for writes, queries for reads
3. **Projections**: Read models are built by projecting events
4. **Immutability**: Events are immutable once created
5. **Minimal Dependencies**: Uses only TypeScript and Node.js built-ins

## Design Decisions

- **File-based persistence**: Events saved to JSON file for persistence across sessions
- **Event replay**: Read models rebuilt from event history on startup
- **Backward-compatible events**: `RestockOrdered` supports both old (quantity-only) and new (product_id + quantity) signatures
- **Simple CLI**: Interactive command-line interface for demonstration
- **Type safety**: Full TypeScript types throughout
- **Minimal dependencies**: Uses only Node.js built-in `fs` module for persistence
