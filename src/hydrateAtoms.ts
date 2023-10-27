import { BaseAtom } from "./Atom";

export function hydrateAtoms(values: readonly [BaseAtom<any>, any][]) {
  for (const [atom, value] of values) {
    atom._behavior$.next(value);
  }
}
