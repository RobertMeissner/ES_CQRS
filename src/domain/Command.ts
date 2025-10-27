import {ICommand} from "./IMessage";


export abstract class Command implements ICommand {
    readonly messageType = "command" as const;
    abstract readonly eventType: string
    readonly id: string
    readonly recorded_at: Date

    protected constructor() {
        this.id = crypto.randomUUID();
        this.recorded_at = new Date();
    }

}

export class RestockOrder extends Command {
    readonly eventType = "restock_order" as const;

    constructor(public quantity: number) {
        super()
    }
}

export class DummyCommand extends Command {
    readonly eventType = "dummy" as const;

    constructor() {
        super()
    }
}


export type DomainCommand = RestockOrder | DummyCommand