export abstract class Event {
    type: string = ""

    protected constructor(readonly recorded_at: Date) {
    }
}

export class RestockOrdered extends Event {
    static type: string = "restock_ordered";

    constructor(public quantity: number) {
        super(new Date());
        this.type = RestockOrdered.type;
    }

}

export type EVENTS = RestockOrdered
