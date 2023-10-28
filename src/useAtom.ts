import { useEffect, useState } from "react";
import { BaseAtom, NullableBaseAtom } from "./Atom";

export function useAtom<T>(atom: BaseAtom<T> | NullableBaseAtom<T>): T {
  const [value, setValue] = useState<T>(atom.value());

  useEffect(() => {
    const subscription = atom.subscribe((val) => {
      setValue(val);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [atom]);

  return value;
}
