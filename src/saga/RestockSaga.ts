import {COMMANDS, RestockOrder} from "../domain/Command";
import {CapacityDefined, EVENTS, RestockAlreadyOrdered, RestockOrdered, ThresholdReached} from "../domain/Event";
import {Saga} from "../domain/saga";

export class RestockSagaState {
    quantity: number = 0;
    capacity: number = 0;

    constructor(events: EVENTS[]) {
        for (const event of events) {
            if (event.type === CapacityDefined.type) {
                this.capacity = event.capacity;
            }
        }

    }
}

export class RestockSaga implements Saga {
    private state: RestockSagaState;

    constructor(state: RestockSagaState) {
        this.state = state;
    }

    handle(event: EVENTS): COMMANDS[] {
        if (event instanceof ThresholdReached) {
            // this.state.expeddreorder =
            // emit
            return [new RestockOrder(this.state.capacity - event.quantity)];
        }
        return []
    }
}