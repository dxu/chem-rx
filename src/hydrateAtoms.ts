import { Atom } from "./Atom";

export function hydrateAtoms(values: readonly [Atom<any>, any][]) {
  for (const [atom, value] of values) {
    atom.push(value);
  }
}
