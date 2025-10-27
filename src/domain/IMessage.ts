export interface IMessage {
    readonly messageType: "command" | "event" | "query";
    readonly id: string;
    readonly recorded_at: Date;
    readonly metadata?: Record<string, unknown>
}

export interface ICommand extends IMessage {
    readonly messageType: "command"
}

export interface IEvent extends IMessage {
    readonly messageType: "event"
}

export interface IQuery extends IMessage {
    readonly messageType: "query"
}


export type MessageHandler<TIn extends IMessage, TOut extends IMessage = never> = [TOut] extends [never] ? (message: TIn) => void : (message: TIn) => TOut | TOut[]