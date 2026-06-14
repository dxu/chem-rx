import { useMemo, useSyncExternalStore } from "react";
import { Equals, ReadOnlyAtom } from "./Atom";

export function createSelectorMemo<T, R>(
  selector: (value: T) => R,
  equals: Equals<R>
): (snapshot: T) => R {
  let hasValue = false;
  let prevSnapshot: T;
  let prevSelection: R;
  return (snapshot: T): R => {
    if (hasValue && Object.is(prevSnapshot, snapshot)) {
      return prevSelection;
    }
    const next = selector(snapshot);
    if (hasValue && equals(prevSelection, next)) {
      prevSnapshot = snapshot;
      return prevSelection;
    }
    hasValue = true;
    prevSnapshot = snapshot;
    prevSelection = next;
    return next;
  };
}

/**
 * Subscribe to a slice of an atom, re-rendering only when the selected value
 * changes. The optional `equals` comparator dedupes by content (defaults to
 * `Object.is`), so a parent atom that churns references every update will not
 * re-render the component when the selected slice is content-equal.
 */
export function useSelector<T, R>(
  atom: ReadOnlyAtom<T>,
  selector: (value: T) => R,
  equals: Equals<R> = Object.is
): R {
  const select = useMemo(
    () => createSelectorMemo(selector, equals),
    [selector, equals]
  );
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
    () => select(atom.value()),
    () => select(atom.value())
  );
}
