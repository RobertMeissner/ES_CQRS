import {EVENTS, RestockOrdered} from "./domain/Event"
import {COMMANDS, RestockOrder} from "./domain/Command";
import {CommandHandler} from "./handlers/command_handler";


export class RestockCommandHandler implements CommandHandler {
    private _history: EVENTS[];
    public _publish: EVENTS[];

    constructor(events: EVENTS[]) {
        this._history = events
        this._publish = []
    }

    handle(command: COMMANDS) {
        if (command instanceof RestockOrder) {
            const state = new RestockerState(this._history)
            const restocker = new Restocker(state);
            const events = restocker.handle(command)
            this._publish.push(...events)
        }
        this._publish.concat([])
    }
}

abstract class Aggregate {
    abstract handle(command: COMMANDS): EVENTS[];
}


export class RestockerState {
    quantity: number = 0;

    constructor(events: EVENTS[]) {
        for (const event of events) {
            if (event.type === RestockOrdered.type) {
                this.quantity += event.quantity;
            }
        }

    }
}

export class Restocker implements Aggregate {
    private state: RestockerState;

    constructor(state: RestockerState) {
        this.state = state;
    }

    handle(command: COMMANDS): EVENTS[] {
        if (command instanceof RestockOrder) {
            if (this.state.quantity <= 100) {
                return [new RestockOrdered(command.quantity)];
            }

        }
        return []
    }
}
