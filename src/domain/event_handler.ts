import {EVENTS} from "./Event";

export abstract class EventHandler {

    abstract handle(event: EVENTS): void;
}