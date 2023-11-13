# chem-rx

`chem-rx` wraps `rxjs` to provide a state management solution focused on
simplicity. Useable with or without React!

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

```
const atom$ = Atom(3);

const squared$ = atom$.derive((x) => x * x);

squared$.value()  // "9"

atom$.set(4)

squared$.value()  // "16"

// ERR: Property 'set' does not exist on type ReadOnlyAtom
squared$.set(2)
```

You can optionally enforce `readOnly` on an atom at creation time if needed

```
const atom$ = Atom(3, true);

// ERR: Property 'set' does not exist on type ReadOnlyAtom
atom$.set(2)
```

### Combining Atoms

Multiple atoms can also be **combined** to create brand new atoms.

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

Atoms emit values each time they're updated. You can subscribe callbacks to them
to act on updates

```
const atom$ = Atom(3);

const subscription = atom$.subscribe(val => {
    console.log("Received value: ", val)
})

atom$.set(4)  // "Received value: 4"

// Unsubscribe to clean up
subscription.unsubscribe();
```

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

## Use with React

### useAtom

`useAtom` automatically updates with new values in your react components.

If you want to update your atoms, you can simply call the same `next`, `set`, or `push` (ArrayAtom) methods you would typically use outside
of react.

```
import { Atom, useAtom } from 'chem-rx'

const count$ = Atom(0)

function Counter() {
  const count = useAtom(count$)
  return (
    <h1>
      {count}
        <button onClick={() => count$.set(count$.value() + 1)}>one up</button> ...
```

Remember that you can mix and match for any of your needs

### useSelectAtom

With `useSelect` can select a specific key from an atom, and still have it live
update in your react component.

```
import { Atom, useAtom } from 'chem-rx'

const count$ = Atom({ inner: 0 })

function Counter() {
  const count = useSelectAtom(count$, 'inner')
  return (
    <h1>
      {count}
        <button onClick={() => count$.set('inner', count + 2)}>one up</button> ...
```

### hydrateAtoms

With SSR, your atoms will likely need to be properly hydrated to prevent
server/client mismatches. You can use `useHydrateAtoms` as a simple solution for
seeding your client-side Atoms with the correct data.

NOTE: **`hydrateAtoms` caches values and only runs on the initial load by default**, to prevent re-hydration when client-side only changes are made to the component.

```
import { Atom, useAtom, useHydrateAtoms } from 'chem-rx'

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

## Advanced Usage with `rxjs`

Behind the scenes, `chem-rx` uses
[rxjs Observables](https://rxjs.dev/guide/operators) to enable reactivity.
`Atom` abstracts away the majority of Rx intentionally, to extract the most
common patterns used when managing front-end data.

If you're coming in with prior experience and are seeking more complex operators
enabled by Rx, you're in luck, because every Atom is simply a wrapper around a
`BehaviorSubject`!

You can use any rxjs operations you want with `Atom.pipe`, which wraps
`Observable.pipe` to return an Atom.

```
import { map } from "rxjs";

const atom$ = Atom(3);

// Replace `map` with any operators from rxjs
const squared$: Atom<number> = atom.pipe(map((x) => x * x));

// "9"
console.log(squared$.value());
```

## Why...?

[`rxjs`](https://github.com/ReactiveX/rxjs) is awesome, and I wanted a framework-agnostic [jotai](https://github.com/pmndrs/jotai)-like solution with a simpler API.
