# Architecture Review & TODO

## Comprehensive Quality Assessment

This document provides a detailed analysis of the Event Sourcing & CQRS implementation quality, covering CQRS patterns, Event Sourcing principles, Dependency Injection, SOLID principles, and CUPID principles.

---

## 📊 CQRS (Command Query Responsibility Segregation)

### ✅ Strengths:
1. **Separate read model** - `Products` read model is distinct from write model (Aggregates)
2. **Query abstraction** - `QueryCatalog` properly represents read intentions
3. **Command pattern** - `RestockOrder` command exists
4. **Handler separation** - `RestockCommandHandler` separate from read model

### ❌ Critical Issues:

#### Issue #1: CLI bypasses CQRS completely
**Location:** `src/cli/loop.ts:39-60`

**Current (WRONG):**
```typescript
// Direct event creation
const addEvent = new AddProduct(parts[1]);
eventStore.append(addEvent);
```

**Should be:**
```typescript
// Command → CommandHandler → Aggregate → Events
const command = new AddProductCommand(parts[1]);
commandBus.dispatch(command);
```

**Problem:** The CLI directly creates events instead of dispatching commands through proper command handlers.

#### Issue #2: Missing commands
- `AddProduct` is an EVENT, not a COMMAND
- No `AddProductCommand` exists
- CLI creates events directly = **CQRS violation**

#### Issue #3: No command/query buses
- No mediator pattern
- Direct coupling to handlers
- No centralized command/query dispatching

---

## 📊 Event Sourcing

### ✅ Strengths:
1. **Event store** - Append-only semantics
2. **Event replay** - Read model rebuilds from events (`src/cli/loop.ts:10-12`)
3. **Projection logic** - `Products.project()` properly applies events
4. **Persistence** - Events saved to file
5. **Deserialization** - Event reconstruction from JSON

### ❌ Critical Issues:

#### Issue #1: `clear()` method violates immutability
**Location:** `src/infrastructure/event_store.ts:22-24`

```typescript
clear(): void {
    this.events = []; // ❌ DELETES HISTORY!
}
```

**Problem:** Event stores should be **append-only**. History deletion breaks Event Sourcing core principles.

**Solution:** Either remove this method entirely OR append a "StreamCleared" event instead of deleting history.

#### Issue #2: No aggregate streams/boundaries
- All events in one stream
- No aggregate IDs
- Can't replay specific aggregate
- `RestockOrdered` has default product_id (`src/domain/Event.ts:20`)

**Problem:** Without aggregate boundaries, you can't:
- Replay a single aggregate
- Implement proper concurrency control
- Scale to multiple aggregates

#### Issue #3: Events are mutable
**Location:** `src/domain/Event.ts`

```typescript
export class AddProduct extends Event {
    constructor(public product_id: string) { // ❌ public mutable
```

**Problem:** Event properties should be `readonly` for true immutability.

**Should be:**
```typescript
constructor(public readonly product_id: string)
```

#### Issue #4: Bug in RestockAlreadyOrdered
**Location:** `src/domain/Event.ts:36`

```typescript
constructor() {
    super(new Date());
    this.type = RestockOrdered.type; // ❌ WRONG TYPE!
}
```

**Problem:** Should be `RestockAlreadyOrdered.type` not `RestockOrdered.type`

#### Issue #5: No event versioning
- No schema version field
- Can't evolve events over time
- Backward compatibility hack (`RestockOrdered` dual constructor)

**Problem:** When events need to change structure, you have no way to handle old vs new versions.

**Solution:**
```typescript
export class AddProduct extends Event {
    readonly version: number = 1;
    // ...
}
```

#### Issue #6: Missing timestamps for ordering
- `recorded_at` exists but not used for ordering
- No sequence numbers

**Problem:** Can't guarantee event ordering in distributed systems.

---

## 📊 Dependency Injection

### ❌ Score: 1/10 - Almost None Exists

#### Issue #1: Hard-coded dependencies in CLI
**Location:** `src/cli/loop.ts:7-8`

```typescript
const eventStore = new EventStore(); // ❌ Direct instantiation
const products = new Products();     // ❌ Direct instantiation
```

**Problem:** CLI creates its own dependencies. Can't swap implementations, can't test easily.

#### Issue #2: Hard-coded file path
**Location:** `src/infrastructure/event_store.ts:9`

```typescript
constructor(initialEvents: EVENTS[] = [], filePath: string = './events.json')
```

**Problem:** Hard-coded default = configuration nightmare in production.

#### Issue #3: Handlers create dependencies
**Location:** `src/handlers/restock_command_handler.ts:17-18`

```typescript
const state = new RestockerState(this._history) // ❌ Creates own dependencies
const restocker = new Restocker(state);
```

**Problem:** Handler is responsible for creating aggregates. Violates dependency inversion.

#### Issue #4: No interfaces for infrastructure
- `EventStore` is concrete class, not interface
- Can't swap implementations
- Can't mock for testing

**What proper DI would look like:**
```typescript
// Should have:
interface IEventStore {
    append(event: EVENTS): void;
    getAll(): EVENTS[];
    save(): void;
    load(): void;
}

interface IReadModel {
    project(event: EVENTS): void;
    handle(query: QUERIES): any;
}

class CLI {
    constructor(
        private eventStore: IEventStore,
        private readModel: IReadModel
    ) {}
}

// In main.ts:
const eventStore = new FileEventStore('./events.json');
const readModel = new Products();
const cli = new CLI(eventStore, readModel);
```

---

## 📊 SOLID Principles

### S - Single Responsibility Principle: 4/10

#### ✅ Good:
- `Restocker` aggregate: handles one business rule
- `Products` read model: one projection
- `RestockerState`: state reconstruction

#### ❌ Bad:
**CLI does EVERYTHING** (`src/cli/loop.ts`):
- UI/input parsing
- Command creation (sort of)
- Event creation (WRONG!)
- Event store operations
- Read model operations
- Output formatting

**Problem:** One class with 7+ responsibilities violates SRP massively.

---

### O - Open/Closed Principle: 3/10

#### ❌ Issue #1: EventStore.deserializeEvent()
**Location:** `src/infrastructure/event_store.ts:45-60`

Giant switch statement:
```typescript
private deserializeEvent(data: any): EVENTS {
    switch (data.type) {
        case 'add_product': ...
        case 'restock_ordered': ...
        // Must modify for every new event type
    }
}
```

**Problem:** Must modify `EventStore` code for every new event type. Not open for extension.

**Solution:** Event registry pattern or reflection.

#### ❌ Issue #2: Products.project()
**Location:** `src/read_models/products.ts:10-16`

If/else chain:
```typescript
project(event: EVENTS): void {
    if (event instanceof AddProduct) {
        // ...
    } else if (event instanceof RestockOrdered) {
        // ...
    }
}
```

**Problem:** Must modify for new events. Not extensible.

**Solution:** Event handler registry or visitor pattern.

#### ❌ Issue #3: Union types require modification
- `EVENTS` union type
- `COMMANDS` union type

**Problem:** Every new event/command requires modifying the type definition.

---

### L - Liskov Substitution Principle: 6/10

#### ✅ Mostly okay
Minimal inheritance, so fewer opportunities to violate LSP.

#### ❌ Issue: RestockAlreadyOrdered
Breaks LSP with wrong type assignment (see Event Sourcing Issue #4).

---

### I - Interface Segregation Principle: 7/10

#### ✅ Good:
- Small, focused interfaces
- `CommandHandler`, `EventHandler`, `Aggregate`, `ReadModel` are minimal

#### ⚠️ Could improve:
**Location:** `src/domain/read_model.ts`

```typescript
export abstract class ReadModel<T = any> {
    abstract _state: T; // ❌ Forces state exposure
}
```

**Problem:** Forces all read models to expose internal state. Breaks encapsulation.

---

### D - Dependency Inversion Principle: 2/10

#### ❌ Major violations:

1. **CLI depends on concrete classes**
   - Depends on **concrete** `EventStore` and `Products`
   - No abstractions/interfaces for infrastructure

2. **High-level policy depends on low-level details**
   - CLI (high-level) depends on file I/O implementation (low-level)

3. **No abstractions**
   - Everything is concrete
   - Can't swap implementations

**Should follow:** Depend on abstractions, not concretions.

---

## 📊 CUPID Principles (Dan North)

### C - Composable: 3/10

#### ❌ Components are tightly coupled
- Can't compose different event stores
- Can't compose different read models
- CLI is monolithic
- No way to combine/swap behaviors

**Problem:** Tight coupling prevents composition and reuse.

---

### U - Unix Philosophy (Do One Thing Well): 5/10

#### ✅ Good:
Individual classes mostly do one thing

#### ❌ Bad:
CLI violates this completely (see SRP section)

---

### P - Predictable: 4/10

#### ❌ Unpredictable behaviors:

1. **`clear()` has destructive side effects**
   - Deletes all history
   - No way to recover
   - Violates event sourcing immutability

2. **CLI mutates global state**
   - Direct mutations everywhere
   - No pure functions

3. **No return values indicating success/failure**
   - Commands return void
   - No error handling
   - Silent failures possible

4. **`save()` can fail silently**
   - File I/O can fail
   - No error propagation

#### ✅ Predictable:
- Event projection is deterministic
- Pure state reconstruction in `RestockerState`

---

### I - Idiomatic: 7/10

#### ✅ Good:
- TypeScript idioms mostly followed
- Modern ES6+ syntax
- Proper class definitions

#### ❌ Could improve:
- Public mutable fields instead of readonly
- Missing proper TypeScript features:
  - Enums for event types
  - Const assertions
  - Branded types for IDs
  - Discriminated unions

---

### D - Domain-Based: 8/10

#### ✅ Excellent domain modeling:
- Clear ubiquitous language (Restock, Capacity, Threshold)
- Domain events well-named
- Aggregate concept present
- Business rules in aggregates (not scattered)
- Separation of concerns (domain vs infrastructure)

#### ⚠️ Could improve:
- More explicit bounded contexts
- Aggregate root enforcement
- Value objects for domain concepts

---

## 🎯 Summary Scorecard

| Aspect | Score | Grade | Status |
|--------|-------|-------|--------|
| **CQRS** | 4/10 | D | Needs major work |
| **Event Sourcing** | 5/10 | D+ | Core violations exist |
| **Dependency Injection** | 1/10 | F | Almost non-existent |
| **SOLID - SRP** | 4/10 | D | CLI violates badly |
| **SOLID - OCP** | 3/10 | F | Switch statements everywhere |
| **SOLID - LSP** | 6/10 | C | Mostly okay |
| **SOLID - ISP** | 7/10 | B- | Good interfaces |
| **SOLID - DIP** | 2/10 | F | No abstractions |
| **SOLID Overall** | 4.4/10 | D | Multiple violations |
| **CUPID - Composable** | 3/10 | F | Tightly coupled |
| **CUPID - Unix** | 5/10 | D+ | CLI does too much |
| **CUPID - Predictable** | 4/10 | D | Side effects everywhere |
| **CUPID - Idiomatic** | 7/10 | B- | Decent TypeScript |
| **CUPID - Domain** | 8/10 | B+ | Best aspect |
| **CUPID Overall** | 5.4/10 | D+ | Domain-driven but technical debt |
| **Overall Code Quality** | **4/10** | **D** | **Needs refactoring** |

---

## 🔧 Prioritized Recommendations

### 🔴 Critical (Must Fix)

#### 1. Remove or fix `clear()` method
**File:** `src/infrastructure/event_store.ts`
**Priority:** CRITICAL
**Reason:** Violates event sourcing immutability

**Options:**
- Remove entirely
- Replace with append-only "StreamCleared" event
- Add "soft delete" flag instead of actual deletion

#### 2. Fix `RestockAlreadyOrdered` type bug
**File:** `src/domain/Event.ts:36`
**Priority:** CRITICAL - BUG
**Current:** `this.type = RestockOrdered.type;`
**Fix:** `this.type = RestockAlreadyOrdered.type;`

#### 3. Implement proper CQRS
**Files:** `src/cli/loop.ts`, new command files
**Priority:** CRITICAL
**Changes needed:**
- Create `AddProductCommand` class
- Create `AddProductCommandHandler`
- CLI should dispatch commands, not create events
- Only aggregates/handlers should create events

#### 4. Add dependency injection
**Files:** All files, especially `src/cli/loop.ts`
**Priority:** CRITICAL
**Changes needed:**
- Create interfaces for infrastructure (`IEventStore`, `IReadModel`)
- Inject dependencies via constructor
- Remove all `new` operators from business logic
- Create composition root

#### 5. Make event properties readonly
**File:** `src/domain/Event.ts`
**Priority:** CRITICAL
**Changes needed:**
```typescript
constructor(public readonly product_id: string)
```

---

### 🟡 High Priority

#### 6. Add aggregate IDs and stream boundaries
**Files:** `src/domain/Event.ts`, `src/infrastructure/event_store.ts`
**Changes needed:**
- Add `aggregateId` to all events
- Add `aggregateType` field
- Implement `getByAggregateId()` method
- Support multiple aggregate instances

#### 7. Create event/command registry
**Files:** `src/infrastructure/event_store.ts`, new registry file
**Changes needed:**
- Replace switch statements with registry pattern
- Auto-registration of events
- Type-safe deserialization

#### 8. Add proper error handling and result types
**Files:** All command handlers, event store
**Changes needed:**
```typescript
type Result<T, E> = Success<T> | Failure<E>;
class Success<T> { constructor(public value: T) {} }
class Failure<E> { constructor(public error: E) {} }
```

#### 9. Separate CLI concerns
**File:** `src/cli/loop.ts`
**Changes needed:**
- Extract `CommandParser` class
- Extract `CommandExecutor` class
- Extract `ResultPresenter` class
- Keep CLI as thin orchestrator

#### 10. Add event versioning
**Files:** `src/domain/Event.ts`, event store
**Changes needed:**
```typescript
abstract class Event {
    abstract readonly version: number;
}
```

---

### 🟢 Medium Priority

#### 11. Create interfaces for infrastructure
**Files:** New interface files
**Changes needed:**
- `IEventStore` interface
- `IReadModel` interface
- `ICommandBus` interface
- `IQueryBus` interface

#### 12. Add event sequence numbers
**Files:** `src/infrastructure/event_store.ts`, `src/domain/Event.ts`
**Changes needed:**
- Auto-incrementing sequence number per stream
- Use for ordering guarantees

#### 13. Implement optimistic concurrency
**Files:** Event store, aggregates
**Changes needed:**
- Version field on aggregates
- Concurrency exception on version mismatch
- Expected version parameter

#### 14. Add snapshotting for performance
**Files:** New snapshot store, aggregates
**Changes needed:**
- Snapshot after N events
- Rebuild from snapshot + remaining events
- Improves performance for long-lived aggregates

---

## 📝 File-Specific TODO List

### src/infrastructure/event_store.ts
- [ ] Remove `clear()` or make it append-only
- [ ] Add `IEventStore` interface
- [ ] Replace `deserializeEvent()` switch with registry
- [ ] Add aggregate stream support (`getByAggregateId()`)
- [ ] Add event versioning support
- [ ] Add sequence numbers
- [ ] Proper error handling for file I/O
- [ ] Configuration injection for file path

### src/domain/Event.ts
- [ ] Fix `RestockAlreadyOrdered.type` bug
- [ ] Make all properties `readonly`
- [ ] Add `aggregateId` field
- [ ] Add `version` field
- [ ] Add sequence numbers
- [ ] Consider using enums for types

### src/cli/loop.ts
- [ ] Remove direct event creation
- [ ] Create commands instead of events
- [ ] Inject `EventStore` and `Products` dependencies
- [ ] Extract `CommandParser` class
- [ ] Extract `CommandExecutor` class
- [ ] Extract `ResultPresenter` class
- [ ] Add proper error handling
- [ ] Remove global state mutations

### src/domain/Command.ts
- [ ] Add `AddProductCommand`
- [ ] Add `RestockProductCommand` (rename from `RestockOrder`)
- [ ] Add proper command properties (aggregateId, etc.)

### src/read_models/products.ts
- [ ] Remove `_state` from public interface
- [ ] Replace if/else chain with handler registry
- [ ] Add error handling for unknown events

### src/handlers/restock_command_handler.ts
- [ ] Inject aggregate factory instead of creating directly
- [ ] Return Result type instead of void
- [ ] Remove `_publish` public array (use callback/bus)

### New files needed:
- [ ] `src/infrastructure/command_bus.ts`
- [ ] `src/infrastructure/query_bus.ts`
- [ ] `src/infrastructure/event_registry.ts`
- [ ] `src/domain/interfaces/IEventStore.ts`
- [ ] `src/domain/interfaces/IReadModel.ts`
- [ ] `src/domain/Result.ts` (for error handling)
- [ ] `src/commands/AddProductCommand.ts`
- [ ] `src/handlers/AddProductCommandHandler.ts`

---

## 💡 Additional Recommendations

### Testing
- Add integration tests for full command → event → projection flow
- Add unit tests for command handlers with mocked dependencies
- Add contract tests for event serialization/deserialization

### Documentation
- Add ADR (Architecture Decision Records) for key decisions
- Document event schemas
- Add sequence diagrams for key flows

### Production Readiness
- Add logging/observability
- Add metrics (commands processed, events stored)
- Add health checks
- Add graceful shutdown
- Consider event store transactions

---

## 🎓 Learning Resources

For workshop participants to improve understanding:

1. **CQRS**: https://martinfowler.com/bliki/CQRS.html
2. **Event Sourcing**: https://martinfowler.com/eaaDev/EventSourcing.html
3. **SOLID Principles**: https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design
4. **CUPID Principles**: https://dannorth.net/2022/02/10/cupid-for-joyful-coding/
5. **Dependency Injection**: https://www.martinfowler.com/articles/injection.html

---

## ✅ Definition of Done

The refactoring is complete when:

- [ ] All CRITICAL issues fixed
- [ ] All tests passing
- [ ] CQRS score: 8+/10
- [ ] Event Sourcing score: 8+/10
- [ ] Dependency Injection score: 7+/10
- [ ] SOLID average: 7+/10
- [ ] No hard-coded dependencies
- [ ] CLI separated into focused classes
- [ ] Full command → aggregate → event → projection flow working
- [ ] Documentation updated
- [ ] Workshop participants can understand and modify easily
