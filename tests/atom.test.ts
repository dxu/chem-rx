import {
  ArrayAtom,
  Atom,
  BaseAtom,
  ObjectAtom,
  ReadOnlyAtom,
} from "../src/Atom";
import { BehaviorSubject, map, of } from "rxjs";

test("Base Atom values test", () => {
  const atom = Atom("aweofij");
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe("aweofij");

  atom.set("apro");

  expect(atom.value()).toBe("apro");
});

test("Object Atom values test", () => {
  const atom = Atom<{ [key: string]: string }>({
    firstKey: "firstValue",
    secondKey: "secondValue",
  });
  expect(atom instanceof ObjectAtom).toBe(true);
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
  expect(atom instanceof ObjectAtom).toBe(true);
  expect(atom.get("firstKey")).toBe("firstValue");

  expect(atom.get("secondKey")).toBe("secondValue");
  atom.set("secondKey", "newSecondValue");
  expect(atom.get("secondKey")).toBe("newSecondValue");

  expect(atom.get("thirdKey")).toBeUndefined();
  expect(atom.value()).not.toHaveProperty("thirdKey");
  atom.set("thirdKey", "thirdValue");
  expect(atom.get("thirdKey")).toBe("thirdValue");
});

test("Array Atom values test", () => {
  const atom = Atom<string[]>(["first"]);
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
  expect(derivedAtom).not.toHaveProperty("push");

  expect(derivedAtom.value()).toBe(9);
});

test("Test derive", () => {
  const atom = Atom(3);
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe(3);

  const derivedAtom = atom.derive((x) => x * x);
  expect(derivedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(derivedAtom).not.toHaveProperty("push");

  expect(derivedAtom.value()).toBe(9);
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
  expect(combined).not.toHaveProperty("push");

  expect(combined instanceof ReadOnlyAtom).toBe(true);

  expect(combined instanceof ReadOnlyAtom).toBe(true);
  expect(combined).not.toHaveProperty("push");
  const combinedValue = combined.value();
  expect(combinedValue.length).toBe(3);
  expect(combinedValue[0].name).toBe("a");
  expect(combinedValue[1].name).toBe("b");
  expect(combinedValue[2].name).toBe("c");
});

test("Test select (simple)", () => {
  enum TEST_ENUM {
    a = "weoifj",
    b = "oh",
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

  const normalizedData = Atom<{ [key: string]: { [key: string]: string } }>({
    a: { name: "a" },
    b: { name: "b" },
    c: { name: "c" },
  });
  const selected = normalizedData.select("b");
  const selected2 = normalizedData.select("a");
  const selectedArray = arrayAtom.select("b");

  // THIS IS HTE LAST ONE THT STILL OES NOTWOK
  const selectedArr = arrayAtom.select("a");

  const sel3 = objObsAtom2.select("a");

  expect(selected instanceof ObjectAtom).toBe(true);

  expect(selected instanceof ObjectAtom).toBe(true);

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
