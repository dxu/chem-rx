import { useEffect } from "react";
import { BaseAtom, NullableBaseAtom, ReadOnlyAtom } from "./Atom";

const hydratedAtomsSet: WeakSet<ReadOnlyAtom<any>> = new WeakSet();

export function hydrateAtoms(
  values: readonly [NullableBaseAtom<any> | BaseAtom<any>, any][],
  options?: { force?: boolean }
) {
  for (const [atom, value] of values) {
    if (!hydratedAtomsSet.has(atom) || options?.force) {
      hydratedAtomsSet.add(atom);
      atom._behavior$.next(value);
    }
  }
}
