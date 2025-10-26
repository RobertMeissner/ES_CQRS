export abstract class Event {
    type: string = ""
    abstract id: string

    protected constructor(readonly recorded_at: Date) {
    }
}

export class RestockOrdered extends Event {
    static type: string = "restock_ordered";
    id = "restock_ordered"
    public product_id: string;
    public quantity: number;

    constructor(product_id_or_quantity: string | number, quantity?: number) {
        super(new Date());
        this.type = RestockOrdered.type;

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

    constructor(public product_id: string, public capacity: number) {
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

export class AddProduct extends Event {
    static type: string = "add_product";
    id = "add_product"

    constructor(public product_id: string) {
        super(new Date());
        this.type = AddProduct.type;
    }

}

export type EVENTS = RestockOrdered | RestockAlreadyOrdered | CapacityDefined | ThresholdReached | AddProduct
