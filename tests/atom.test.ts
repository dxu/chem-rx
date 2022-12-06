import { Atom } from "../src/Atom";
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

  expect(transformedAtom.getValue()).toBe(9);
});
