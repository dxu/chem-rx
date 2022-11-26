import { Atom } from "./Atom";

type BaseObjectType = { [key: string]: any };

class _Compound<T extends BaseObjectType> {
  constructor(base: T) {
    const newAttributes: { [k in keyof T]?: Atom<T[k]> | Compound<T[k]> } = {
      ..._Compound.prototype,
    };
    // for every key, traverse and create a tree of Atoms for all primitive values, and Compounds for all object values
    (Object.keys(base) as (keyof typeof base)[]).map((key) => {
      const value = base[key];
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null &&
        !((value as object) instanceof Function)
      ) {
        newAttributes[key] = new Compound<typeof value>(value);
      } else {
        newAttributes[key] = new Atom<typeof value>(value);
      }
    });

    Object.assign(this, newAttributes);
  }
}

// Primary export to support extending _Compound with attribute selectors
type Compound<T extends BaseObjectType> = _Compound<T> & {
  [k in keyof T]: T[k] extends object
    ? T[k] extends Function
      ? Atom<T[k]>
      : Compound<T[k]>
    : Atom<T[k]>;
};

export const Compound: new <T extends BaseObjectType>(data: T) => Compound<T> =
  _Compound as any;
