import {
  BehaviorSubject,
  combineLatest,
  distinctUntilKeyChanged,
  isObservable,
  map,
  Observable,
  OperatorFunction,
  Subscription,
} from "rxjs";
import { OverloadedParameters } from "./types";

export type AtomTuple<T> = {
  [K in keyof T]: ReadOnlyAtom<T[K]>;
};

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

  derive<A>(deriveFn: (value: T, index: number) => A): ReadOnlyAtom<A> {
    return this.pipe(map(deriveFn));
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

  get(
    key: T extends (infer W)[]
      ? number
      : T extends { [key in keyof T]: infer W }
      ? keyof T
      : undefined
  ): T extends (infer W)[]
    ? T[number]
    : T extends { [key in keyof T]: infer W }
    ? T[keyof T]
    : undefined {
    const val = this.value() as T;
    // @ts-ignore Can't figure out this type so i'm REALLY cheating
    return val[key] as T extends (infer W)[]
      ? T[number]
      : T extends { [key in keyof T]: infer W }
      ? T[keyof T]
      : undefined;
  }

  select<K extends keyof T>(
    key: K
  ): T[K] extends (infer W)[]
    ? ArrayAtom<W>
    : T[K] extends { [key: string | symbol]: infer W }
    ? ObjectAtom<T[K]>
    : BaseAtom<T[K]> {
    const newObs = this._behavior$.pipe(
      distinctUntilKeyChanged(key),
      map((k) => k?.[key])
    );
    // Can't get typescript to recognize the types here so I'm cheating
    return Atom(newObs) as unknown as T[K] extends (infer W)[]
      ? ArrayAtom<W>
      : T[K] extends { [key: string | symbol]: infer W }
      ? ObjectAtom<T[K]>
      : BaseAtom<T[K]>;
  }
}

export class BaseAtom<T> extends ReadOnlyAtom<T> {
  set(nextVal: T) {
    this._behavior$.next(nextVal);
  }
}

export class ArrayAtom<T> extends ReadOnlyAtom<T[]> {
  constructor(initialValue: T[]) {
    super(initialValue);
  }

  push(nextVal: T) {
    this._behavior$.next([...this._behavior$.getValue(), nextVal]);
  }
}
//
// export class ReadOnlyObjectAtom<
//   T extends {
//     [key in K]: V;
//   },
//   K extends string | number | symbol = keyof T,
//   V = T[K]
// > extends ReadOnlyAtom<T> {
//   get(nextKey: K) {
//     return this.value()[nextKey];
//   }
//
//   select<K extends keyof T>(
//     key: K
//   ): T[K] extends (infer W)[]
//     ? ArrayAtom<W>
//     : T[K] extends { [key in infer L]?: infer W }
//     ? ObjectAtom<T[K]>
//     : BaseAtom<T> {
//     const newObs = this._behavior$.pipe(
//       distinctUntilKeyChanged(key),
//       map((k) => k?.[key])
//     );
//     // Can't get typescript to recognize the types here so I'm cheating
//     return Atom(newObs) as unknown as T[K] extends (infer W)[]
//       ? ArrayAtom<W>
//       : T[K] extends { [key in infer L]?: infer W }
//       ? ObjectAtom<T[K]>
//       : BaseAtom<T>;
//   }
// }

export class ObjectAtom<
  T extends {
    [key in K]: V;
  },
  K extends string | number | symbol = keyof T,
  V = T[K]
> extends ReadOnlyAtom<T> {
  set(nextKey: K, nextValue: V) {
    this._behavior$.next({
      ...this._behavior$.getValue(),
      [nextKey]: nextValue,
    });
  }
}

// catch-all for developers
// export type AnyAtom<T> = BaseAtom<T> | ArrayAtom<T> | ObjectAtom<T>;

// observable type (primitive)
export function Atom<T>(
  value: T extends { [key: string]: infer V } | any[] ? never : Observable<T>
): BaseAtom<T>;

// observable<array> type
export function Atom<T extends any[]>(
  value: Observable<T>
): ArrayAtom<T[number]>;

// observable<object> type
export function Atom<T>(
  value: T extends {
    [key in keyof T]: infer V;
  }
    ? Observable<T>
    : never
): ObjectAtom<T>;

// array type
export function Atom<T extends any[]>(value: T): ArrayAtom<T[number]>;

// object type
export function Atom<T extends { [key: string]: T[keyof T] }>(
  value: T
): ObjectAtom<T>;

// primitive type
export function Atom<T>(value: T): BaseAtom<T>;

// readonly type
export function Atom<T>(value: T, readOnly?: boolean): ReadOnlyAtom<T>;

// function definition
export function Atom<T>(_value: T, readOnly: boolean = false) {
  let atom;
  if (readOnly) {
    atom = new ReadOnlyAtom(_value);
  } else if (Array.isArray(_value)) {
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
