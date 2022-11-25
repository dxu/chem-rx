// export type KeyOfType<O, T> = {
//   [K in keyof O]: O[K] extends T ? K : never;
// }[keyof O];

export type KeyOfType<T, V> = {
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
