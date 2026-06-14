# Changelog

## 0.2.0 - 2026-06-13

### Added

- Optional `equals` comparator on every atom creation path: `Atom(value, { equals })`,
  `atom.derive(fn, { equals })`, and `atom.select(key, { equals })`. Supply a
  content comparator to dedup notifications by data instead of identity. See
  [Equality & change detection](./README.md#equality--change-detection).
- `Atom()`'s second argument now also accepts an options object
  (`{ readOnly?, equals? }`) in addition to the legacy `readOnly` boolean.
- Exported `Equals<T>` and `AtomFactoryOptions<T>` types.

### Changed (breaking)

- Every atom now decides whether to notify subscribers using an equality
  comparator that **defaults to `Object.is`**:
  - A base atom no longer re-emits when `next()` is called with an
    `Object.is`-equal value (previously every `next()` notified).
  - `derive` no longer re-emits when its computed output is `Object.is`-equal
    (previously it re-emitted on every parent update).
  - `select` and `combine` are unchanged in practice (already `Object.is`).

  Migration: pass `equals: () => false` to restore the previous always-notify
  behavior.
