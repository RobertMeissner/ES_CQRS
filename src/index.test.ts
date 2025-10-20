import { Restocker, RestockOrder } from "./index";

describe("restocker", () => {
  test("Emits RestockOrdered when asked to restock", () => {
    const restocker = new Restocker();

    const eventsEmitted = restocker.handle([], new RestockOrder());

    expect(eventsEmitted).toMatchObject([{ type: "restock_ordered" }]);
  });
});
