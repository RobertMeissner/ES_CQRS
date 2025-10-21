import {COMMANDS} from "./Command";
import {EVENTS} from "./Event";

export abstract class Saga {
    abstract handle(event: EVENTS): COMMANDS[];
}