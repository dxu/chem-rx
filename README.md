# chem-rx

`chem-rx` provides a small atomic state management layer focused on simplicity.
Useable with or without React!

> **Breaking change (unreleased):** atoms now decide whether to notify
> subscribers using an equality comparator that **defaults to `Object.is`**.
> Two behaviors changed: a base atom no longer re-emits when you set an
> `Object.is`-equal value, and `derive` no longer re-emits when its computed
> output is `Object.is`-equal (it previously always re-emitted on every parent
> update). To restore the old always-notify behavior, pass `equals: () => false`.
> See [Equality & change detection](#equality--change-detection).

## Atom

`chem-rx` is an atomic approach to state management, similar to
[jotai](https://github.com/pmndrs/jotai) or
[Recoil](https://github.com/facebookexperimental/Recoil).

Atoms are state containers that take any value - object, array, or primitive. You can create them by simply passing a value into `Atom`.

```
import { Atom } from 'chem-rx'

const data$: BaseAtom = Atom('hello')
```

## Primitives

There are five primitives in `chem-rx`:

1. BaseAtom
2. ArrayAtom
3. NullableAtom
4. ReadOnlyAtom
5. Signal

Their traits are self-explanatory, and they are generally automatically created for you, depending on how you create your Atom.

In its simplest form, `chem-rx` can be used with BaseAtom and ArrayAtom, giving you a primitive for managing atomic data, but can be composed and split in numerous ways for more advanced use cases.

### BaseAtom & ArrayAtom

`BaseAtom` is the fundamental type that everything else extends. It contains the primary functionality for interacting with your Atom data.

`ArrayAtom` is exactly as it sounds - an atom that holds an array of values (as opposed to an individual)

`Atom` will automatically return you an ArrayAtom or BaseAtom based on what you pass it.

```
const number$: BaseAtom = Atom(0)
const string$: BaseAtom<string> = Atom('hello')

// You can skip the type hint on your variable.
// This returns a `BaseAtom<{hello: string, world: string}>`
const object$ = Atom({ 'hello': 'world', 'world': 'hello' })

// You can enforce a generic type on your atoms
// Note the ArrayAtom's generic type holds the item type held in the array.
const array$: ArrayAtom<string> = Atom<string[]>(['hello', 'world'])
```

### Getting & setting values

`BaseAtom` offers simple helpers to access and modify your data.

```
// Primitive values (BaseAtom)
number$.next(2)
number$.value()  // 2


// Object values (BaseAtom)
object$.get('hello')  // 'world'
object$.get('fakeKey')  // undefined
object$.set('hello', 'werld')
object$.get('hello')  // 'werld'


// ArrayAtom
array$.push('!')
array$.value()  // ['hello', 'world', '!']
array$.get(2)  // '!'
array$.get(3)  // undefined
```

## Composability & ReadOnlyAtom's

Atoms are intended to be easily composed, split, and transformed to handle complex data needs through a simple API.

### Selecting Atoms (read-only)

You can `select` keys on `BaseAtom` and `ArrayAtom` that returns an Atom that wrap the values
at that key. Any time the original atom changes, your selected atom will automatically update with the latest value.

This can be especially useful for working with different parts of nested Array and Object atoms.

Atoms created with `select` are **read-only** (`ReadOnlyAtom`). This prevents you from modifying original values that the atom was created from.
Selected atoms are lazy: calling `value()` reads the latest parent snapshot, and subscribing to a selected atom listens to the parent only while that selected atom has active subscribers.

By default a selected atom notifies subscribers only when the selected value changes by `Object.is`. Pass `{ equals }` to dedup by content instead (see [Equality & change detection](#equality--change-detection)):

```
const stacy = students.select("stacy", {
  equals: (a, b) => a?.nickname === b?.nickname,
});
```

```
const students = Atom({
  stacy: {
    nickname: "stace",
    education: {
      school: "Penn",
      graduation: 2014,
    },
  },
});

// ReadOnlyAtom<{nickname: string, education: ...}>
const stacy = students.select("stacy");
const stacySchool = stacy.select("education");

stacy.get('nickname')  // 'stace'
stacySchool.get('graduation')  // 2014

students.set("stacy", {
  nickname: "spacey",
  education: {
    ...students.get("stacy").education,
    graduation: 2015,
  },
});

stacy.get('nickname')  // 'spacey'
stacySchool.get('graduation')  // 2015

// ERR: Property 'set' does not exist on type ReadOnlyAtom
stacy.set('nickname', 'stacy')

```

### Derived Atoms (read-only)

You can derive new Atoms from any existing atoms. Any time the original atoms
change, your derived atoms will automatically update with new values.

Every derived atom is **read-only**. This prevents you from overriding the
derived output value, since it is automatically derived from another input.
Like selected atoms, derived atoms are lazy and only stay subscribed to their
inputs while they have active subscribers.

```
const atom$ = Atom(3);

const squared$ = atom$.derive((x) => x * x);

squared$.value()  // "9"

atom$.next(4)

squared$.value()  // "16"

// ERR: Property 'set' does not exist on type ReadOnlyAtom
squared$.set(2)
```

By default, a derived atom notifies subscribers only when its computed output changes by `Object.is`. When `deriveFn` returns a fresh object/array each time (so `Object.is` never matches), pass `{ equals }` to dedup by content (see [Equality & change detection](#equality--change-detection)):

```
const items$ = data$.derive((data) => data.items, {
  equals: (a, b) => a.length === b.length && a.every((x, i) => x.id === b[i].id),
});
```

You can optionally enforce `readOnly` on an atom at creation time if needed. The
second argument also accepts an options object (`{ readOnly?, equals? }`):

```
const atom$ = Atom(3, true);
// equivalent:
const atom2$ = Atom(3, { readOnly: true });

// ERR: Property 'set' does not exist on type ReadOnlyAtom
atom$.set(2)

// content-based dedup on a writable atom
const point$ = Atom({ x: 0, y: 0 }, { equals: (a, b) => a.x === b.x && a.y === b.y });
```

### Combining Atoms

Multiple atoms can also be **combined** to create brand new atoms.

`combine` produces a fresh array snapshot on every input change, so it re-emits on
every update. To dedup by content, chain a `derive(fn, { equals })` onto it.

Here's an example of joining a set of normalized data models

```
const pets$ = Atom<{ [name: string]: { type: "dog" | "cat"; age: number } }>({
  spot: {name: 'spot', type: "dog", age: 5 },
  tabby: {name: 'tabby', type: "cat", age: 12 },
});

const people$ = Atom<{ [name: string]: { pets: string[] } }>({
  mary: { pets: ["spot"] },
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

console.log(mary$.select('pets').value())
/*
 * [{
 *   name: "spot",
 *   type: "dog",
 *   age: 5,
 * }]
 */
```

## Pub/Sub

### Subscribing to updates

Atoms emit values each time they change. You can subscribe callbacks to them
to act on updates.

Subscribing fires your callback **immediately** with the atom's current value,
then again on each subsequent change. "Change" is defined by the atom's equality
comparator, which **defaults to `Object.is`** — so setting an `Object.is`-equal
value is deduped and will not re-notify (see
[Equality & change detection](#equality--change-detection)).

```
const atom$ = Atom(3);

const subscription = atom$.subscribe(val => {
    console.log("Received value: ", val)
})
// immediately logs "Received value: 3"

atom$.next(3)  // deduped: Object.is-equal, no log
atom$.next(4)  // "Received value: 4"

// Unsubscribe to clean up
subscription.unsubscribe();
```

### Equality & change detection

Every atom notifies its subscribers only when its value **changes**, and what
counts as a "change" is decided by an `equals(previous, next) => boolean`
comparator. When `equals` returns `true`, the atom still updates `value()` but
does **not** ping subscribers.

The default comparator for every atom — `Atom`, `derive`, `select`, and
`combine` — is `Object.is`:

- For primitives (`number`, `string`, `boolean`, ...) that's value equality.
- For objects and arrays it's **reference identity** — a brand-new object/array
  is always treated as "changed," even if its contents are identical.

#### Reference vs content equality

Reference identity is the right default, but it breaks down when a producer
rebuilds fresh objects/arrays on every update (e.g. a game loop that rebuilds
its whole scene snapshot each tick). Every snapshot is a new reference, so
`Object.is` reports "changed" every tick and subscribers fire constantly even
when nothing meaningful changed.

Supply a **content** comparator to fix this:

```
const tickets$ = frame$.derive(selectTickets, {
  equals: (a, b) =>
    a.length === b.length &&
    a.every((t, i) => t.id === b[i].id && t.status === b[i].status),
});
// re-emits only when ticket content actually changes
```

#### Where you can pass `equals`

```
Atom(value, { equals })          // base atoms
parent.derive(fn, { equals })    // derived atoms
parent.select(key, { equals })   // selected atoms
```

To force the old "notify on every update" behavior, pass `equals: () => false`.

#### You supply the comparator

`chem-rx` intentionally ships **no** `shallowEqual`/`deepEqual` helpers. A
generic shallow equal won't reach into nested or rebuilt structures (the tickets
example above would still see new element references), and a generic deep equal
is a correctness trap (`NaN`, `Date`, `Map`/`Set`, cycles, ...). Write the cheap
field comparison your data actually needs, or stamp a revision/version number on
the data and compare that.

#### React and beyond

Because equality lives on the atom (not in a React hook), content dedup benefits
**every** subscriber — React components, effects, and other derived atoms alike,
not just renders. React's `useSyncExternalStore` already bails out on
`Object.is`-equal snapshots; an atom-level `equals` is what gives you the
additional **content** dedup.

> Advanced tip: a memoizing selector that returns the _previous_ reference when
> the content is equal restores referential stability, so all downstream
> consumers can dedup off plain `Object.is` after a single comparison.

### Signals

Sometimes, all you want is something to ping you when there's an update. Signals
are stateless transceivers for signaling updates.

```
const signal$ = new Signal();

const subscription = signal$.subscribe(() => {
    console.log("PONG")
})

signal$.ping()  // "PONG"

// Unsubscribe to clean up
subscription.unsubscribe();
```

Signals can also send values if needed.

```
const signal$ = new Signal();

const subscription = signal$.subscribe((value) => {
    console.log("PONGED: ", value)
})

signal$.ping("hello")
// "PONGED: hello"

// Unsubscribe to clean up
subscription.unsubscribe();
```

You can selectively subscribe to Signals, and selectively ping subscribers by ID.

```
    const signal = new Signal<string>();
    signal.subscribe(mockCallbackId123, "123");
    signal.subscribe(mockCallbackId456, "456");
    signal.ping("Message for 123", "123");
```

## Use with React

The root package is headless. React hooks are available from `chem-rx/react`.

### useAtom

`useAtom` automatically updates with new values in your react components.

If you want to update your atoms, you can simply call the same `next`, `set`, or `push` (ArrayAtom) methods you would typically use outside
of react.

```
import { Atom } from 'chem-rx'
import { useAtom } from 'chem-rx/react'

const count$ = Atom(0)

function Counter() {
  const count = useAtom(count$)
  return (
    <h1>
      {count}
        <button onClick={() => count$.next(count$.value() + 1)}>one up</button> ...
```

Remember that you can mix and match for any of your needs

### useSelector

With `useSelector` you can derive any value from an atom with a selector function, and
have your component live update — re-rendering only when the selected value changes.

```
import { Atom } from 'chem-rx'
import { useSelector } from 'chem-rx/react'

const count$ = Atom({ inner: 0 })

function Counter() {
  const count = useSelector(count$, (s) => s.inner)
  return (
    <h1>
      {count}
        <button onClick={() => count$.set('inner', count + 2)}>one up</button> ...
```

`useSelector` takes an optional `equals` comparator (defaulting to `Object.is`) so you
can dedupe re-renders by content. This is the React-side counterpart to the atom-level
`equals` option described in [Equality & change detection](#equality--change-detection):
even if the parent atom rebuilds its value (and references) on every update, the
component only re-renders when the selected slice is *not* equal.

```
const frame$ = Atom(initialFrame)

const itemsEqual = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i])

function ItemList() {
  // re-renders only when `items` changes by content, not every frame
  const items = useSelector(frame$, (f) => f.items, itemsEqual)
  return <ul>{items.map((it) => <li key={it.id}>{it.label}</li>)}</ul>
}
```

### hydrateAtoms

With SSR, your atoms will likely need to be properly hydrated to prevent
server/client mismatches. You can use `hydrateAtoms` as a simple solution for
seeding your client-side Atoms with the correct data.

NOTE: **`hydrateAtoms` caches values and only runs on the initial load by default**, to prevent re-hydration when client-side only changes are made to the component.

```
import { Atom, hydrateAtoms } from 'chem-rx'
import { useAtom } from 'chem-rx/react'

const count$ = Atom(0)
const CounterPage = ({ countFromServer }) => {
  hydrateAtoms([[count$, countFromServer]])
  const count = useAtom(count$)
  // count would be the value of `countFromServer`, not 0.

  /*
   * ... other code
   */

   useEffect(() => {
     // This is safe, because hydrateAtoms runs once by default
     count$.next(10)
   }, [otherDeps])

}
```

#### `force` hydrateAtoms

If you want to force re-hydration, you can optionally pass in a `{force: true}` (for example - you have a top level page wrapper that receives server data )

```
    export default function CasesPage({ cases }: Props) {
      // force it to rehydrate with newest value every time this client page is loaded
      hydrateAtoms([[cases$, cases]], { force: true });
      const router = useRouter();
      return (
        <>
          <div className="flex justify-between w-full mb-4 px-6 pt-8">
            <h1 className="text-2xl">Cases</h1>
            <Button
              onClick={() => {
                router.push("/cases/new");
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Cases
            </Button>
          </div>
          <CasesTable />
        </>
      );
    }
```

In this example, `CasePage` is a top level client component rendering the home page from a SPA, which gets redirected to when coming from another page. We want it to render with the latest server-rendered data.

NOTE: `force` should only be used when the component is expected to only re-render when new data comes from the server - **and never anytime else**.

## Suggested Usage

There are several suggested "patterns" when using Atoms:

1. Keep your atoms in separate files to prevent circular dependencies.
   1. I typically create a new file for every action, so I can easily see the
      API surface at a glance
2. Suffix all atoms with `$` (for readability).
3. Keep all data management **outside** of your views (e.g, React)
4. Avoid updating atoms (`next`, `set`, and `push`) inside your client components. Instead,
   create an API of helper functions (actions) and call them.
5. Name your helper actions as `<atomName>$<actionName>`, to easily see what
   atoms are involved.
6. Name your derived atoms as `<baseAtom>_<derivedValue>$` to easily see which
   atoms it derives from.

## Advanced Usage

Behind the scenes, `chem-rx` uses a tiny synchronous external-store primitive to
enable reactivity. `derive`, `select`, and `combine` cover the common state
composition patterns without requiring a stream library.

If you already have an Observable-like source, you can still create an atom from
it as long as it has `subscribe` and, ideally, a synchronous `getValue` or
`value` method for the initial snapshot.

```
const source = {
  getValue: () => 3,
  subscribe: (next) => {
    next(3);
    return { unsubscribe: () => {} };
  },
};

const atom$ = Atom(source);
```

## Why...?

I wanted a framework-agnostic [jotai](https://github.com/pmndrs/jotai)-like
solution with a simpler API. The core atom model does not need a full stream
library, so `chem-rx` keeps the small atom surface and leaves heavier reactive
tooling optional.
