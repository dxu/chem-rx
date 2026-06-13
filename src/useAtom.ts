import { useSyncExternalStore } from "react";
import { ReadOnlyAtom } from "./Atom";

export function useAtom<T>(atom: ReadOnlyAtom<T>): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      let subscribed = false;
      const subscription = atom.subscribe(() => {
        if (subscribed) {
          onStoreChange();
        }
      });
      subscribed = true;

      return () => {
        subscription.unsubscribe();
      };
    },
    () => atom.value(),
    () => atom.value()
  );
}
