export class ReadOnlyClass<T> {
  value: T;
  constructor(_value: T | Wrapper<T>) {
    if (isWrapper(_value)) {
    } else {
      this.value = _value;
    }
  }
}

export class ArrayClass<T> extends ReadOnlyClass<T[]> {}

export class BaseClass<T> extends ReadOnlyClass<T> {}

export class ObjectClass<
  K extends string | number | symbol,
  V,
  T extends {
    [key in K]: V;
  } = {
    [key in K]: V;
  }
> extends ReadOnlyClass<T> {
  select(key: K) {
    const newObs = new Wrapper(this.value[key]);
    return Class(newObs);
  }
}

export class Wrapper<T> {
  val: T;
  constructor(val: T) {
    this.val = val;
  }
  getValue(): T {
    return this.val;
  }
}

function isWrapper(val: any): val is Wrapper<unknown> {
  if (val instanceof Wrapper) {
    return true;
  } else {
    return false;
  }
}

// wrapper type (primitive)
export function Class<T>(
  value: T extends { [key: string]: infer V } | any[] ? never : Wrapper<T>
): BaseClass<T>;

// wrapper<array> type
export function Class<T extends any[]>(
  value: Wrapper<T>
): ArrayClass<T[number]>;

// wrapper<object> type
export function Class<T>(
  value: T extends {
    [key in keyof T]: infer V;
  }
    ? Wrapper<T>
    : never
): ObjectClass<keyof T, T[keyof T], T>;

// array type
export function Class<T extends any[]>(value: T): ArrayClass<T[number]>;

// object type
export function Class<T extends { [key: string]: T[keyof T] }>(
  value: T
): ObjectClass<keyof T, T[keyof T]>;

// primitive type
export function Class<T>(value: T): BaseClass<T>;

// function definition
export function Class<T>(_value: T) {
  let cls;
  if (Array.isArray(_value)) {
    cls = new ArrayClass<T>(_value); // For arrays
  } else if (typeof _value === "object" && _value !== null) {
    cls = new ObjectClass<keyof T, T[keyof T]>(_value); // For objects
  } else {
    cls = new BaseClass(_value); // For other types
  }
  return cls;
}

const a = Class<{ [key: string]: { name: string } }>({
  a: { name: "a" },
  b: { name: "b" },
  c: { name: "c" },
});

// this works
const numbWrapper = new Wrapper(1);
const numbClass = Class(numbWrapper); // BaseClass<number>

// this works
const arrayWrapper = new Wrapper(["a"]);
const arrayWrapperClass = Class<string[]>(arrayWrapper); // ArrayClass<number>

// this works
const objObs = new Wrapper({ a: 1 });
const objObsClass2 = Class(objObs); // ObjectClass<'a', number, { a: number }>

// this does not work.
const selectedItem = a.select("b"); // BaseClass<{name: string}>

/*
 * Why is this of type:
 * const selectedItem: BaseClass<{
 *   name: string;
 * }>
 *
 * instead of:
 * const selectedItem: BaseClass<ObjectClass<'name', string>
 */
