import {DomainEvent} from "./Event";
import {DomainCommand} from "./Command";
import {CommandPublish} from "../types/types";

export abstract class EventHandler {

    abstract handle(event: DomainEvent): void;

    abstract send: CommandPublish;
}