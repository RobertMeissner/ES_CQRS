import {COMMANDS, RestockOrder} from "../domain/Command";
import {EVENTS, RestockAlreadyOrdered, RestockOrdered} from "../domain/Event";
import {Aggregate} from "../domain/aggregate";

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
            } else return [new RestockAlreadyOrdered()]

        }
        return []
    }
}