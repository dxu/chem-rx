import {
  AtomObserver,
  AtomSource,
  AtomSubscription,
  ValueStore,
  createSubscription,
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

type AtomDependency<T> = {
  getSnapshot: (force?: boolean) => T;
  subscribe: (
    onDependencyChange: () => void
  ) => AtomSubscription | (() => void) | void;
  shouldNotify?: (previousValue: T, nextValue: T) => boolean;
};

export class ReadOnlyAtom<T> {
  private _store: ValueStore<T>;
  private _subscriptions: AtomSubscription[] = [];
  private _dependency: AtomDependency<T> | null = null;
  private _dependencySubscription: AtomSubscription | null = null;
  private _subscriberCount = 0;

  constructor(_value: T | AtomSource<T>, dependency?: AtomDependency<T>) {
    if (dependency) {
      this._dependency = dependency;
      this._store = new ValueStore<T>(_value as T);
    } else if (isAtomSource<T>(_value)) {
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
    let hasCachedInput = false;
    let cachedInput: T;
    let cachedValue: A;

    const getSnapshot = (force = false) => {
      const input = this.value();

      if (force || !hasCachedInput || !Object.is(cachedInput, input)) {
        cachedInput = input;
        cachedValue = deriveFn(input, index++);
        hasCachedInput = true;
      }

      return cachedValue!;
    };

    return new ReadOnlyAtom<A>(getSnapshot(), {
      getSnapshot,
      subscribe: (onDependencyChange) =>
        this._subscribe(onDependencyChange, { emitImmediately: false }),
      shouldNotify: () => true,
    });
  }

  subscribe(observer: AtomObserver<T>): AtomSubscription {
    return this._subscribe(observer);
  }

  value() {
    if (this._dependency) {
      this._refresh(false);
    }

    return this._store.getValue();
  }

  dispose() {
    this._dependencySubscription?.unsubscribe();
    this._dependencySubscription = null;
    this._subscriberCount = 0;

    for (const subscription of this._subscriptions.splice(0)) {
      subscription.unsubscribe();
    }
  }

  get<K extends SelectKey<T>>(key: K): SelectValue<T, K> {
    const val = this.value() as NonNullable<T> | null | undefined;
    return val?.[key] as SelectValue<T, K>;
  }

  select<K extends SelectKey<T>>(key: K): ReadOnlyAtom<SelectValue<T, K>> {
    const getSnapshot = () => {
      const value = this.value();
      return (value as NonNullable<T> | null | undefined)?.[
        key
      ] as SelectValue<T, K>;
    };

    return new ReadOnlyAtom<SelectValue<T, K>>(getSnapshot(), {
      getSnapshot,
      subscribe: (onDependencyChange) =>
        this._subscribe(onDependencyChange, { emitImmediately: false }),
    });
  }

  private _refresh(emit: boolean, force = false) {
    if (!this._dependency) {
      return this._store.getValue();
    }

    const previousValue = this._store.getValue();
    const nextValue = this._dependency.getSnapshot(force);
    const shouldNotify =
      emit &&
      (this._dependency.shouldNotify?.(previousValue, nextValue) ??
        !Object.is(previousValue, nextValue));

    if (shouldNotify) {
      this._store.next(nextValue);
    } else {
      this._store.setValue(nextValue);
    }

    return nextValue;
  }

  private _retainDependency() {
    if (!this._dependency) {
      return;
    }

    this._subscriberCount += 1;

    if (this._subscriberCount === 1) {
      this._dependencySubscription = normalizeSubscription(
        this._dependency.subscribe(() => {
          this._refresh(true, true);
        })
      );
    }
  }

  private _releaseDependency() {
    if (!this._dependency || this._subscriberCount === 0) {
      return;
    }

    this._subscriberCount -= 1;

    if (this._subscriberCount === 0) {
      this._dependencySubscription?.unsubscribe();
      this._dependencySubscription = null;
    }
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
    if (!this._dependency) {
      return this._store.subscribe(observer, options);
    }

    this._refresh(false);

    let subscription: AtomSubscription;

    try {
      this._retainDependency();
      subscription = this._store.subscribe(observer, options);
    } catch (error) {
      this._releaseDependency();
      throw error;
    }

    return createSubscription(() => {
      subscription.unsubscribe();
      this._releaseDependency();
    });
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
  const getSnapshot = () => atoms.map((atom) => atom.value()) as unknown as A;

  return new ReadOnlyAtom<A>(getSnapshot(), {
    getSnapshot,
    subscribe: (onDependencyChange) => {
      const subscriptions = atoms.map((atom) =>
        atom._subscribe(onDependencyChange, { emitImmediately: false })
      );

      return () => {
        for (const subscription of subscriptions) {
          subscription.unsubscribe();
        }
      };
    },
  });
};
