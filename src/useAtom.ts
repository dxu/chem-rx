import { useEffect, useState } from "react";
import { BaseAtom, NullableBaseAtom, ReadOnlyAtom } from "./Atom";

export function useAtom<T>(
  atom: BaseAtom<T> | NullableBaseAtom<T> | ReadOnlyAtom<T>
): T {
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
