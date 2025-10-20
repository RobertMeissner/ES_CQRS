abstract class EEvent {
  constructor(readonly recorded_at: Date) {}
}

abstract class Command {}

export class RestockOrder implements Command {}

export class RestockOrdered extends EEvent {
  readonly type = "restock_ordered";
}

abstract class Aggregate {
  abstract handle(events: EEvent[], command: Command): EEvent[];
}

export class Restocker implements Aggregate {
  handle(events: EEvent[], command: Command): EEvent[] {
    return [new RestockOrdered(new Date())];
  }
}
