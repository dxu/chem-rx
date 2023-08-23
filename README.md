# chem-rx

`chem-rx` wraps `rxjs` to provide a state management solution focused on
simplicity. Useable with or without React!

## Atom

`chem-rx` is an atomic approach to state management, similar to
[jotai](https://github.com/pmndrs/jotai) or
[Recoil](https://github.com/facebookexperimental/Recoil).

Atoms are state containers that take any value - object, array, or primitive.

```
import { Atom } from 'chem-rx'

const number$: BaseAtom = Atom(0)
const string$: BaseAtom = Atom('hello')
const array$: ArrayAtom = Atom(['hello', 'world'])
const object$: ObjectAtom = Atom({ 'hello': 'world', 'world': 'hello' })
```

### Getting & setting values

`Atom` will automatically return an instance of `BaseAtom`, `ArrayAtom`, or
`ObjectAtom` depending on the input.

```
/*
 * BaseAtom
 */
number$.set(2)
number$.value()
// 2

/*
 * ArrayAtom
 */
array$.push('!')
array$.value()
// ['hello', 'world', '!']
array$.get(1)
// 'world'

/*
 * ObjectAtom
 */
object$.set('world', 'hi')
object$.value()
// {'hello': 'world', 'world': 'hi'}

object$.set('sup', 'earth')
// {'hello': 'world', 'world': 'hi', 'sup': 'earth'}

object$.get('world')
// 'hi'
```

### Selecting Atoms

You can select Object and Array atoms to return new Atoms that wrap the values
at that key. This can be useful for working with different parts of nested Array
and Object atoms.

TODO: Add example

### Derived Atoms (read-only)

You can derive new Atoms from any existing atoms. Any time the original atoms
change, your derived atoms will automatically update with new values!

```
const atom$ = Atom(3);

// square it
const squared$ = atom$.derive((x) => x * x);

// "9"
console.log(squared$.value())

// Update the original value
atom$.set(4)

// "16"
console.log(squared$.value())
```

Every derived atom is **read-only**. Because it is derived from another input,
this prevents you from overriding the derived output value.

```
// ERR: Property 'set' does not exist on type ReadOnlyAtom
squared$.set(2)
```

Behind the scenes, this uses
[rxjs Observables](https://rxjs.dev/guide/operators) to enable reactivity. For
more information on how to use rxjs with chem-rx, take a look at
[Use with rxjs](#use-with-rxjs)

### Combining Atoms

Multiple atoms can also be **combined** to create brand new atoms!

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

/*
 * [
 *   {
 *     name: "spot",
 *     type: "dog",
 *     age: 5,
 *   },
 * ]
 */
console.log(mary$.select('pets'))
```

### Subscribing to updates

Atoms emit values each time they're updated. You can subscribe to them

## Use with React

### useAtom

### useSelectAtom

### hydrateAtoms

## Use with rxjs

Atom abstracts away the majority of Rx intentionally, to extract the most common
patterns used when managing front-end data.

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

This library spawned out of a love for the flexibility and expressiveness of
[rxjs](https://github.com/ReactiveX/rxjs) Observables, and the simplicity of
atomic libraries like [jotai](https://github.com/pmndrs/jotai).
