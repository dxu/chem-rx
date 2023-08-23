import { useEffect, useState } from "react";
import { ObjectAtom } from "./Atom";

export function useSelectAtom<
  T extends {
    [key in K]: V;
  },
  K extends string | number | symbol = keyof T,
  V = T[K]
>(atom: ObjectAtom<T>, key: K): T[K] {
  const [value, setValue] = useState<T[K]>(atom.get(key));

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
