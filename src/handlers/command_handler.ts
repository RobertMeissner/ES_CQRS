import {COMMANDS} from "../domain/Command";
import {EVENTS} from "../domain/Event"

export abstract class CommandHandler {

    abstract handle(command: COMMANDS): void;
}