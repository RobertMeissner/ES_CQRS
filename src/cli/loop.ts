import * as readline from 'readline';
import {EventStore} from "../infrastructure/event_store";
import {Products} from "../read_models/products";
import {AddProduct, RestockOrdered} from "../domain/Event";
import {QueryCatalog} from "../domain/Query";

const eventStore = new EventStore();
const products = new Products();

eventStore.load();
const loadedEvents = eventStore.getAll();
loadedEvents.forEach(event => products.project(event));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("Event Sourcing CLI - 'loop'");
console.log(`Loaded ${loadedEvents.length} events from storage`);
console.log("Commands:");
console.log("  add <product_id>           - Add a product");
console.log("  restock <product_id> <qty> - Restock a product");
console.log("  catalog                     - Query product catalog");
console.log("  clear                       - Clear all events");
console.log("  exit                        - Exit the CLI");
console.log();

function processCommand(input: string): boolean {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
        case 'add':
            if (parts.length < 2) {
                console.log("Usage: add <product_id>");
                return true;
            }
            const addEvent = new AddProduct(parts[1]);
            eventStore.append(addEvent);
            products.project(addEvent);
            eventStore.save();
            console.log(`Product '${parts[1]}' added`);
            break;

        case 'restock':
            if (parts.length < 3) {
                console.log("Usage: restock <product_id> <quantity>");
                return true;
            }
            const qty = parseInt(parts[2]);
            if (isNaN(qty)) {
                console.log("Quantity must be a number");
                return true;
            }
            const restockEvent = new RestockOrdered(parts[1], qty);
            eventStore.append(restockEvent);
            products.project(restockEvent);
            eventStore.save();
            console.log(`Restocked '${parts[1]}' with ${qty} units`);
            break;

        case 'catalog':
            const catalog = products.handle(new QueryCatalog());
            console.log("Product Catalog:");
            console.log(JSON.stringify(catalog, null, 2));
            break;

        case 'clear':
            eventStore.clear();
            eventStore.save();
            console.log("All events cleared!");
            break;

        case 'exit':
            console.log("Goodbye!");
            rl.close();
            return false;

        default:
            console.log(`Unknown command: ${command}`);
            break;
    }
    return true;
}

function prompt() {
    rl.question('> ', (input) => {
        const shouldContinue = processCommand(input);
        if (shouldContinue) {
            prompt();
        }
    });
}

prompt();
