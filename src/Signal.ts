import {
  Subject,
  isObservable,
  Observable,
  OperatorFunction,
  Subscription,
} from "rxjs";
import { OverloadedParameters, OverloadedReturnType } from "./types";

export class Signal<T = void> {
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

  // not needed?
  dispose() {
    this._subject$.unsubscribe();
  }
}
