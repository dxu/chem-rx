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
  reaction(
    // have both a get and a set, similar to recoil:
    // https://stackoverflow.com/questions/69943153/multiple-form-values-in-one-react-recoil-atom-override-each-other
    // https://recoiljs.org/docs/api-reference/core/selector

    // and then you create a  setter ffunction?
    // and then afterwards, you create an observable that only gets pushed when the setter gets called?
    // return both the getter and setter

    // setter could create a forkjoin, that gets listened to, and then pushes to the original return observable
    action: (args: any) => {
      [k in keyof T]?: T[k] extends Compound<infer C> ? C : GetGenericType<[k]>;
    }
  ): Atom<ReturnType<typeof action>> {
    // action();

    const zipped = zip();
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
