import { useEffect, useState } from "react";
import { Atom } from "./Atom";

export function useAtom<T>(atom: Atom<T>): T {
  const [value, setValue] = useState<T>(atom.getValue());

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
