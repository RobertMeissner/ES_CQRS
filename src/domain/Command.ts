export type COMMANDS = RestockOrder | undefined

export abstract class Command {
}

export class RestockOrder implements Command {
    public quantity: number

    constructor(quantity: number) {
        this.quantity = quantity
    }
}

