import {DomainEvent} from "../domain/Event";
import {DomainCommand} from "../domain/Command";

export type EventPublish =  (...param: DomainEvent[]) => void
export type CommandPublish =  (...param: DomainCommand[]) => void