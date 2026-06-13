import { useEffect } from "react";
import { Signal } from "./Signal";
import { AtomSubscription } from "./store";

export function useSignal<T>(
  signal: Signal<T>,
  callback?: (update: T) => void,
  id?: string
) {
  useEffect(() => {
    // Assuming the signal might not have an initial value method like `atom.value()`,
    // If your signal class has a method to get the current/latest value, use it here to initialize.

    let subscription: AtomSubscription | undefined;
    if (callback) {
      subscription = signal.subscribe(callback, id);
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [signal, callback, id]);
}
