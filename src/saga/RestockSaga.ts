import {DomainCommand, RestockOrder} from "../domain/Command";
import {CapacityDefined, DomainEvent, ThresholdReached} from "../domain/Event";
import {Saga} from "../domain/saga";

export class RestockSagaState {
    quantity: number = 0;
    capacity: number = 0;

    constructor(events: DomainEvent[]) {
        for (const event of events) {
            if (event instanceof CapacityDefined) {
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

    handle(event: DomainEvent): DomainCommand[] {
        if (event instanceof ThresholdReached) {
            // this.state.expeddreorder =
            // emit
            return [new RestockOrder(this.state.capacity - event.quantity)];
        }
        return []
    }
}