import { useEffect, useState } from "react";
import { ReadOnlyAtom } from "./Atom";

export function useAtom<T>(atom: ReadOnlyAtom<T>): T {
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
