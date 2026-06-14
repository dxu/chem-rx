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

/**
 * Comparator used to decide whether an atom's value has changed.
 *
 * An atom notifies subscribers only when `equals(previous, next)` returns
 * `false`. The default for every atom is {@link Object.is} (value equality for
 * primitives, reference identity for objects/arrays). Supply a content
 * comparator to dedup by data, or `() => false` to force every update to emit.
 */
export type Equals<T> = (previousValue: T, nextValue: T) => boolean;

type AtomOptions<T> = {
  equals?: Equals<T>;
};

type AtomDependency<T> = {
  getSnapshot: (force?: boolean) => T;
  subscribe: (
    onDependencyChange: () => void
  ) => AtomSubscription | (() => void) | void;
};

export class ReadOnlyAtom<T> {
  private _store: ValueStore<T>;
  private _subscriptions: AtomSubscription[] = [];
  private _dependency: AtomDependency<T> | null = null;
  private _dependencySubscription: AtomSubscription | null = null;
  private _subscriberCount = 0;
  private _equals: Equals<T>;

  /**
   * @param options.equals Comparator deciding when the value has changed.
   *   Defaults to {@link Object.is}. Subscribers are notified only when it
   *   returns `false`.
   */
  constructor(
    _value: T | AtomSource<T>,
    dependency?: AtomDependency<T>,
    options?: AtomOptions<T>
  ) {
    this._equals = options?.equals ?? Object.is;

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

  /**
   * Create a read-only atom whose value is derived from this atom.
   *
   * By default the derived atom notifies subscribers only when its computed
   * output differs by {@link Object.is}. Pass `options.equals` to dedup by
   * content (useful when `deriveFn` returns a fresh object/array each time), or
   * `equals: () => false` to re-emit on every parent update.
   */
  derive<A>(
    deriveFn: (value: T, index: number) => A,
    options?: AtomOptions<A>
  ): ReadOnlyAtom<A> {
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

    return new ReadOnlyAtom<A>(
      getSnapshot(),
      {
        getSnapshot,
        subscribe: (onDependencyChange) =>
          this._subscribe(onDependencyChange, { emitImmediately: false }),
      },
      options
    );
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

  /**
   * Create a read-only atom that tracks `key` on this atom's value.
   *
   * By default the selected atom notifies subscribers only when the selected
   * value differs by {@link Object.is}. Pass `options.equals` to dedup by
   * content instead.
   */
  select<K extends SelectKey<T>>(
    key: K,
    options?: AtomOptions<SelectValue<T, K>>
  ): ReadOnlyAtom<SelectValue<T, K>> {
    const getSnapshot = () => {
      const value = this.value();
      return (value as NonNullable<T> | null | undefined)?.[
        key
      ] as SelectValue<T, K>;
    };

    return new ReadOnlyAtom<SelectValue<T, K>>(
      getSnapshot(),
      {
        getSnapshot,
        subscribe: (onDependencyChange) =>
          this._subscribe(onDependencyChange, { emitImmediately: false }),
      },
      options
    );
  }

  private _refresh(emit: boolean, force = false) {
    if (!this._dependency) {
      return this._store.getValue();
    }

    const previousValue = this._store.getValue();
    const nextValue = this._dependency.getSnapshot(force);
    const shouldNotify = emit && !this._equals(previousValue, nextValue);

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
    const previousValue = this._store.getValue();

    if (this._equals(previousValue, value)) {
      this._store.setValue(value);
    } else {
      this._store.next(value);
    }
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
  constructor(
    _value?: T | null | undefined | AtomSource<T | null | undefined>,
    options?: AtomOptions<T | null | undefined>
  ) {
    super(
      _value as T | null | undefined | AtomSource<T | null | undefined>,
      undefined,
      options
    );
  }

  next(nextVal: T | null | undefined) {
    this._next(nextVal);
  }

  reset() {
    this._next(undefined);
  }
}

export class ArrayAtom<T> extends BaseAtom<T[]> {
  constructor(initialValue?: T[] | AtomSource<T[]>, options?: AtomOptions<T[]>) {
    if (initialValue === undefined) {
      super([], undefined, options);
    } else {
      super(initialValue, undefined, options);
    }
  }

  push(nextVal: T) {
    this._next([...this.value(), nextVal]);
  }
}

/**
 * Options for the {@link Atom} factory. `readOnly` produces a
 * {@link ReadOnlyAtom}; `equals` sets the change comparator (defaults to
 * {@link Object.is}).
 */
export type AtomFactoryOptions<T> = AtomOptions<T> & { readOnly?: boolean };

// Legacy positional `readOnly` form.
export function Atom<T>(
  value: T | AtomSource<T>,
  readOnly: true
): ReadOnlyAtom<T>;
// Options-object form.
export function Atom<T>(
  value: T | AtomSource<T>,
  options: AtomFactoryOptions<T> & { readOnly: true }
): ReadOnlyAtom<T>;
export function Atom<T extends any[]>(
  value: AtomSource<T>,
  options?: AtomFactoryOptions<T>
): ArrayAtom<T[number]>;
export function Atom<T>(
  value: AtomSource<T>,
  options?: AtomFactoryOptions<T>
): BaseAtom<T>;
export function Atom<T extends any[]>(
  value: T,
  options?: AtomFactoryOptions<T>
): ArrayAtom<T[number]>;
export function Atom<T extends { [key: string]: T[keyof T] }>(
  value: T,
  options?: AtomFactoryOptions<T>
): BaseAtom<T>;
export function Atom<T extends { [key: string]: T[keyof T] }>(
  value?: T,
  options?: AtomFactoryOptions<T>
): NullableBaseAtom<T>;
export function Atom<T>(value: T, options?: AtomFactoryOptions<T>): BaseAtom<T>;
export function Atom<T>(
  value?: T,
  options?: AtomFactoryOptions<T>
): NullableBaseAtom<T>;
export function Atom<T>(
  value: T | AtomSource<T>,
  optionsOrReadOnly?: boolean | AtomFactoryOptions<T>
): ReadOnlyAtom<T> | BaseAtom<T>;
export function Atom<T>(
  _value?: T | AtomSource<T>,
  optionsOrReadOnly?: boolean | AtomFactoryOptions<T>
) {
  const factoryOptions: AtomFactoryOptions<T> =
    typeof optionsOrReadOnly === "boolean"
      ? { readOnly: optionsOrReadOnly }
      : optionsOrReadOnly ?? {};

  const { readOnly = false, equals } = factoryOptions;
  const atomOptions: AtomOptions<any> | undefined = equals ? { equals } : undefined;

  if (readOnly) {
    return new ReadOnlyAtom(_value as T | AtomSource<T>, undefined, atomOptions);
  }

  if (isAtomSource<T>(_value)) {
    const sourceValue = readAtomSourceValue(_value);

    if (Array.isArray(sourceValue)) {
      return new ArrayAtom(_value as AtomSource<any[]>, atomOptions);
    }

    return new BaseAtom(_value, undefined, atomOptions);
  }

  if (Array.isArray(_value)) {
    return new ArrayAtom<T>(_value, atomOptions);
  }

  if (_value == null) {
    return new NullableBaseAtom(undefined, atomOptions);
  }

  return new BaseAtom(_value, undefined, atomOptions);
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
