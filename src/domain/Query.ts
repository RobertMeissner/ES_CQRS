import {IQuery} from "./IMessage";

export abstract class Query implements IQuery {
    readonly messageType = "query" as const;
    abstract readonly queryType: string;
    readonly id: string;
    readonly recorded_at: Date;

    protected constructor() {
        this.id = crypto.randomUUID()
        this.recorded_at = new Date();
    }
}

export class QueryCatalog extends Query {
    readonly queryType: string = "catalog" as const;

    constructor() {
        super()
    }
}

export class DummyQuery extends Query {
    readonly queryType: string = "dummy" as const;

    constructor() {
        super()
    }
}

export type DomainQuery = QueryCatalog | DummyQuery

