import { Atom, ReadOnlyAtom } from "../src/Atom";
import { of, map } from "rxjs";

test("Simple atom values test", () => {
  const atom = new Atom("aweofij");
  expect(atom instanceof Atom).toBe(true);
  expect(atom.getValue()).toBe("aweofij");

  atom.push("apro");

  expect(atom.getValue()).toBe("apro");
});

test("Test transforms", () => {
  const atom = new Atom(3);
  expect(atom instanceof Atom).toBe(true);
  expect(atom.getValue()).toBe(3);

  const transformedAtom = atom.transform(map((x) => x * x));
  expect(transformedAtom instanceof ReadOnlyAtom).toBe(true);
  expect(transformedAtom).not.toHaveProperty("push");

  expect(transformedAtom.getValue()).toBe(9);
});

test("Test combine", () => {
  const normalizedData = new Atom<{ [key: string]: { name: string } }>({
    a: { name: "a" },
    b: { name: "b" },
    c: { name: "c" },
  });
  const ids = new Atom<string[]>(["a", "b", "c"]);
  const combined = Atom.combine(normalizedData, ids);
  expect(combined).not.toHaveProperty("push");

  expect(combined instanceof ReadOnlyAtom).toBe(true);

  const combineTransformed = combined.transform(
    map(([normed, ids]) => {
      return ids.map((id) => normed[id]);
    })
  );

  expect(combineTransformed instanceof ReadOnlyAtom).toBe(true);
  expect(combineTransformed).not.toHaveProperty("push");
  const combinedValue = combineTransformed.getValue();
  expect(combinedValue.length).toBe(3);
  expect(combinedValue[0].name).toBe("a");
  expect(combinedValue[1].name).toBe("b");
  expect(combinedValue[2].name).toBe("c");
});
