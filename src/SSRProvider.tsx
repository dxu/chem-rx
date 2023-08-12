import { createContext, PropsWithChildren, useContext, useRef } from "react";
import * as React from "react";
import { Atom } from "./Atom";

type AnyValue = any;
type AnyAtom = Atom<AnyValue>;

type AtomState<Value = AnyValue> = Value; // Adjust based on your actual AtomState structure.

function createSSRStore() {
  const atomStateMap = new WeakMap<AnyAtom, AtomState>();

  function getAtom<Value>(atom: Atom<Value>) {
    return atomStateMap.get(atom) as Value | undefined;
  }

  function setAtom<Value>(atom: Atom<Value>, atomState: AtomState<Value>) {
    atomStateMap.set(atom, atomState);
  }

  return {
    get: getAtom,
    set: setAtom,
    all: atomStateMap,
    // set:
  };
}

type SSRStore = ReturnType<typeof createSSRStore>;

const defaultStore = createSSRStore();

const SSRContext = createContext<SSRStore | undefined>(undefined);

export const useSSRStore = (): SSRStore => {
  const store = useContext(SSRContext);
  return store || defaultStore;
};

export function SSRProvider({ children }: PropsWithChildren<{}>) {
  const storeRef = useRef<SSRStore>(defaultStore);

  return (
    <SSRContext.Provider value={storeRef.current}>
      {children}
    </SSRContext.Provider>
  );
}
