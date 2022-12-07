// Helper types if needed

class GenericClass<T> {}
export type GetGenericType<C extends GenericClass<any>> =
  C extends GenericClass<infer T> ? T : unknown;

export type KeyOfValueType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type IsObject<T> = T extends object ? T : never;
export type IsntObject<T> = T extends object ? never : T;
export type IsntFunction<T> = T extends Function ? never : T;

export type OmitKeysWithNeverValues<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

export function assertUnreachable(_value?: never): never {
  throw new Error("Statement should be unreachable");
}

// https://github.com/microsoft/TypeScript/issues/32164

type ValidFunction<
  Arguments extends unknown[],
  ReturnType
> = unknown[] extends Arguments
  ? unknown extends ReturnType
    ? never
    : (...args: Arguments) => ReturnType
  : (...args: Arguments) => ReturnType;

export type Overloads<T extends (...args: unknown[]) => unknown> = T extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
  (...args: infer A3): infer R3;
  (...args: infer A4): infer R4;
  (...args: infer A5): infer R5;
  (...args: infer A6): infer R6;
  (...args: infer A7): infer R7;
  (...args: infer A8): infer R8;
  (...args: infer A9): infer R9;
  (...args: infer A10): infer R10;
  (...args: infer A11): infer R11;
  (...args: infer A12): infer R12;
}
  ?
      | ValidFunction<A1, R1>
      | ValidFunction<A2, R2>
      | ValidFunction<A3, R3>
      | ValidFunction<A4, R4>
      | ValidFunction<A5, R5>
      | ValidFunction<A6, R6>
      | ValidFunction<A7, R7>
      | ValidFunction<A8, R8>
      | ValidFunction<A9, R9>
      | ValidFunction<A10, R10>
      | ValidFunction<A11, R11>
      | ValidFunction<A12, R12>
  : never;

export type OverloadedParameters<T extends (...args: any[]) => unknown> =
  Parameters<Overloads<T>>;
export type OverloadedReturnType<T extends (...args: any[]) => unknown> =
  ReturnType<Overloads<T>>;
