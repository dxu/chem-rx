import { useEffect } from "react";
import { BaseAtom, ReadOnlyAtom } from "./Atom";

const hydratedAtomsSet: WeakSet<ReadOnlyAtom<any>> = new WeakSet();

export function hydrateAtoms(values: readonly [BaseAtom<any>, any][]) {
  for (const [atom, value] of values) {
    if (!hydratedAtomsSet.has(atom)) {
      hydratedAtomsSet.add(atom);
      atom._behavior$.next(value);
    }
  }
}
