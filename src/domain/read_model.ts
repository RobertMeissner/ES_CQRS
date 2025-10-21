import {EVENTS} from "./Event";

abstract class ReadModel {
    abstract read(): any;
}

import {COMMANDS} from "./Command";

export abstract class ReadModel {
    abstract _history: EVENTS[];
    abstract _history: EVENTS[];
    abstract lambda: respond; // called by handle to emit the result of the query

    abstract handle(command: COMMANDS): void;

    abstract project(event: EVENTS): void // like Apply in the Aggregates or Saga's

    // calls respond
}