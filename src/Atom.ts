import { BehaviorSubject, isObservable, Observable, Subscription } from "rxjs";

export class Atom<T> {
  _behavior$: BehaviorSubject<T>;

  _parentBond?: BehaviorSubject<T>[];
  _bonds: BehaviorSubject<T>[] = [];

  _fromObservable: Observable<T> | null = null;
  _fromObservableSubscription: Subscription | null = null;

  constructor(private _value: T | Observable<T>) {
    if (isObservable(_value)) {
      this._fromObservable = _value;
      this._behavior$ = new BehaviorSubject<T>(null!);
      this._fromObservableSubscription = _value.subscribe((value) => {
        this.push(value);
      });
    } else {
      // if it's just a value just use a regular behavior subject
      this._behavior$ = new BehaviorSubject<T>(_value);
    }
  }

  push(nextVal: T) {
    this._behavior$.next(nextVal);
  }

  bond(...operations: Parameters<Observable<T>["pipe"]>) {
    const observable = this._behavior$.pipe(...operations);
    return new Atom(observable);
  }

  subscribe(...params: Parameters<BehaviorSubject<T>["subscribe"]>) {
    return this._behavior$.subscribe(...params);
  }

  getValue() {
    return this._behavior$.getValue();
  }

  // not needed?
  dispose() {
    this._fromObservableSubscription?.unsubscribe();
  }
}
