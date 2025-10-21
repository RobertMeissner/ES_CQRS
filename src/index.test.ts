import {CapacityDefined, EVENTS, RestockAlreadyOrdered, RestockOrdered, ThresholdReached} from "./domain/Event";
import {COMMANDS, RestockOrder} from "./domain/Command";
import {RestockCommandHandler} from "./handlers/restock_command_handler";
import {RestockSagaEventHandler} from "./handlers/restock_saga_event_handler";

describe("restocker", () => {
    let _history: EVENTS[] = []
    let _publish: EVENTS[] = []

    beforeEach(() => {
        _history = []
        _publish = []
    })

    function Given(events: EVENTS[]) {
        _history = events
    }

    function When(command: COMMANDS) {

        const command_Handlers = new RestockCommandHandler(_history)
        command_Handlers.handle(command)
        _publish = command_Handlers._publish
    }

    function Then(expected_events: EVENTS[]) {
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
});
describe("RestockSaga", ()=> {
    let _history: EVENTS[] = []
    let _publish: COMMANDS[] = []

    beforeEach(() => {
        _history = []
        _publish = []
    })

    function Given(events: EVENTS[]) {
        _history = events
    }

    function When(event: EVENTS) {

        const eventHandler = new RestockSagaEventHandler(_history)
        eventHandler.handle(event)
        _publish = eventHandler._publish
    }

    function Then(expected_commands: COMMANDS[]) {
        expect(_publish).toMatchObject(expected_commands)
    }
    test("Emits OrderRestock when threshold is reached", () => {
        Given([new CapacityDefined(100)])
        When(new ThresholdReached(20))
        Then([new RestockOrder(80)])

    })
    test("Emits OrderRestock when other threshold is reached", () => {
        Given([new CapacityDefined(380)])
        When(new ThresholdReached(35))
        Then([new RestockOrder(345)])

    })
})