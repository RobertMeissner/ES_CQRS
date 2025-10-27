import {DomainEvent, ThresholdReached} from "../domain/Event";
import {EventHandler} from "../domain/event_handler";
import {DomainCommand} from "../domain/Command";
import {RestockSaga, RestockSagaState} from "../saga/RestockSaga";
import {CommandPublish} from "../types/types";

export class RestockSagaEventHandler implements EventHandler {
    private _history: DomainEvent[];

    constructor(events: DomainEvent[], private _sendCallback: CommandPublish) {
        this._history = events
    }

    send(...commands: DomainCommand[]): void {
        this._sendCallback(...commands);  // Delegate to private callback
    }

    handle(event: DomainEvent) {
        if (event instanceof ThresholdReached) {
            const state = new RestockSagaState(this._history)
            const restockSaga = new RestockSaga(state);
            const commands = restockSaga.handle(event)
            this.send(...commands)
        }
    }
}