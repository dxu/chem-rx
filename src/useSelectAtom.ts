import { useMemo } from "react";
import { BaseAtom, NullableBaseAtom, ReadOnlyAtom } from "./Atom";
import { useAtom } from "./useAtom";

export function useSelectAtom<
  T extends
    | {
        [key in K]: V;
      },
  K extends keyof T,
  V = T[K]
>(atom: NullableBaseAtom<T> | BaseAtom<T> | ReadOnlyAtom<T>, key: K): T[K] {
  const selectedAtom = useMemo(
    () => atom.select(key) as ReadOnlyAtom<T[K]>,
    [atom, key]
  );
  return useAtom(selectedAtom);
}
