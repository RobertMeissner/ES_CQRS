import {EVENTS, ThresholdReached} from "../domain/Event";
import {EventHandler} from "../domain/event_handler";
import {COMMANDS} from "../domain/Command";
import {RestockSaga, RestockSagaState} from "../saga/RestockSaga";

export class RestockSagaEventHandler implements EventHandler {
    private _history: EVENTS[];
    public _emit: COMMANDS[];

    constructor(events: EVENTS[]) {
        this._history = events
        this._emit = []
    }

    handle(event: EVENTS) {
        if (event instanceof ThresholdReached) {
            const state = new RestockSagaState(this._history)
            const restockSaga = new RestockSaga(state);
            const commands = restockSaga.handle(event)
            this._emit.push(...commands)
        }
        this._emit.concat([])
    }
}