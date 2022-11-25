import Atom from "../src/Atom";

test("Simple atom values test", () => {
  const atom = new Atom("aweofij");
  expect(atom instanceof Atom).toBe(true);
  expect(atom.getValue()).toBe("aweofij");

  atom.push("apro");

  expect(atom.getValue()).toBe("apro");
});
