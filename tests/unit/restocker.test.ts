import {CapacityDefined, DomainEvent, RestockAlreadyOrdered, RestockOrdered, ThresholdReached} from "../../src/domain/Event";
import {DomainCommand, RestockOrder} from "../../src/domain/Command";
import {RestockCommandHandler} from "../../src/handlers/restock_command_handler";
import {RestockSagaEventHandler} from "../../src/handlers/restock_saga_event_handler";
import {describe, beforeEach, expect, test} from "bun:test";

describe("Restock Command handler", () => {
    let _history: DomainEvent[] = []
    let _publish: DomainEvent[] = []

    beforeEach(() => {
        _history = []
        _publish = []
    })

    function publish(...params: DomainEvent[]): void {
        _publish.push(...params)
    }

    function Given(events: DomainEvent[]) {
        _history = events
    }

    function When(command: DomainCommand) {

        const command_Handlers = new RestockCommandHandler(_history, publish)
        command_Handlers.handle(command)
    }

    function Then(expected_events: DomainEvent[]) {
        expect(_publish).toMatchObject(expected_events)
    }

    test("Emits RestockOrdered when asked to restock", () => {
        Given([])
        When(new RestockOrder(100))
        Then([new RestockOrdered(100)])
    });
    test("Emits no RestockOrdered when enough stock is available", () => {

        Given([new RestockOrdered(100), new RestockOrdered(50)])
        When(new RestockOrder(50))
        Then([new RestockAlreadyOrdered()])
    })
    test("Emits RestockOrdered when just enough stock is available", () => {
        Given([new RestockOrdered(100)])
        When(new RestockOrder(50))
        Then([new RestockOrdered(50)])
    })

    test("Emits RestockOrdered when no history exists", () => {
        Given([])
        When(new RestockOrder(50))
        Then([new RestockOrdered(50)])
    })

    test("Emits RestockAlreadyOrdered at exact threshold", () => {
        Given([new RestockOrdered(101)])
        When(new RestockOrder(1))
        Then([new RestockAlreadyOrdered()])
    })

    test("Handles zero quantity restock", () => {
        Given([])
        When(new RestockOrder(0))
        Then([new RestockOrdered(0)])
    })

    test("Handles large quantity accumulation", () => {
        Given([new RestockOrdered(50), new RestockOrdered(30), new RestockOrdered(25)])
        When(new RestockOrder(10))
        Then([new RestockAlreadyOrdered()])
    })
});

describe("RestockSaga", () => {
    let _history: DomainEvent[] = []
    let _publish: DomainCommand[] = []

    beforeEach(() => {
        _history = []
        _publish = []
    })

    function send(...params: DomainCommand[]): void {
        _publish.push(...params)
    }

    function Given(events: DomainEvent[]) {
        _history = events
    }

    function When(event: DomainEvent) {

        const eventHandler = new RestockSagaEventHandler(_history, send)
        eventHandler.handle(event)
    }

    function Then(expected_commands: DomainCommand[]) {
        expect(_publish).toHaveLength(expected_commands.length)

        _publish.forEach((actual, index) => {
            const expected = expected_commands[index];
            expect(actual).toMatchObject({
                eventType: expected.eventType,
                messageType: expected.messageType,
                ...(actual instanceof RestockOrder && expected instanceof RestockOrder && {
                    quantity: expected.quantity
                })
            })
        })
    }

    test("Emits OrderRestock when threshold is reached", () => {
        Given([new CapacityDefined("dummy", 100)])
        When(new ThresholdReached(20))
        Then([new RestockOrder(80)])

    })
    test("Emits OrderRestock when other threshold is reached", () => {
        Given([new CapacityDefined("dummy", 380)])
        When(new ThresholdReached(35))
        Then([new RestockOrder(345)])
    })

    test("Emits zero RestockOrder when threshold equals capacity", () => {
        Given([new CapacityDefined("dummy", 100)])
        When(new ThresholdReached(100))
        Then([new RestockOrder(0)])
    })

    test("Handles threshold without capacity defined", () => {
        Given([])
        When(new ThresholdReached(50))
        Then([new RestockOrder(-50)])
    })

    test("Handles very low threshold", () => {
        Given([new CapacityDefined("dummy", 1000)])
        When(new ThresholdReached(1))
        Then([new RestockOrder(999)])
    })
})


describe("ThresholdReached to RestockOrdered", () => {
    let _history: DomainEvent[] = []
    let _publish: DomainEvent[] = []

    beforeEach(() => {
        _history = []
        _publish = []
    })

    function publish(...params: DomainEvent[]): void {
        _publish.push(...params)
    }

    function Given(events: DomainEvent[]) {
        _history = events
    }

    function Then(expected_events: DomainEvent[]) {
        expect(_publish).toMatchObject(expected_events)
    }

    function When(event: DomainEvent) {

        const commandHandler = new RestockCommandHandler(_history, publish)
        const eventHandler = new RestockSagaEventHandler(_history, commandHandler.handle)
        eventHandler.handle(event)
    }

    test("Emits RestockOrdered when threshold is reached", () => {
        Given([new CapacityDefined("dummy", 380)])
        When(new ThresholdReached(35))
        Then([new RestockOrdered(345)])
    })

    test("Handles edge case with minimal capacity", () => {
        Given([new CapacityDefined("dummy", 5)])
        When(new ThresholdReached(2))
        Then([new RestockOrdered(3)])
    })

    test("Complex flow with multiple capacity events", () => {
        Given([new CapacityDefined("dummy", 100), new CapacityDefined("other", 200)])
        When(new ThresholdReached(50))
        Then([new RestockOrdered(150)])
    })
})