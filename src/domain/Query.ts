export type QUERIES = QueryCatalog | undefined

export abstract class Query {
}

export class QueryCatalog implements Query {
    public catalogue: Record<string, number> = {};

constructor(quantity: number) {
        this.quantity = quantity
    }
}

