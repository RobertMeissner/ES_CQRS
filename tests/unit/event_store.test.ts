import {EventStore} from "../../src/infrastructure/event_store";
import {AddProduct, RestockOrdered, CapacityDefined} from "../../src/domain/Event";
import * as fs from "fs";
import {describe, beforeEach, afterEach, expect, test} from "bun:test";

describe.todo("EventStore", () => {
    const testFilePath = "./test_events.json";

    afterEach(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    describe("Happy path", () => {
        test("Appends and retrieves events", () => {
            const store = new EventStore([], testFilePath);
            const event = new AddProduct("test");

            store.append(event);

            expect(store.getAll()).toHaveLength(1);
            expect(store.getAll()[0]).toMatchObject(event);
        });

        test("Initializes with events", () => {
            const events = [new AddProduct("initial")];
            const store = new EventStore(events, testFilePath);

            expect(store.getAll()).toHaveLength(1);
        });

        test("Saves and loads events", () => {
            const store1 = new EventStore([], testFilePath);
            store1.append(new AddProduct("product1"));
            store1.append(new RestockOrdered("product1", 50));
            store1.save();

            const store2 = new EventStore([], testFilePath);
            store2.load();

            expect(store2.getAll()).toHaveLength(2);
            expect(store2.getAll()[0]).toMatchObject({product_id: "product1"});
        });

        test("Multiple appends accumulate", () => {
            const store = new EventStore([], testFilePath);
            store.append(new AddProduct("a"));
            store.append(new AddProduct("b"));
            store.append(new AddProduct("c"));

            expect(store.getAll()).toHaveLength(3);
        });

        test("Returns copy of events not reference", () => {
            const store = new EventStore([], testFilePath);
            const events1 = store.getAll();
            const events2 = store.getAll();

            expect(events1).not.toBe(events2);
        });
    });

    describe("Edge cases", () => {
        test("Load from non-existent file does nothing", () => {
            const store = new EventStore([], testFilePath);
            store.load();

            expect(store.getAll()).toHaveLength(0);
        });

        test("Clear removes all events", () => {
            const store = new EventStore([], testFilePath);
            store.append(new AddProduct("test"));

            store.clear();

            expect(store.getAll()).toHaveLength(0);
        });

        test("Save after clear creates empty file", () => {
            const store = new EventStore([], testFilePath);
            store.append(new AddProduct("test"));
            store.clear();
            store.save();

            const store2 = new EventStore([], testFilePath);
            store2.load();
            expect(store2.getAll()).toHaveLength(0);
        });

        test("Handles empty event list", () => {
            const store = new EventStore([], testFilePath);
            expect(store.getAll()).toHaveLength(0);
        });

        test("Preserves event order", () => {
            const store = new EventStore([], testFilePath);
            const event1 = new AddProduct("first");
            const event2 = new AddProduct("second");
            const event3 = new AddProduct("third");

            store.append(event1);
            store.append(event2);
            store.append(event3);
            store.save();

            const store2 = new EventStore([], testFilePath);
            store2.load();
            const loaded = store2.getAll();

            expect(loaded[0].product_id).toBe("first");
            expect(loaded[1].product_id).toBe("second");
            expect(loaded[2].product_id).toBe("third");
        });
    });

    describe("Unhappy path", () => {
        test("Deserializes all event types correctly", () => {
            const store = new EventStore([], testFilePath);
            store.append(new AddProduct("prod1"));
            store.append(new RestockOrdered("prod1", 100));
            store.append(new CapacityDefined("prod1", 500));
            store.save();

            const store2 = new EventStore([], testFilePath);
            store2.load();
            const events = store2.getAll();

            expect(events[0]).toBeInstanceOf(AddProduct);
            expect(events[1]).toBeInstanceOf(RestockOrdered);
            expect(events[2]).toBeInstanceOf(CapacityDefined);
        });

        test("Load invalid JSON throws error", () => {
            fs.writeFileSync(testFilePath, "invalid json{", "utf-8");
            const store = new EventStore([], testFilePath);

            expect(() => store.load()).toThrow();
        });

        test("Load unknown event type throws error", () => {
            fs.writeFileSync(testFilePath, JSON.stringify([{
                type: "unknown_event",
                id: "unknown",
                recorded_at: new Date()
            }]), "utf-8");
            const store = new EventStore([], testFilePath);

            expect(() => store.load()).toThrow("Unknown event type: unknown_event");
        });
    });

    describe("Persistence", () => {
        test("File created after save", () => {
            const store = new EventStore([], testFilePath);
            store.append(new AddProduct("test"));

            store.save();

            expect(fs.existsSync(testFilePath)).toBe(true);
        });

        test("Overwrite on subsequent saves", () => {
            const store = new EventStore([], testFilePath);
            store.append(new AddProduct("v1"));
            store.save();

            store.append(new AddProduct("v2"));
            store.save();

            const store2 = new EventStore([], testFilePath);
            store2.load();
            expect(store2.getAll()).toHaveLength(2);
        });

        test("Load preserves timestamps", () => {
            const store1 = new EventStore([], testFilePath);
            const event = new AddProduct("test");
            const originalTime = event.recorded_at.toISOString();
            store1.append(event);
            store1.save();

            const store2 = new EventStore([], testFilePath);
            store2.load();
            const loadedEvent = store2.getAll()[0];

            expect(loadedEvent.recorded_at.toString()).toEqual(originalTime);
        });
    });
});
