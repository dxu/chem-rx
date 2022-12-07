import { zip } from "rxjs";
import { Atom } from "./Atom";
import { GetGenericType, KeyOfValueType } from "./types";

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

  // push multiple at the same time
  // .push({
  // x: 1
  // com: {
  // y: 1
  // }
  // })
  // should return an observable where you can get all values
  _push(updates: {
    [k in keyof T]: T[k] extends Compound<infer C> ? C : GetGenericType<[k]>;
  }): any {
    updates;
    //
  }

  // set up a behavior for a setter action
  reaction<R>(
    action: (args: {
      [k in KeyOfValueType<T, Atom<GetGenericType<T[k]>>>]: GetGenericType<
        T[k]
      >;
    }) => void
  ): Atom<R> {
    action();

    const zipped =
      zip();
      // as observable

    return new Atom(zipped);
    // call the set function
  }
}

// Primary export to support extending _Compound with attribute selectors
type Compound<T extends BaseObjectType> = _Compound<T> & {
  [k in keyof T]: T[k] extends object
    ? T[k] extends Function | Array<infer ArrType>
      ? Atom<T[k]>
      : Compound<T[k]>
    : Atom<T[k]>;
};

export const Compound: new <T extends BaseObjectType>(data: T) => Compound<T> =
  _Compound as any;
