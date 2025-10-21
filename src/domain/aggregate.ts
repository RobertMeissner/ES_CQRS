import {COMMANDS} from "./Command";
import {EVENTS} from "./Event";

export abstract class Aggregate {
    abstract handle(command: COMMANDS): EVENTS[];
}