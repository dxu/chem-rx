import { ArrayAtom, Atom, BaseAtom, ReadOnlyAtom } from "../src/Atom";
import { Signal } from "../src/Signal";

function createSource<T>(initialValue: T) {
  let currentValue = initialValue;
  const listeners = new Set<(value: T) => void>();

  return {
    getValue: () => currentValue,
    next: (value: T) => {
      currentValue = value;
      listeners.forEach((listener) => listener(value));
    },
    subscribe: (listener: (value: T) => void) => {
      listeners.add(listener);
      listener(currentValue);

      return {
        unsubscribe: () => {
          listeners.delete(listener);
        },
      };
    },
  };
}

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

  expect(atom.get(2)).toBe(undefined);
});

test("Test source updates", () => {
  const source = createSource(3);
  const atom = Atom(source);

  expect(atom.value()).toBe(3);

  source.next(4);
  expect(atom.value()).toBe(4);
});

test("Test subscriptions can unsubscribe", () => {
  const atom = Atom(3);
  const callback = jest.fn();
  const subscription = atom.subscribe(callback);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(3);

  atom.next(4);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenCalledWith(4);

  subscription.unsubscribe();
  atom.next(5);
  expect(callback).toHaveBeenCalledTimes(2);
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

test("Test derive subscribes lazily", () => {
  const atom = Atom(1);
  const deriveFn = jest.fn((x: number) => x * 2);
  const derivedAtom = atom.derive(deriveFn);

  expect(deriveFn).toHaveBeenCalledTimes(1);
  expect(derivedAtom.value()).toBe(2);
  expect(deriveFn).toHaveBeenCalledTimes(1);

  atom.next(2);
  expect(deriveFn).toHaveBeenCalledTimes(1);
  expect(derivedAtom.value()).toBe(4);
  expect(deriveFn).toHaveBeenCalledTimes(2);

  const callback = jest.fn();
  const subscription = derivedAtom.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(4);

  atom.next(3);
  expect(deriveFn).toHaveBeenCalledTimes(3);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenCalledWith(6);

  subscription.unsubscribe();
  atom.next(4);
  expect(deriveFn).toHaveBeenCalledTimes(3);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(derivedAtom.value()).toBe(8);
  expect(deriveFn).toHaveBeenCalledTimes(4);
});

test("Test derive dedups by Object.is on parent updates", () => {
  const atom = Atom(1);
  const derivedAtom = atom.derive(() => "same");
  const callback = jest.fn();

  derivedAtom.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith("same");

  // Parent changed, but the derived output is Object.is-equal, so by default
  // the derived atom does NOT re-emit.
  atom.next(2);
  expect(callback).toHaveBeenCalledTimes(1);
});

test("Test derive can opt back into always-notify with equals: () => false", () => {
  const atom = Atom(1);
  const derivedAtom = atom.derive(() => "same", { equals: () => false });
  const callback = jest.fn();

  derivedAtom.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith("same");

  atom.next(2);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenCalledWith("same");
});

test("Test derive content equals dedups across reference-churning parents", () => {
  // Emulates the "rebuild a fresh snapshot every tick" producer: the parent
  // emits a new array reference each update, but the derived slice is
  // content-equal, so a content comparator suppresses re-emits.
  const frame$ = Atom<{ tickets: { id: number }[] }>({ tickets: [{ id: 1 }] });

  const tickets$ = frame$.derive((frame) => frame.tickets, {
    equals: (a, b) =>
      a.length === b.length && a.every((t, i) => t.id === b[i].id),
  });

  const callback = jest.fn();
  tickets$.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);

  // New frame reference, new tickets array reference, identical content.
  frame$.next({ tickets: [{ id: 1 }] });
  expect(callback).toHaveBeenCalledTimes(1);

  // Content actually changes -> re-emit.
  frame$.next({ tickets: [{ id: 2 }] });
  expect(callback).toHaveBeenCalledTimes(2);
});

test("Test base atom dedups by Object.is by default", () => {
  const atom = Atom(1);
  const callback = jest.fn();

  atom.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);

  // Same value -> no re-emit under the Object.is default.
  atom.next(1);
  expect(callback).toHaveBeenCalledTimes(1);

  atom.next(2);
  expect(callback).toHaveBeenCalledTimes(2);
});

test("Test base atom content equals", () => {
  const atom = Atom(
    { x: 1 },
    { equals: (a, b) => a.x === b.x }
  );
  const callback = jest.fn();

  atom.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);

  // New reference, content-equal -> no notify.
  atom.next({ x: 1 });
  expect(callback).toHaveBeenCalledTimes(1);
  expect(atom.value()).toEqual({ x: 1 });

  atom.next({ x: 2 });
  expect(callback).toHaveBeenCalledTimes(2);
  expect(atom.value().x).toBe(2);
});

test("Test select with custom equals dedups by content", () => {
  const atom = Atom<{ a: { id: number }; b: number }>({
    a: { id: 1 },
    b: 1,
  });

  const selectedA = atom.select("a", {
    equals: (prev, next) => prev?.id === next?.id,
  });
  const callback = jest.fn();

  selectedA.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);

  // `a` is replaced with a new reference but same id -> content equals suppresses.
  atom.set("a", { id: 1 });
  expect(callback).toHaveBeenCalledTimes(1);

  atom.set("a", { id: 2 });
  expect(callback).toHaveBeenCalledTimes(2);
});

test("Test select stays fresh without leaking subscriptions", () => {
  const atom = Atom({ a: 1, b: 1 });
  const selectedAtom = atom.select("a");
  const callback = jest.fn();

  atom.set("a", 2);
  expect(selectedAtom.value()).toBe(2);

  const subscription = selectedAtom.subscribe(callback);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(2);

  atom.set("b", 2);
  expect(callback).toHaveBeenCalledTimes(1);

  atom.set("a", 3);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenCalledWith(3);

  subscription.unsubscribe();
  atom.set("a", 4);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(selectedAtom.value()).toBe(4);
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

  const primitiveNum = createSource(4);
  const primitiveNumAtom = Atom<number>(primitiveNum);

  const primitiveStr = createSource("a");
  const primitiveStringAtom = Atom<string>(primitiveStr);

  const arrayObs = createSource(["a"]);
  const arrayObsAtom = Atom<string[]>(arrayObs);

  const objObs = createSource({ a: 1 });
  const objObsAtom2 = Atom(objObs);
  const objObsAtom1 = Atom<{ [id: string]: number }>(objObs);

  const stringData = Atom<{
    [key: string]: { [key: string]: string };
  }>({
    a: { a: "a" },
    b: { b: "b" },
    c: { c: "c" },
  });

  const selectedString: ReadOnlyAtom<{ [key: string]: string }> =
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

  expect(selected instanceof ReadOnlyAtom).toBe(true);
  expect(selected).not.toHaveProperty("set");

  expect(selected instanceof ReadOnlyAtom).toBe(true);
  expect(selected).not.toHaveProperty("set");

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

  const nickname = stacy.get("nickname");
  const education = stacy.get("education");
  expect(stacy.get("nickname")).toBe("stace");
  expect(stacySchool.get("school")).toBe("Penn");
  expect(stacySchool.get("graduation")).toBe(2014);
});

test("Test parent value when updating child objects ", () => {
  const students = Atom<{
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
  const stacy = students.select("stacy");
  const stacySchool = stacy.select("education");

  expect(stacy.get("nickname")).toBe("stace");
  expect(students.get("stacy").nickname).toBe("stace");
  expect(stacySchool.get("graduation")).toBe(2014);

  students.set("stacy", {
    nickname: "spacey",
    education: {
      ...students.get("stacy").education,
      graduation: 2015,
    },
  });

  expect(stacy.get("nickname")).toBe("spacey");
  expect(students.get("stacy").nickname).toBe("spacey");
  expect(stacySchool.get("graduation")).toBe(2015);
});

test("Test nullable object", () => {
  const nestedData = Atom<{
    [key: string]: {
      nickname: string;
      education: {
        school: string;
        graduation: number;
      };
    };
  }>();

  // TODO: This errors
  const newVal = nestedData.select("stacy");

  nestedData.next(undefined);
  const stacy = nestedData.select("stacy");
  const stacySchool = nestedData.select("stacy").select("education");

  expect(stacy.get("nickname")).toBe(undefined);
  expect(stacySchool.get("school")).toBe(undefined);
  expect(stacySchool.value()).toBe(undefined);
  nestedData.next(null);
  expect(nestedData.value()).toBe(null);
});

test("Test select nullable object", () => {
  const seedData = {
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
  };
  const nestedData = Atom<{
    [key: string]: {
      nickname: string;
      education: {
        school: string;
        graduation: number;
      };
    };
  }>();

  // TODO: This errors
  const newVal = nestedData.select("stacy");

  nestedData.next(seedData);
  const stacy = nestedData.select("stacy");
  const stacySchool = nestedData.select("stacy").select("education");

  expect(stacy.get("nickname")).toBe("stace");
  expect(stacySchool.get("school")).toBe("Penn");
  expect(stacySchool.get("graduation")).toBe(2014);
});

describe("SignalWithId", () => {
  it("should broadcast messages to all subscribers when no ID is provided", (done) => {
    const signal = new Signal<string>();
    const mockCallback = jest.fn();

    signal.subscribe(mockCallback);
    signal.subscribe(mockCallback);

    signal.ping("test message");

    setImmediate(() => {
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith("test message");
      done();
    });
  });

  it("should send messages only to subscribers with the specific ID", (done) => {
    const signal = new Signal<string>();
    const mockCallbackWithId = jest.fn();
    const mockCallbackWithoutId = jest.fn();

    signal.subscribe(mockCallbackWithId, "123");
    signal.subscribe(mockCallbackWithoutId);

    signal.ping("ID specific message", "123");

    setImmediate(() => {
      expect(mockCallbackWithId).toHaveBeenCalledTimes(1);
      expect(mockCallbackWithId).toHaveBeenCalledWith("ID specific message");
      expect(mockCallbackWithoutId).toHaveBeenCalledTimes(0);
      done();
    });
  });

  it("should not notify subscribers with different IDs", (done) => {
    const signal = new Signal<string>();
    const mockCallbackId123 = jest.fn();
    const mockCallbackId456 = jest.fn();

    signal.subscribe(mockCallbackId123, "123");
    signal.subscribe(mockCallbackId456, "456");

    signal.ping("Message for 123", "123");

    setImmediate(() => {
      expect(mockCallbackId123).toHaveBeenCalledTimes(1);
      expect(mockCallbackId123).toHaveBeenCalledWith("Message for 123");
      expect(mockCallbackId456).toHaveBeenCalledTimes(0);
      done();
    });
  });

  it("should notify all subscribers, including those with specific IDs, when pinging without an ID", (done) => {
    const signal = new Signal<string>();
    const mockCallback = jest.fn();
    const mockCallbackWithId = jest.fn();

    // Subscribe one callback without ID (for general broadcast)
    signal.subscribe(mockCallback);
    // Subscribe another callback with a specific ID
    signal.subscribe(mockCallbackWithId, "123");

    // Ping without specifying an ID should notify both subscribers
    signal.ping("broadcast message");

    setImmediate(() => {
      // Both callbacks should be called once
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith("broadcast message");
      expect(mockCallbackWithId).toHaveBeenCalledTimes(1);
      expect(mockCallbackWithId).toHaveBeenCalledWith("broadcast message");
      done();
    });
  });
});

/*
 * TODO:
 * - test react hooks
 * - test subscriptions
 */
