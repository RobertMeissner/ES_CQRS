import {CapacityDefined, EVENTS, RestockAlreadyOrdered, RestockOrdered, ThresholdReached} from "./domain/Event";
import {COMMANDS, RestockOrder} from "./domain/Command";
import {RestockCommandHandler} from "./handlers/restock_command_handler";
import {RestockSagaEventHandler} from "./handlers/restock_saga_event_handler";
import {QUERIES} from "./domain/Query";

describe("ReadModel", () => {
    let _history: EVENTS[] = []
    let _publish: COMMANDS[] = []

    beforeEach(() => {
        _history = []
        _publish = []
    })

    function Given(events: EVENTS[]) {
        _event_store = new EventStore(events)
        // persist events
        // emit event to a queue, this queue triggers the ReadModel
    }

    function When_Query(query: QUERIES) {

        // querying the read model
    }

    function Then(expected_commands: COMMANDS[]) {
        expect(_publish).toMatchObject(expected_commands)
    }

    test.skip("Yield available products", () => {
        Given([new AddProduct("broccoli"), new AddProduct("lasagne"), new CapacityDefined("broccoli", 100), new CapacityDefined("lasagne", 100), new RestockOrder("lasagne", 50)])
        When_Query(new QueryForCatalog())
        Then({"lasagne": 50, "broccoli": 0})

    })
})