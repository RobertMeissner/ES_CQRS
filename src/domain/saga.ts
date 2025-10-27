import {DomainCommand} from "./Command";
import {DomainEvent} from "./Event";

export abstract class Saga {
    abstract handle(event: DomainEvent): DomainCommand[];
}