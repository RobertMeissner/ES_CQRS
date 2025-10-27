import {DomainCommand} from "./Command";
import {DomainEvent} from "./Event";
import {EventPublish} from "../types/types";

export abstract class CommandHandler {

    abstract handle(command: DomainCommand, publish: (...param: DomainEvent[]) => void): void;

    abstract publish: EventPublish
}