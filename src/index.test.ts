import {RestockCommandHandler} from "./index";
import {RestockOrdered} from "./domain/Event";
import {RestockOrder} from "./domain/Command";

describe("restocker", () => {
    let _history: Event[] = []

    beforeEach(() => {
        _history = []
    })

    function Given(events: Event[]) {
        _history = events
    }

    test("Emits RestockOrdered when asked to restock", () => {
        const command_Handlers = new RestockCommandHandler([])
        command_Handlers.handle(new RestockOrder(100))
        expect(command_Handlers._publish).toMatchObject([{type: "restock_ordered"}]);
    });
    test("Emits no RestockOrdered when enough stock is available", () => {
        const history = [new RestockOrdered(100), new RestockOrdered(50)]
        const command_Handlers = new RestockCommandHandler(history)
        command_Handlers.handle(new RestockOrder(50));
        expect(command_Handlers._publish).toEqual([])
    })
    test("Emits RestockOrdered when just enough stock is available", () => {
        const history = [new RestockOrdered(100)]
        const command_Handlers = new RestockCommandHandler(history)
        command_Handlers.handle(new RestockOrder(50));
        expect(command_Handlers._publish).toMatchObject([{type: "restock_ordered", "quantity": 50}])
    })
});
