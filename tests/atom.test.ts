import { ArrayAtom, Atom, BaseAtom, ReadOnlyAtom } from "../src/Atom";
import { BehaviorSubject, map } from "rxjs";

test("Base Atom values test", () => {
  const atom = Atom("aweofij");
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe("aweofij");

  atom.next("apro");

  expect(atom.value()).toBe("apro");
});

test("Test readonly", () => {
  const atom = Atom({ a: 10 }, true);
  expect(atom instanceof ReadOnlyAtom).toBe(true);
  expect(atom instanceof BaseAtom).toBe(false);
  expect(atom.get("a")).toBe(10);

  expect(atom).not.toHaveProperty("set");
});

test("Object Atom values test", () => {
  const atom = Atom<{ [key: string]: string }>({
    firstKey: "firstValue",
    secondKey: "secondValue",
  });
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()["firstKey"]).toBe("firstValue");

  expect(atom.value()["secondKey"]).toBe("secondValue");
  atom.set("secondKey", "newSecondValue");
  expect(atom.value()["secondKey"]).toBe("newSecondValue");

  expect(atom.value()["thirdKey"]).toBeUndefined();
  expect(atom.value()).not.toHaveProperty("thirdKey");
  atom.set("thirdKey", "thirdValue");
  expect(atom.value()["thirdKey"]).toBe("thirdValue");
});

test("Object Atom get function test", () => {
  const atom = Atom<{ [key: string]: string }>({
    firstKey: "firstValue",
    secondKey: "secondValue",
  });

  expect(atom.get("firey")).toBe(undefined);

  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.get("firstKey")).toBe("firstValue");

  expect(atom.get("secondKey")).toBe("secondValue");
  atom.set("secondKey", "newSecondValue");
  expect(atom.get("secondKey")).toBe("newSecondValue");

  expect(atom.get("thirdKey")).toBeUndefined();
  expect(atom.value()).not.toHaveProperty("thirdKey");
  atom.set("thirdKey", "thirdValue");
  expect(atom.get("thirdKey")).toBe("thirdValue");
});

test("Object Enum Atom test", () => {
  enum testEnum {
    first,
    second,
  }
  const atom = Atom({
    [testEnum.first]: "firstValue",
    [testEnum.second]: "secondValue",
  });

  // this should always be defined as a string
  const kkk = atom.get(testEnum.first);
  kkk.toString();

  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.get(testEnum.first)).toBe("firstValue");

  expect(atom.get(testEnum.second)).toBe("secondValue");
  atom.set(testEnum.second, "newSecondValue");
  expect(atom.get(testEnum.second)).toBe("newSecondValue");
});

test("Optional keys Object Atom test", () => {
  enum testEnum {
    first,
    second,
  }
  const atom = Atom<{
    [testEnum.first]?: string;
    [testEnum.second]?: string;
  }>({
    [testEnum.first]: "firstValue",
    [testEnum.second]: "secondValue",
  });

  const kkk = atom.get(testEnum.first);
  // @ts-expect-error this should be possibly undefined
  kkk.toString();

  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.get(testEnum.first)).toBe("firstValue");

  expect(atom.get(testEnum.second)).toBe("secondValue");
  atom.set(testEnum.second, "newSecondValue");
  expect(atom.get(testEnum.second)).toBe("newSecondValue");
});

test("Uninitialized Object Enum Atom test", () => {
  enum testEnum {
    first,
    second,
  }
  const seedValue = {
    [testEnum.first]: "firstValue",
    [testEnum.second]: "secondValue",
  };
  const atom = Atom<{
    [testEnum.first]: string;
    [testEnum.second]: string;
  }>();

  const kkk = atom.get(testEnum.first);
  // this should be possibly undefined at this point,
  // so there should lbe type safety here
  expect(() => {
    // @ts-expect-error this should throw a type error
    // because it should be possibly undefined
    kkk.toString();
  }).toThrow();

  // atom.push({
  //   [testEnum.first]: "firstValue",
  //   [testEnum.second]: "secondValue",
  // });
  expect(atom instanceof BaseAtom).toBe(true);

  expect(atom.get(testEnum.first)).toBe(undefined);
  expect(atom.get(testEnum.second)).toBe(undefined);
  atom.next(seedValue);
  expect(atom.get(testEnum.first)).toBe("firstValue");

  expect(atom.get(testEnum.second)).toBe("secondValue");
  atom.set(testEnum.second, "newSecondValue");
  expect(atom.get(testEnum.second)).toBe("newSecondValue");
});

test("Array Atom values test", () => {
  const atom = Atom<string[]>(["first"]);

  expect(atom.get(10)).toBe(undefined);

  // this is not allowed
  // atom.push(1);
  expect(atom instanceof ArrayAtom).toBe(true);
  expect(atom.value().length).toBe(1);
  expect(atom.value()[0]).toBe("first");

  atom.push("second");
  expect(atom.value().length).toBe(2);
  expect(atom.value()[1]).toBe("second");
});

test("Array Atom get index test", () => {
  const atom = Atom<string[]>(["first"]);

  expect(atom instanceof ArrayAtom).toBe(true);
  expect(atom.value().length).toBe(1);
  expect(atom.get(0)).toBe("first");

  atom.push("second");
  expect(atom.value().length).toBe(2);
  expect(atom.get(1)).toBe("second");
});

test("Test native pipe", () => {
  const atom = Atom(3);
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe(3);

  const derivedAtom = atom.pipe(map((x) => x * x));
  expect(derivedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(derivedAtom).not.toHaveProperty("set");

  expect(derivedAtom.value()).toBe(9);
});

test("Test derive", () => {
  const atom = Atom(3);
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe(3);

  const derivedAtom = atom.derive((x) => x * x);
  expect(derivedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(derivedAtom).not.toHaveProperty("set");

  expect(derivedAtom.value()).toBe(9);
});

test("Test derive update", () => {
  const atom = Atom(3);
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe(3);

  const derivedAtom = atom.derive((x) => x * x);
  expect(derivedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(derivedAtom).not.toHaveProperty("set");

  expect(derivedAtom.value()).toBe(9);

  atom.next(4);
  expect(derivedAtom.value()).toBe(16);
});

test("Test combine", () => {
  const normalizedData = Atom<{ [key: string]: { name: string } }>({
    a: { name: "a" },
    b: { name: "b" },
    c: { name: "c" },
  });
  const ids = Atom<string[]>(["a", "b", "c"]);
  const combined = Atom.combine(normalizedData, ids).derive(([normed, ids]) => {
    return ids.map((id) => normed[id]);
  });
  expect(combined).not.toHaveProperty("set");

  expect(combined instanceof ReadOnlyAtom).toBe(true);

  expect(combined instanceof ReadOnlyAtom).toBe(true);
  expect(combined).not.toHaveProperty("set");
  const combinedValue = combined.value();
  expect(combinedValue.length).toBe(3);
  expect(combinedValue[0].name).toBe("a");
  expect(combinedValue[1].name).toBe("b");
  expect(combinedValue[2].name).toBe("c");
});

test("Test combine example", () => {
  const pets$ = Atom<{ [name: string]: { type: "dog" | "cat"; age: number } }>({
    spot: { type: "dog", age: 5 },
    fido: { type: "dog", age: 3 },
    tabby: { type: "cat", age: 12 },
  });

  const people$ = Atom<{ [name: string]: { pets: string[] } }>({
    fred: { pets: [] },
    mary: { pets: ["spot", "fido"] },
    cam: { pets: ["tabby"] },
  });

  const mary$ = Atom.combine(pets$, people$.select("mary")).derive(
    ([pets, mary]) => {
      return {
        ...mary,
        pets: mary.pets.map((petName) => pets[petName]),
      };
    }
  );
  {
    mary: {
      pets: [
        {
          name: "spot",
          type: "dog",
          age: 5,
        },
      ];
    }
  }

  const a: number[] = [1, 3, 4, 5];
  const b = a[10];

  const pets = mary$.select("pets").get(0);
  expect(mary$.select("pets").value().length).toBe(2);
  expect(mary$.select("pets").get(0)).toHaveProperty("type");
  expect(mary$.select("pets").get(0)).toHaveProperty("age");
  expect(mary$.select("pets").get(0).type).toBe("dog");
  expect(mary$.select("pets").get(0).age).toBe(5);
  expect(mary$.select("pets").get(1)).toHaveProperty("type");
  expect(mary$.select("pets").get(1)).toHaveProperty("age");
  expect(mary$.select("pets").get(1).type).toBe("dog");
  expect(mary$.select("pets").get(1).age).toBe(3);
});

test("Test select (simple)", () => {
  enum TEST_ENUM {
    a = "weoifj",
    b = "oh",
    c = "ohoij",
  }

  // test types
  const enumTest = Atom(TEST_ENUM.a);

  const arrayTest = Atom([1, 2, 34]);
  const arrayTest2 = Atom([{ a: "jwoi" }, 2, 34]);

  const arrayAtom = Atom<{ [key: string]: number[] }>({
    a: [0, 1, 2],
    b: [1, 3, 4],
    c: [5, 3, 4],
  });

  const primitiveNum = new BehaviorSubject(4);
  const primitiveNumAtom = Atom<number>(primitiveNum);

  const primitiveStr = new BehaviorSubject("a");
  const primitiveStringAtom = Atom<string>(primitiveStr);

  const arrayObs = new BehaviorSubject(["a"]);
  const arrayObsAtom = Atom<string[]>(arrayObs);

  const objObs = new BehaviorSubject({ a: 1 });
  const objObsAtom2 = Atom(objObs);
  const objObsAtom1 = Atom<{ [id: string]: number }>(objObs);

  const stringData = Atom<{
    [key: string]: { [key: string]: string };
  }>({
    a: { a: "a" },
    b: { b: "b" },
    c: { c: "c" },
  });

  const selectedString: BaseAtom<{ [key: string]: string }> =
    stringData.select("b");

  const normalizedOptionalStringData = Atom<{
    [key: string]: { [key in "a" | "b" | "c"]?: string };
  }>({
    a: { a: "a" },
    b: { b: "b" },
    c: { c: "c" },
  });

  const selectedOptionalString = normalizedOptionalStringData.select("b");

  const normalizedEnumData = Atom<{
    [key: string]: { [key in TEST_ENUM]?: string };
  }>({
    a: { [TEST_ENUM.a]: "a" },
    b: { [TEST_ENUM.b]: "b" },
    c: { [TEST_ENUM.c]: "c" },
  });
  const selected = normalizedEnumData.select("b");
  const selected2 = normalizedEnumData.select("a");
  const selectedArray = arrayAtom.select("b");

  // THIS IS HTE LAST ONE THT STILL OES NOTWOK
  const selectedArr = arrayAtom.select("a");

  const sel3 = objObsAtom2.select("a");

  expect(selected instanceof BaseAtom).toBe(true);

  expect(selected instanceof BaseAtom).toBe(true);

  // const combined = Atom.combine(normalizedData, ids).derive(([normed, ids]) => {
  //   return ids.map((id) => normed[id]);
  // });
  //
  // expect(combined).not.toHaveProperty("push");
  //
  // expect(combined instanceof ReadOnlyAtom).toBe(true);
  //
  // expect(combined instanceof ReadOnlyAtom).toBe(true);
  // expect(combined).not.toHaveProperty("push");
  // const combinedValue = combined.value();
  // expect(combinedValue.length).toBe(3);
  // expect(combinedValue[0].name).toBe("a");
  // expect(combinedValue[1].name).toBe("b");
  // expect(combinedValue[2].name).toBe("c");
});

test("Test select (nested objects)", () => {
  const nestedData = Atom<{
    [key: string]: {
      nickname: string;
      education: {
        school: string;
        graduation: number;
      };
    };
  }>({
    stacy: {
      nickname: "stace",
      education: {
        school: "Penn",
        graduation: 2014,
      },
    },
    annie: {
      nickname: "ann",
      education: {
        school: "Brown",
        graduation: 2015,
      },
    },
    prabhu: {
      nickname: "prab",
      education: {
        school: "MIT",
        graduation: 2016,
      },
    },
  });
  const stacy = nestedData.select("stacy");
  const stacySchool = nestedData.select("stacy").select("education");

  expect(stacy.get("nickname")).toBe("stace");
  expect(stacySchool.get("school")).toBe("Penn");
  expect(stacySchool.get("graduation")).toBe(2014);
});

/*
 * TODO:
 * - test react hooks
 * - test subscriptions
 */
