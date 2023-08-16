import {
  BehaviorSubject,
  combineLatest,
  isObservable,
  map,
  Observable,
  OperatorFunction,
  Subscription,
} from "rxjs";
import { OverloadedParameters, OverloadedReturnType } from "./types";

export type AtomTuple<T> = {
  [K in keyof T]: ReadOnlyAtom<T[K]>;
};

// export class ReadOnlyAtom<T> {}

export class ReadOnlyAtom<T> {
  _behavior$: BehaviorSubject<T>;

  _parent?: BehaviorSubject<T>[];
  _bonds: BehaviorSubject<T>[] = [];

  _fromObservable: Observable<T> | null = null;
  _fromObservableSubscription: Subscription | null = null;

  constructor(_value: T | Observable<T>) {
    if (isObservable(_value)) {
      this._fromObservable = _value;
      this._behavior$ = new BehaviorSubject<T>(null!);
      this._fromObservableSubscription = _value.subscribe((value) => {
        this._behavior$.next(value);
      });
    } else {
      // if it's just a value just use a regular behavior subject
      this._behavior$ = new BehaviorSubject<T>(_value);
    }
  }

  // taken from Observable
  pipe(): ReadOnlyAtom<T>;
  pipe<A>(op1: OperatorFunction<T, A>): ReadOnlyAtom<A>;
  pipe<A, B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>
  ): ReadOnlyAtom<B>;
  pipe<A, B, C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>
  ): ReadOnlyAtom<C>;
  pipe<A, B, C, D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>
  ): ReadOnlyAtom<D>;
  pipe<A, B, C, D, E>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>
  ): ReadOnlyAtom<E>;
  pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>
  ): ReadOnlyAtom<F>;
  pipe<A, B, C, D, E, F, G>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>
  ): ReadOnlyAtom<G>;
  pipe<A, B, C, D, E, F, G, H>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>
  ): ReadOnlyAtom<H>;
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>
  ): ReadOnlyAtom<I>;
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>,
    ...operations: OperatorFunction<any, any>[]
  ): ReadOnlyAtom<unknown>;

  pipe(
    ...operations: OverloadedParameters<Observable<T>["pipe"]>
  ): ReadOnlyAtom<any> {
    // @ts-ignore can't match overloaded function
    const observable = this._behavior$.pipe(...operations);
    const newAtom = new ReadOnlyAtom(observable);

    return newAtom;
  }

  transform(transformFn: (value: T, index: number) => any): ReadOnlyAtom<any> {
    return this.pipe(map(transformFn));
  }

  subscribe(...params: Parameters<BehaviorSubject<T>["subscribe"]>) {
    return this._behavior$.subscribe(...params);
  }

  value() {
    return this._behavior$.getValue();
  }

  // not needed?
  dispose() {
    this._fromObservableSubscription?.unsubscribe();
  }
}

export class BaseAtom<T> extends ReadOnlyAtom<T> {
  next(nextVal: T) {
    this._behavior$.next(nextVal);
  }
}

export class ArrayAtom<T> extends ReadOnlyAtom<T[]> {
  push(nextVal: T) {
    this._behavior$.next([...this._behavior$.getValue(), nextVal]);
  }
  get(idx: number) {
    return this.value()[idx];
  }
}

export class ObjectAtom<
  T extends Record<K, V>,
  K extends keyof T = keyof T,
  V = T[K]
> extends ReadOnlyAtom<T> {
  set(nextKey: K, nextValue: V) {
    this._behavior$.next({
      ...this._behavior$.getValue(),
      [nextKey]: nextValue,
    });
  }
  get(nextKey: K) {
    return this.value()[nextKey];
  }
}

export function Atom<T>(value: T[]): ArrayAtom<T>;
export function Atom<T extends object, K extends keyof T = keyof T>(
  _value: T
): ObjectAtom<T>;
export function Atom<T>(_value: Observable<T> | T): BaseAtom<T>;
export function Atom<T>(
  _value: T | Observable<T>
): BaseAtom<T> | ArrayAtom<T> | ObjectAtom<T> {
  let atom;
  if (Array.isArray(_value)) {
    atom = new ArrayAtom<T>(_value); // For arrays
  } else if (typeof _value === "object" && _value !== null) {
    atom = new ObjectAtom<T>(_value); // For objects
  } else {
    atom = new BaseAtom(_value); // For other types
  }
  return atom;
}

Atom.combine = <A extends readonly unknown[]>(
  ...atoms: readonly [...AtomTuple<A>]
): ReadOnlyAtom<A> => {
  const observable = combineLatest(...atoms.map((a) => a._behavior$));
  const newAtom = new ReadOnlyAtom(observable) as unknown as ReadOnlyAtom<A>;
  return newAtom;
};
