import {RestockCommandHandler} from "./index";
import {EVENTS, RestockOrdered} from "./domain/Event";
import {COMMANDS, RestockOrder} from "./domain/Command";

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
        Then([])
    })
    test("Emits RestockOrdered when just enough stock is available", () => {

        Given([new RestockOrdered(100)])
        When(new RestockOrder(50))
        Then([new RestockOrdered(50)])
    })
});
