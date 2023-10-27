import { useEffect } from "react";
import { BaseAtom } from "./Atom";

export function useHydrateAtoms(values: readonly [BaseAtom<any>, any][]) {
  useEffect(() => {
    for (const [atom, value] of values) {
      atom._behavior$.next(value);
    }
  }, []);
}
