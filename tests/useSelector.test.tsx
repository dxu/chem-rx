/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { Atom } from "../src/Atom";
import { useSelector } from "../src/useSelector";

afterEach(cleanup);

test("useSelector renders the selected slice and re-renders on parent updates", () => {
  const atom = Atom({ count: 0, name: "a" });

  function Display() {
    const count = useSelector(atom, (s) => s.count);
    return <span data-testid="count">{count}</span>;
  }

  const { getByTestId } = render(<Display />);
  expect(getByTestId("count").textContent).toBe("0");

  act(() => {
    atom.next({ count: 5, name: "a" });
  });
  expect(getByTestId("count").textContent).toBe("5");
});

test("useSelector does not re-render when an unrelated slice changes", () => {
  const atom = Atom({ count: 0, name: "a" });
  let renderCount = 0;

  function Display() {
    renderCount++;
    const count = useSelector(atom, (s) => s.count);
    return <span data-testid="count">{count}</span>;
  }

  render(<Display />);
  expect(renderCount).toBe(1);

  act(() => {
    atom.next({ count: 0, name: "changed" });
  });
  expect(renderCount).toBe(1);
});

test("useSelector dedups by content equals across reference-churning parents", () => {
  const atom = Atom({ items: [1, 2, 3], tick: 0 });
  let renderCount = 0;
  const itemsEqual = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  function Display() {
    renderCount++;
    const items = useSelector(atom, (s) => s.items, itemsEqual);
    return <span data-testid="items">{items.join(",")}</span>;
  }

  const { getByTestId } = render(<Display />);
  expect(renderCount).toBe(1);
  expect(getByTestId("items").textContent).toBe("1,2,3");

  for (let tick = 1; tick <= 5; tick++) {
    act(() => {
      atom.next({ items: [1, 2, 3], tick });
    });
  }
  expect(renderCount).toBe(1);

  act(() => {
    atom.next({ items: [1, 2, 4], tick: 6 });
  });
  expect(renderCount).toBe(2);
  expect(getByTestId("items").textContent).toBe("1,2,4");
});

test("useSelector reflects a prop-dependent selector on the next render", () => {
  const atom = Atom<Record<string, number>>({ a: 1, b: 2 });

  function Display({ field }: { field: string }) {
    const value = useSelector(atom, (s) => s[field]);
    return <span data-testid="value">{value}</span>;
  }

  const { getByTestId, rerender } = render(<Display field="a" />);
  expect(getByTestId("value").textContent).toBe("1");

  rerender(<Display field="b" />);
  expect(getByTestId("value").textContent).toBe("2");
});

test("useSelector unsubscribes on unmount", () => {
  const atom = Atom({ count: 0 });
  let renderCount = 0;

  function Display() {
    renderCount++;
    const count = useSelector(atom, (s) => s.count);
    return <span>{count}</span>;
  }

  const { unmount } = render(<Display />);
  expect(renderCount).toBe(1);

  unmount();
  act(() => {
    atom.next({ count: 99 });
  });
  expect(renderCount).toBe(1);
});
