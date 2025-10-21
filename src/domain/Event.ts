export abstract class Event {
    type: string = ""
    abstract id: string

    protected constructor(readonly recorded_at: Date) {
    }
}

export class RestockOrdered extends Event {
    static type: string = "restock_ordered";
    id = "restock_ordered"

    constructor(public quantity: number) {
        super(new Date());
        this.type = RestockOrdered.type;
    }

}

export class RestockAlreadyOrdered extends Event {
    static type: string = "restock_already_ordered";
    id = "restock_already_ordered"

    constructor() {
        super(new Date());
        this.type = RestockOrdered.type;
    }

}
export class CapacityDefined extends Event {
    static type: string = "capacity_defined";
    id = "capacity_defined"

    constructor(public capacity: number) {
        super(new Date());
        this.type = CapacityDefined.type;
    }

}

export class ThresholdReached extends Event {
    static type: string = "threshold_reached";
    id = "threshold_reached"

    constructor(public quantity: number) {
        super(new Date());
        this.type = ThresholdReached.type;
    }

}

export type EVENTS = RestockOrdered | RestockAlreadyOrdered
