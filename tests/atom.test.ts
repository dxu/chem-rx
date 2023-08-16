import {
  ArrayAtom,
  Atom,
  BaseAtom,
  ObjectAtom,
  ReadOnlyAtom,
} from "../src/Atom";
import { map, of } from "rxjs";

test("Base Atom values test", () => {
  const atom = Atom("aweofij");
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe("aweofij");

  atom.next("apro");

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
  const atom = Atom(["first"]);
  expect(atom instanceof ArrayAtom).toBe(true);
  expect(atom.value().length).toBe(1);
  expect(atom.value()[0]).toBe("first");

  atom.push("second");
  expect(atom.value().length).toBe(2);
  expect(atom.value()[1]).toBe("second");
});

test("Array Atom get index test", () => {
  const atom = Atom(["first"]);
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

  const transformedAtom = atom.pipe(map((x) => x * x));
  expect(transformedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(transformedAtom).not.toHaveProperty("push");

  expect(transformedAtom.value()).toBe(9);
});

test("Test transform", () => {
  const atom = Atom(3);
  expect(atom instanceof BaseAtom).toBe(true);
  expect(atom.value()).toBe(3);

  const transformedAtom = atom.transform((x) => x * x);
  expect(transformedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(transformedAtom).not.toHaveProperty("push");

  expect(transformedAtom.value()).toBe(9);
});

test("Test combine", () => {
  const normalizedData = Atom<{ [key: string]: { name: string } }>({
    a: { name: "a" },
    b: { name: "b" },
    c: { name: "c" },
  });
  const ids = Atom<string[]>(["a", "b", "c"]);
  const combined = Atom.combine(normalizedData, ids).transform(
    ([normed, ids]) => {
      return ids.map((id) => normed[id]);
    }
  );
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
