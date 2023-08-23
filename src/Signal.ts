import { Subject } from "rxjs";

export class BaseSignal<T = any> {
  _subject$: Subject<T>;

  constructor() {
    // if it's just a value just use a regular behavior subject
    this._subject$ = new Subject<T>();
  }

  ping(value: T) {
    this._subject$.next(value);
  }

  subscribe(...params: Parameters<Subject<T>["subscribe"]>) {
    return this._subject$.subscribe(...params);
  }
}

export function Signal<T>() {}
