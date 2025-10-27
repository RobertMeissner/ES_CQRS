import {IEvent} from "./IMessage";

export abstract class Event implements IEvent {
    readonly messageType = "event" as const;
    abstract readonly eventType: string
    readonly id: string

    protected constructor(readonly recorded_at: Date) {
        this.id = crypto.randomUUID()
    }
}

export class RestockOrdered extends Event {
    readonly eventType: string = "restock_ordered" as const;
    id = "restock_ordered"
    public product_id: string;
    public quantity: number;

    constructor(product_id_or_quantity: string | number, quantity?: number) {
        super(new Date());

        if (typeof product_id_or_quantity === 'number') {
            this.product_id = 'default';
            this.quantity = product_id_or_quantity;
        } else {
            this.product_id = product_id_or_quantity;
            this.quantity = quantity || 0;
        }
    }

}

export class RestockAlreadyOrdered extends Event {
    readonly eventType: string = "restock_already_ordered" as const;
    id = "restock_already_ordered"

    constructor() {
        super(new Date());
    }

}

export class CapacityDefined extends Event {
    readonly eventType: string = "capacity_defined" as const;
    id = "capacity_defined"

    constructor(public product_id: string, public capacity: number) {
        super(new Date());
    }

}

export class ThresholdReached extends Event {
    readonly eventType: string = "threshold_reached" as const;
    id = "threshold_reached"

    constructor(public quantity: number) {
        super(new Date());
    }

}

export class AddProduct extends Event {
    readonly eventType: string = "add_product" as const;
    id = "add_product"

    constructor(public product_id: string) {
        super(new Date());
    }

}

export type DomainEvent = RestockOrdered | RestockAlreadyOrdered | CapacityDefined | ThresholdReached | AddProduct
