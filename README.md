# chem-rx

`chem-rx` wraps`rx.js` to provide a state management solution focused on
simplicity. Useable with or without React!

## Atom

`chem-rx` is an atomic approach to state management, similar to
[jotai](https://github.com/pmndrs/jotai) or
[Recoil](https://github.com/facebookexperimental/Recoil).

Atoms are state containers that take any value - object, array, or primitive.

```
import { Atom } from 'chem-rx'

const numberAtom: BaseAtom = Atom(0)
const stringAtom: BaseAtom = Atom('hello')
const arrayAtom: ArrayAtom = Atom(['hello', 'world'])
const objectAtom: ObjectAtom = Atom({ 'hello': 'world', 'world': 'hello' })
```

### Getting & setting values

`Atom` will automatically return an instance of `BaseAtom`, `ArrayAtom`, or
`ObjectAtom` depending on the input.

```
/*
 * BaseAtom
 */
numberAtom.set(2)
numberAtom.value()
// 2

/*
 * ArrayAtom
 */
arrayAtom.push('!')
arrayAtom.value()
// ['hello', 'world', '!']
arrayAtom.get(1)
// 'world'

/*
 * ObjectAtom
 */
objectAtom.set('world', 'hi')
objectAtom.value()
// {'hello': 'world', 'world': 'hi'}

objectAtom.set('sup', 'earth')
// {'hello': 'world', 'world': 'hi', 'sup': 'earth'}

objectAtom.get('world')
// 'hi'
```

### Transforming Atoms

### Composing Atoms & ReadOnlyAtoms

### Subscribing to updates

## Use with React

### useAtom

### hydrateAtoms

## Use with rx.js

## Why...?

This library spawned out of a love for the flexibility and expressiveness of
[rx.js](https://github.com/ReactiveX/rxjs) Observables, and the simplicity of
atomic libraries like [jotai](https://github.com/pmndrs/jotai).

Its primary focus is on ease of use and code cleanliness, and is my go-to
library for all client-side state management
