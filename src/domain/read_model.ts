import {EVENTS} from "./Event";
import {QUERIES} from "./Query";

export abstract class ReadModel<T = any> {
    abstract _state: T;

    abstract handle(query: QUERIES): any;

    abstract project(event: EVENTS): void;
}