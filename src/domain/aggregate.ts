import {DomainCommand} from "./Command";
import {DomainEvent} from "./Event";

export abstract class Aggregate {
    abstract handle(command: DomainCommand): DomainEvent[];
}