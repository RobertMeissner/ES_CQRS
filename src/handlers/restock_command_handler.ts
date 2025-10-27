import {CommandHandler} from "../domain/command_handler";
import {DomainEvent} from "../domain/Event";
import {DomainCommand, RestockOrder} from "../domain/Command";
import {Restocker, RestockerState} from "../aggregates/Restocker";
import {EventPublish} from "../types/types";

export class RestockCommandHandler implements CommandHandler {

    constructor(private history: DomainEvent[], private _publishCallback: EventPublish) {
    }

    publish(...events: DomainEvent[]): void {
        this._publishCallback(...events);  // Delegate to private callback
    }

    handle = (command: DomainCommand)=> {
        if (command instanceof RestockOrder) {
            const state = new RestockerState(this.history)
            const restocker = new Restocker(state);
            const events = restocker.handle(command)
            this.publish(...events)
        }
    }

}