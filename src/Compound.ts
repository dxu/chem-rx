import { BehaviorSubject } from "rxjs";
import Atom from "./Atom";
import { IsntObject, KeyOfType } from "./types";

// type Tree<T extends InType> = {
//   [key in keyof T]: Atom<T[key]> | Compound<T[key]>;
// };

type InType = { [key: string]: any };

function existsInObject(
  obj: object,
  k: string | number | symbol
): k is keyof typeof obj {
  return k in obj;
}

export class _Compound<T extends InType> {
  // _atoms: {
  //   [key in keyof T as T[key] extends object ? never : key]: Atom<T[key]>;
  // } = {};

  // _compounds: {
  //   // [key in keyof T]: key extends object ? Compound<T[key]> : never;
  //   [key in keyof T as T[key] extends object ? key : never]: Compound<T[key]>;
  // } = {};

  constructor(base: T) {
    const newAttributes: { [k in keyof T]?: Atom<T[k]> | Compound<T[k]> } = {
      ..._Compound.prototype,
    };
    // Object.assign(this, base);
    // for every single key, traverse and create a tree of atoms
    (Object.keys(base) as (keyof typeof base)[]).map((key) => {
      const value = base[key];
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null &&
        !((value as object) instanceof Function)
      ) {
        newAttributes[key] = new Compound<typeof value>(value);

        // this[key] = new Compound<typeof value>(value);
        // value extends
        // this._compounds[key] = new Compound<typeof value>(value);
      } else {
        newAttributes[key] = new Atom<typeof value>(value);
      }
    });

    Object.assign(this, newAttributes);

    // for (const key in base) {
    //   const value = base[key];
    //   // if it's an object, create a new compound
    //   if (
    //     typeof value === "object" &&
    //     !Array.isArray(value) &&
    //     value !== null &&
    //     !((value as object) instanceof Function)
    //   ) {
    //     // value extends
    //     this._compounds[key] = new Compound<typeof value>(value);
    //   }
    // }
  }

  // get(key: keyof Compound<T>["_atoms"] | keyof typeof this._compounds) {
  //   const atoms = this._atoms;
  //   if (key in this._atoms) {
  //     return this._atoms[key];
  //   } else {
  //     return this._compounds[key];
  //   }
  // }

  // push<K extends Extract<keyof T, KeyOfType<T, IsntObject<T>>>, V extends T[K]>(
  //   key: K,
  //   value: V
  // ) {
  //   const atomOrCompound = this._tree[key];
  //   if (atomOrCompound instanceof Atom) {
  //     atomOrCompound.push(value);
  //   } else {
  //     atomOrCompound.push(value);
  //   }
  // }
}

type Compound<T extends InType> = _Compound<T> & {
  [k in keyof T]: T[k] extends object
    ? T[k] extends Function
      ? Atom<T[k]>
      : Compound<T[k]>
    : Atom<T[k]>;
};

const Compound: new <T extends InType>(data: T) => Compound<T> =
  _Compound as any;

// export class Compound<T> implements T {
//   constructor(private _value: T) {}

//   get() {}

//   set() {}
// }
//

const comp2 = new Compound({ a: 10, b: 10, c: { c1: 10 }, d: () => 4 });

const a2 = comp2.a;
const c2 = comp2.c;
const d2 = comp2.d;

const a2Val = a2.getValue();
console.log(a2);

// const comp = Compounds.create<{
//   a: number;
//   b: number;
//   c: { c1: number };
// }>({ a: 10, b: 10, c: { c1: 10 } });

// const a = comp.a;
// const c = comp.c;

// const d = comp._atoms;
// const e = comp._compounds;

// d.a.get("c1");

// e.c.get("c1");

// comp.push("a", 11);
export default Compound;
