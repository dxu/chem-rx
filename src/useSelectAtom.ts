import { useEffect, useState } from "react";
import { Atom, ObjectAtom } from "./Atom";
import { distinctUntilKeyChanged } from "rxjs";

export function useSelectAtom<
  T extends Record<K, V>,
  K extends keyof T = keyof T,
  V = T[K]
>(atom: ObjectAtom<T>, key: K): V {
  const [value, setValue] = useState<V>(atom.get(key));

  useEffect(() => {
    const subscription = atom.select(key).subscribe((val) => {
      setValue(val);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [atom]);

  return value;
}
