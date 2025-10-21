import {COMMANDS} from "./Command";

export abstract class CommandHandler {

    abstract handle(command: COMMANDS): void;
}