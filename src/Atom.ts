import {
  AtomObserver,
  AtomSource,
  AtomSubscription,
  ValueStore,
  isAtomSource,
  normalizeSubscription,
  readAtomSourceValue,
} from "./store";

export type AtomTuple<T> = {
  [K in keyof T]: ReadOnlyAtom<T[K]>;
};

type SelectedValue<T, K extends keyof T> = T extends readonly (infer W)[]
  ? W
  : T[K];

type SelectKey<T> = keyof NonNullable<T>;

type SelectValue<T, K extends SelectKey<T>> =
  Extract<T, null | undefined> extends never
    ? SelectedValue<NonNullable<T>, K>
    : SelectedValue<NonNullable<T>, K> | undefined;

export class ReadOnlyAtom<T> {
  private _store: ValueStore<T>;
  private _subscriptions: AtomSubscription[] = [];

  constructor(_value: T | AtomSource<T>) {
    if (isAtomSource<T>(_value)) {
      this._store = new ValueStore<T>(readAtomSourceValue(_value));
      this._addSubscription(
        _value.subscribe((value) => {
          this._next(value);
        })
      );
    } else {
      this._store = new ValueStore<T>(_value);
    }
  }

  derive<A>(deriveFn: (value: T, index: number) => A): ReadOnlyAtom<A> {
    let index = 0;
    const derivedAtom = new ReadOnlyAtom(deriveFn(this.value(), index++));

    const subscription = this._subscribe(
      (value) => {
        derivedAtom._next(deriveFn(value, index++));
      },
      { emitImmediately: false }
    );

    derivedAtom._addSubscription(subscription);

    return derivedAtom;
  }

  subscribe(observer: AtomObserver<T>): AtomSubscription {
    return this._store.subscribe(observer);
  }

  value() {
    return this._store.getValue();
  }

  dispose() {
    for (const subscription of this._subscriptions.splice(0)) {
      subscription.unsubscribe();
    }
  }

  get<K extends SelectKey<T>>(key: K): SelectValue<T, K> {
    const val = this.value() as NonNullable<T> | null | undefined;
    return val?.[key] as SelectValue<T, K>;
  }

  select<K extends SelectKey<T>>(key: K): ReadOnlyAtom<SelectValue<T, K>> {
    let selectedValue = this.get(key);
    const selectedAtom = new ReadOnlyAtom<SelectValue<T, K>>(selectedValue);

    const subscription = this._subscribe(
      (value) => {
        const nextValue = (value as NonNullable<T> | null | undefined)?.[
          key
        ] as SelectValue<T, K>;

        if (Object.is(selectedValue, nextValue)) {
          return;
        }

        selectedValue = nextValue;
        selectedAtom._next(nextValue);
      },
      { emitImmediately: false }
    );

    selectedAtom._addSubscription(subscription);

    return selectedAtom;
  }

  /** @internal */
  _next(value: T) {
    this._store.next(value);
  }

  /** @internal */
  _subscribe(
    observer: AtomObserver<T>,
    options?: { emitImmediately?: boolean }
  ): AtomSubscription {
    return this._store.subscribe(observer, options);
  }

  /** @internal */
  _addSubscription(
    subscription: AtomSubscription | (() => void) | void
  ): AtomSubscription {
    const normalized = normalizeSubscription(subscription);
    this._subscriptions.push(normalized);
    return normalized;
  }
}

export class BaseAtom<T> extends ReadOnlyAtom<T> {
  next(nextVal: T) {
    this._next(nextVal);
  }

  set<K extends SelectKey<T>>(nextKey: K, nextValue: NonNullable<T>[K]) {
    const currentValue = this.value();

    if (currentValue == null || typeof currentValue !== "object") {
      throw new TypeError("Atom.set can only be used with object values");
    }

    this._next({
      ...(currentValue as object),
      [nextKey]: nextValue,
    } as T);
  }
}

export class NullableBaseAtom<T> extends BaseAtom<T | null | undefined> {
  constructor(_value?: T | null | undefined | AtomSource<T | null | undefined>) {
    super(_value as T | null | undefined | AtomSource<T | null | undefined>);
  }

  next(nextVal: T | null | undefined) {
    this._next(nextVal);
  }

  reset() {
    this._next(undefined);
  }
}

export class ArrayAtom<T> extends BaseAtom<T[]> {
  constructor(initialValue?: T[] | AtomSource<T[]>) {
    if (initialValue === undefined) {
      super([]);
    } else {
      super(initialValue);
    }
  }

  push(nextVal: T) {
    this._next([...this.value(), nextVal]);
  }
}

export function Atom<T>(
  value: T | AtomSource<T>,
  readOnly: true
): ReadOnlyAtom<T>;
export function Atom<T extends any[]>(value: AtomSource<T>): ArrayAtom<T[number]>;
export function Atom<T>(value: AtomSource<T>): BaseAtom<T>;
export function Atom<T extends any[]>(value?: T): ArrayAtom<T[number]>;
export function Atom<T extends { [key: string]: T[keyof T] }>(
  value: T
): BaseAtom<T>;
export function Atom<T extends { [key: string]: T[keyof T] }>(
  value?: T
): NullableBaseAtom<T>;
export function Atom<T>(value: T): BaseAtom<T>;
export function Atom<T>(value?: T): NullableBaseAtom<T>;
export function Atom<T>(
  value: T | AtomSource<T>,
  readOnly?: boolean
): ReadOnlyAtom<T> | BaseAtom<T>;
export function Atom<T>(_value?: T | AtomSource<T>, readOnly = false) {
  if (readOnly) {
    return new ReadOnlyAtom(_value as T | AtomSource<T>);
  }

  if (isAtomSource<T>(_value)) {
    const sourceValue = readAtomSourceValue(_value);

    if (Array.isArray(sourceValue)) {
      return new ArrayAtom(_value as AtomSource<any[]>);
    }

    return new BaseAtom(_value);
  }

  if (Array.isArray(_value)) {
    return new ArrayAtom<T>(_value);
  }

  if (_value == null) {
    return new NullableBaseAtom();
  }

  return new BaseAtom(_value);
}

Atom.combine = <A extends readonly unknown[]>(
  ...atoms: readonly [...AtomTuple<A>]
): ReadOnlyAtom<A> => {
  const values = atoms.map((atom) => atom.value()) as unknown as A;
  const combinedAtom = new ReadOnlyAtom<A>(values);

  atoms.forEach((atom, index) => {
    const subscription = atom._subscribe(
      (value) => {
        const nextValues = [
          ...(combinedAtom.value() as unknown as unknown[]),
        ] as unknown[];
        nextValues[index] = value;
        combinedAtom._next(nextValues as unknown as A);
      },
      { emitImmediately: false }
    );

    combinedAtom._addSubscription(subscription);
  });

  return combinedAtom;
};
