import { useEffect, useState } from "react";
import { BaseAtom, NullableBaseAtom, ReadOnlyAtom } from "./Atom";

export function useSelectAtom<
  T extends
    | {
        [key in K]: V;
      },
  K extends keyof T,
  V = T[K]
>(atom: NullableBaseAtom<T> | BaseAtom<T> | ReadOnlyAtom<T>, key: K): T[K] {
  const [value, setValue] = useState<T[K]>(atom.get(key)!);

  useEffect(() => {
    const subscription = atom.select(key).subscribe((val) => {
      setValue(val as T[K]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [atom]);

  return value;
}
