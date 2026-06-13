export type AtomListener<T> = (value: T) => void;

export type AtomSubscription = {
  unsubscribe: () => void;
};

export type AtomObserver<T> =
  | AtomListener<T>
  | {
      next?: AtomListener<T>;
    };

export type AtomSource<T> = {
  subscribe: (
    observer: AtomObserver<T>
  ) => AtomSubscription | (() => void) | void;
  getValue?: () => T;
  value?: () => T;
};

const noop = () => {};

export function createSubscription(unsubscribe: () => void): AtomSubscription {
  let closed = false;

  return {
    unsubscribe: () => {
      if (closed) return;
      closed = true;
      unsubscribe();
    },
  };
}

export function normalizeSubscription(
  subscription: AtomSubscription | (() => void) | void
): AtomSubscription {
  if (typeof subscription === "function") {
    return createSubscription(subscription);
  }

  if (subscription && typeof subscription.unsubscribe === "function") {
    return createSubscription(() => subscription.unsubscribe());
  }

  return createSubscription(noop);
}

export function isAtomSource<T = unknown>(value: unknown): value is AtomSource<T> {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as { subscribe?: unknown }).subscribe === "function"
  );
}

export function readAtomSourceValue<T>(source: AtomSource<T>): T {
  if (typeof source.getValue === "function") {
    return source.getValue();
  }

  if (typeof source.value === "function") {
    return source.value();
  }

  return undefined as T;
}

export function toListener<T>(observer: AtomObserver<T>): AtomListener<T> {
  if (typeof observer === "function") {
    return observer;
  }

  if (observer && typeof observer.next === "function") {
    return (value) => observer.next?.(value);
  }

  return noop;
}

export function notifyListeners<T>(
  listeners: Iterable<AtomListener<T>>,
  value: T
) {
  const errors: unknown[] = [];

  for (const listener of Array.from(listeners)) {
    try {
      listener(value);
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length === 1) {
    throw errors[0];
  }

  if (errors.length > 1) {
    throw new AggregateError(errors, "Multiple atom subscribers failed");
  }
}

export class ValueStore<T> {
  private _value: T;
  private _listeners: AtomListener<T>[] = [];

  constructor(value: T) {
    this._value = value;
  }

  getValue() {
    return this._value;
  }

  setValue(value: T) {
    this._value = value;
  }

  next(value: T) {
    this._value = value;
    notifyListeners(this._listeners, value);
  }

  subscribe(
    observer: AtomObserver<T>,
    options: { emitImmediately?: boolean } = {}
  ): AtomSubscription {
    const listener = toListener(observer);
    this._listeners.push(listener);

    if (options.emitImmediately !== false) {
      listener(this._value);
    }

    return createSubscription(() => {
      const index = this._listeners.indexOf(listener);

      if (index >= 0) {
        this._listeners.splice(index, 1);
      }
    });
  }
}
