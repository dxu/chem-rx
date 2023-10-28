import { useEffect, useState } from "react";
import { BaseAtom, NullableBaseAtom } from "./Atom";

export function useSelectAtom<
  T extends NullableBaseAtom<V> | BaseAtom<V>,
  V extends {
    [key in K]: infer W;
  },
  K extends keyof V
>(atom: T, key: K): V[K] {
  const [value, setValue] = useState<V[K]>(atom.get(key)!);

  useEffect(() => {
    const subscription = atom.select(key).subscribe((val) => {
      setValue(val as V[K]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [atom]);

  return value;
}
