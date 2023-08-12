import { Atom } from "./Atom";
import { useSSRStore } from "./SSRProvider";

export function hydrateAtoms(values: readonly [Atom<any>, any][]) {
  // const store = useSSRStore();

  for (const [atom, value] of values) {
    // if (IS_SERVER) {
    //   store.set(atom, value);
    //   console.log(store);
    // } else {
    //   console.log(store);
    atom.push(value);
    // }
  }
}
