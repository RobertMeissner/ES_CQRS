import * as fs from 'fs';
import * as path from 'path';
import {DomainEvent, AddProduct, RestockOrdered, CapacityDefined, ThresholdReached, RestockAlreadyOrdered} from "../domain/Event";

export class EventStore {
    private events: DomainEvent[] = [];
    private filePath: string;

    constructor(initialEvents: DomainEvent[] = [], filePath: string = './events.json') {
        this.filePath = filePath;
        this.events = [...initialEvents];
    }

    append(event: DomainEvent): void {
        this.events.push(event);
    }

    getAll(): DomainEvent[] {
        return [...this.events];
    }

    clear(): void {
        this.events = [];
    }

    save(): void {
        const data = this.events.map(event => ({
            type: event.messageType,
            id: event.id,
            recorded_at: event.recorded_at,
            ...event
        }));
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    load(): void {
        if (!fs.existsSync(this.filePath)) {
            return;
        }

        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
        this.events = data.map((item: any) => this.deserializeEvent(item));
    }

    private deserializeEvent(data: any): DomainEvent {
        switch (data.type) {
            case 'add_product':
                return Object.assign(new AddProduct(data.product_id), data);
            case 'restock_ordered':
                return Object.assign(new RestockOrdered(data.product_id, data.quantity), data);
            case 'capacity_defined':
                return Object.assign(new CapacityDefined(data.product_id, data.capacity), data);
            case 'threshold_reached':
                return Object.assign(new ThresholdReached(data.quantity), data);
            case 'restock_already_ordered':
                return Object.assign(new RestockAlreadyOrdered(), data);
            default:
                throw new Error(`Unknown event type: ${data.type}`);
        }
    }
}
