import {COMMANDS} from "../domain/Command";

export abstract class CommandHandler {

    abstract handle(command: COMMANDS): void;
}