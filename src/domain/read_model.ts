import {DomainEvent} from "./Event";
import {DomainQuery} from "./Query";

export abstract class ReadModel<T = any> {
    abstract _state: T;

    abstract handle(query: DomainQuery): any;

    abstract project(event: DomainEvent): void;
}