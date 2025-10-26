import {EventStore} from "./infrastructure/event_store";
import {Products} from "./read_models/products";
import {AddProduct, RestockOrdered} from "./domain/Event";
import {QueryCatalog} from "./domain/Query";

console.log("Event Sourcing Example\n");

const eventStore = new EventStore();
const products = new Products();

const events = [
    new AddProduct("broccoli"),
    new AddProduct("lasagne"),
    new RestockOrdered("lasagne", 50),
    new RestockOrdered("broccoli", 20)
];

events.forEach(event => {
    eventStore.append(event);
    products.project(event);
    console.log(`Event applied: ${event.type}`);
});

const catalog = products.handle(new QueryCatalog());
console.log("\nProduct Catalog:");
console.log(catalog);
