import {CommandHandler} from "../domain/command_handler";
import {EVENTS} from "../domain/Event";
import {COMMANDS, RestockOrder} from "../domain/Command";
import {Restocker, RestockerState} from "../aggregates/Restocker";

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