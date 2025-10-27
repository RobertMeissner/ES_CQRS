import {ReadModel} from "../domain/read_model";
import {DomainEvent, AddProduct, RestockOrdered} from "../domain/Event";
import {DomainQuery, QueryCatalog} from "../domain/Query";

export type CatalogState = Record<string, number>;

export class Products extends ReadModel<CatalogState> {
    _state: CatalogState = {};

    project(event: DomainEvent): void {
        if (event instanceof AddProduct) {
            this._state[event.product_id] = 0;
        } else if (event instanceof RestockOrdered) {
            this._state[event.product_id] = (this._state[event.product_id] || 0) + event.quantity;
        }
    }

    handle(query: DomainQuery): CatalogState {
        if (query instanceof QueryCatalog) {
            return {...this._state};
        }
        return {};
    }
}