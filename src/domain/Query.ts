export abstract class Query {
}

export class QueryCatalog implements Query {
    constructor() {}
}

export type QUERIES = QueryCatalog | undefined

