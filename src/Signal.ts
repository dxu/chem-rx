import { Subject, Subscription } from "rxjs";

export class Signal<T = any> {
  private _subjects: Map<string, Subject<T>>;
  private _defaultSubject: Subject<T>;

  constructor() {
    this._subjects = new Map();
    this._defaultSubject = new Subject<T>();
  }

  ping(value: T, id?: string) {
    if (id && this._subjects.has(id)) {
      // If an ID is provided and exists, notify only that subscription.
      this._subjects.get(id)?.next(value);
    } else {
      // No ID provided, notify all default subscribers.
      this._defaultSubject.next(value);
      // Additionally, notify all subscriptions as a broadcast.
      this._subjects.forEach((subject) => subject.next(value));
    }
  }

  subscribe(callback: (value: T) => void, id?: string): Subscription {
    if (id) {
      // If an ID is provided, subscribe to the specific ID.
      if (!this._subjects.has(id)) {
        this._subjects.set(id, new Subject<T>());
      }
      return this._subjects.get(id)!.subscribe(callback);
    } else {
      // No ID provided, subscribe to the default subject.
      return this._defaultSubject.subscribe(callback);
    }
  }

  // Optionally, implement unsubscribe logic to manage subscriptions.
}
