import { BehaviorSubject } from "rxjs";
import { Atom } from "./Atom";

export class Compound<T> {
  static create<T extends Object>(base: T) {
    return new Compound<T>(base) as Compound<T> & {
      [k in keyof T]: T[k] extends object ? Compound<T[k]> : Atom<T[k]>;
    };
  }

  constructor(base: T) {
    // Object.assign(this, base);
  }
}

// export class Compound<T> implements T {
//   constructor(private _value: T) {}

//   get() {}

//   set() {}
// }
//

const comp = Compound.create({ a: 10, b: 10, c: { c1: 10 } });

const a = comp.a;
const c = comp.c;
