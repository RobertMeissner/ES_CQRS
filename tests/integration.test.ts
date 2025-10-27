import {EventStore} from "../src/infrastructure/event_store";
import {Products} from "../src/read_models/products";
import {AddProduct, RestockOrdered, CapacityDefined, ThresholdReached} from "../src/domain/Event";
import {QueryCatalog} from "../src/domain/Query";
import {RestockCommandHandler} from "../src/handlers/restock_command_handler";
import {RestockSagaEventHandler} from "../src/handlers/restock_saga_event_handler";
import {RestockOrder} from "../src/domain/Command";
import * as fs from "fs";
import {describe, afterEach, test, expect} from "bun:test"

describe.todo("Integration Tests", () => {
    const testFilePath = "./integration_test_events.json";

    afterEach(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    test("Full flow: events -> read model -> query", () => {
        const eventStore = new EventStore([], testFilePath);
        const products = new Products();

        eventStore.append(new AddProduct("apple"));
        eventStore.append(new AddProduct("banana"));
        eventStore.append(new RestockOrdered("apple", 50));
        eventStore.append(new RestockOrdered("banana", 30));

        eventStore.getAll().forEach(e => products.project(e));
        const catalog = products.handle(new QueryCatalog());

        expect(catalog).toEqual({"apple": 50, "banana": 30});
    });

    test("Event replay rebuilds state correctly", () => {
        const store1 = new EventStore([], testFilePath);
        store1.append(new AddProduct("product1"));
        store1.append(new RestockOrdered("product1", 10));
        store1.append(new RestockOrdered("product1", 20));
        store1.save();

        const store2 = new EventStore([], testFilePath);
        store2.load();
        const products = new Products();
        store2.getAll().forEach(e => products.project(e));

        const catalog = products.handle(new QueryCatalog());
        expect(catalog).toEqual({"product1": 30});
    });

    test("Multiple read models can project same events", () => {
        const events = [
            new AddProduct("item1"),
            new RestockOrdered("item1", 100)
        ];

        const readModel1 = new Products();
        const readModel2 = new Products();

        events.forEach(e => {
            readModel1.project(e);
            readModel2.project(e);
        });

        expect(readModel1.handle(new QueryCatalog())).toEqual(readModel2.handle(new QueryCatalog()));
    });

    test("Command handler + read model integration", () => {
        const history = [new RestockOrdered(50)];
        const handler = new RestockCommandHandler(history);
        const products = new Products();

        handler.handle(new RestockOrder(30));

        [...history, ...handler._publish].forEach(e => products.project(e));
        const catalog = products.handle(new QueryCatalog());

        expect(catalog.default).toBe(80);
    });

    test("Saga + command handler full flow", () => {
        const history = [new CapacityDefined("prod", 100)];
        const sagaHandler = new RestockSagaEventHandler(history);
        const commandHandler = new RestockCommandHandler(history);

        sagaHandler.handle(new ThresholdReached(30));
        const command = sagaHandler._emit[0];
        commandHandler.handle(command);

        expect(commandHandler._publish).toHaveLength(1);
        expect(commandHandler._publish[0]).toBeInstanceOf(RestockOrdered);
    });

    test("Event sourcing idempotency: same events = same state", () => {
        const events = [
            new AddProduct("test"),
            new RestockOrdered("test", 10),
            new RestockOrdered("test", 20)
        ];

        const readModel1 = new Products();
        events.forEach(e => readModel1.project(e));

        const readModel2 = new Products();
        events.forEach(e => readModel2.project(e));

        expect(readModel1.handle(new QueryCatalog())).toEqual(readModel2.handle(new QueryCatalog()));
    });

    test("Empty event stream scenarios", () => {
        const eventStore = new EventStore([], testFilePath);
        const products = new Products();

        eventStore.getAll().forEach(e => products.project(e));
        const catalog = products.handle(new QueryCatalog());

        expect(catalog).toEqual({});
        expect(eventStore.getAll()).toHaveLength(0);
    });

    test("Large event stream performance", () => {
        const eventStore = new EventStore([], testFilePath);
        const products = new Products();

        for (let i = 0; i < 100; i++) {
            eventStore.append(new AddProduct(`product${i}`));
            eventStore.append(new RestockOrdered(`product${i}`, i));
        }

        eventStore.getAll().forEach(e => products.project(e));
        const catalog = products.handle(new QueryCatalog());

        expect(Object.keys(catalog)).toHaveLength(100);
        expect(catalog.product50).toBe(50);
    });

    test("Event order matters for projection", () => {
        const products1 = new Products();
        products1.project(new AddProduct("x"));
        products1.project(new RestockOrdered("x", 10));
        products1.project(new RestockOrdered("x", 20));

        const products2 = new Products();
        products2.project(new RestockOrdered("x", 20));
        products2.project(new RestockOrdered("x", 10));
        products2.project(new AddProduct("x"));

        expect(products1.handle(new QueryCatalog()).x).toBe(30);
        expect(products2.handle(new QueryCatalog()).x).toBe(0);
    });

    test("Persistence survives multiple save/load cycles", () => {
        const store1 = new EventStore([], testFilePath);
        store1.append(new AddProduct("a"));
        store1.save();

        const store2 = new EventStore([], testFilePath);
        store2.load();
        store2.append(new AddProduct("b"));
        store2.save();

        const store3 = new EventStore([], testFilePath);
        store3.load();

        expect(store3.getAll()).toHaveLength(2);
    });
});
