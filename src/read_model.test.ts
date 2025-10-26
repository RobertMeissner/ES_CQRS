import {AddProduct, CapacityDefined, EVENTS, RestockOrdered} from "./domain/Event";
import {QUERIES, QueryCatalog} from "./domain/Query";
import {Products, CatalogState} from "./read_models/products";
import {describe, beforeEach, test, expect} from "bun:test";

describe.todo("ReadModel", () => {
    let readModel: Products;
    let result: CatalogState;

    beforeEach(() => {
        readModel = new Products();
        result = {};
    })

    function Given(events: EVENTS[]) {
        readModel = new Products();
        events.forEach(event => readModel.project(event));
    }

    function When_Query(query: QUERIES) {
        result = readModel.handle(query);
    }

    function Then(expected_catalog: CatalogState) {
        expect(result).toMatchObject(expected_catalog);
    }

    test("Yield available products", () => {
        Given([
            new AddProduct("broccoli"),
            new AddProduct("lasagne"),
            new CapacityDefined("broccoli", 100),
            new CapacityDefined("lasagne", 100),
            new RestockOrdered("lasagne", 50)
        ]);
        When_Query(new QueryCatalog());
        Then({"lasagne": 50, "broccoli": 0});
    });

    test("Empty catalog when no products added", () => {
        Given([]);
        When_Query(new QueryCatalog());
        Then({});
    });

    test("Multiple restocks accumulate", () => {
        Given([
            new AddProduct("pizza"),
            new RestockOrdered("pizza", 10),
            new RestockOrdered("pizza", 20),
            new RestockOrdered("pizza", 15)
        ]);
        When_Query(new QueryCatalog());
        Then({"pizza": 45});
    });

    test("Product starts at zero without restock", () => {
        Given([new AddProduct("salad")]);
        When_Query(new QueryCatalog());
        Then({"salad": 0});
    });

    test("Restock without product creates entry", () => {
        Given([new RestockOrdered("unknown", 100)]);
        When_Query(new QueryCatalog());
        Then({"unknown": 100});
    });

    test("Returns immutable copy of state", () => {
        Given([new AddProduct("test"), new RestockOrdered("test", 10)]);
        When_Query(new QueryCatalog());
        const firstResult = result;
        When_Query(new QueryCatalog());
        expect(firstResult).not.toBe(result);
        expect(firstResult).toEqual(result);
    });
})