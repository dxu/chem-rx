import {
  AtomListener,
  AtomSubscription,
  createSubscription,
  notifyListeners,
} from "./store";

export class Signal<T = any> {
  private _listeners: AtomListener<T>[] = [];
  private _listenersById = new Map<string, AtomListener<T>[]>();

  ping(value: T, id?: string) {
    if (id && this._listenersById.has(id)) {
      notifyListeners(this._listenersById.get(id)!, value);
      return;
    }

    notifyListeners(this._listeners, value);

    for (const listeners of this._listenersById.values()) {
      notifyListeners(listeners, value);
    }
  }

  subscribe(callback: AtomListener<T>, id?: string): AtomSubscription {
    if (!id) {
      this._listeners.push(callback);

      return createSubscription(() => {
        removeListener(this._listeners, callback);
      });
    }

    const listeners = this._listenersById.get(id) ?? [];
    listeners.push(callback);
    this._listenersById.set(id, listeners);

    return createSubscription(() => {
      removeListener(listeners, callback);

      if (listeners.length === 0) {
        this._listenersById.delete(id);
      }
    });
  }
}

function removeListener<T>(
  listeners: AtomListener<T>[],
  callback: AtomListener<T>
) {
  const index = listeners.indexOf(callback);

  if (index >= 0) {
    listeners.splice(index, 1);
  }
}
