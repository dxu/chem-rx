import {
  BehaviorSubject,
  combineLatest,
  isObservable,
  Observable,
  OperatorFunction,
  Subscription,
} from "rxjs";
import { OverloadedParameters, OverloadedReturnType } from "./types";

export type AtomTuple<T> = {
  [K in keyof T]: Atom<T[K]>;
};

// export class ReadOnlyAtom<T> {}

export class ReadOnlyAtom<T> {
  _behavior$: BehaviorSubject<T>;

  _parent?: BehaviorSubject<T>[];
  _bonds: BehaviorSubject<T>[] = [];

  _fromObservable: Observable<T> | null = null;
  _fromObservableSubscription: Subscription | null = null;

  constructor(_value: T | Observable<T>) {
    if (isObservable(_value)) {
      this._fromObservable = _value;
      this._behavior$ = new BehaviorSubject<T>(null!);
      this._fromObservableSubscription = _value.subscribe((value) => {
        this._behavior$.next(value);
      });
    } else {
      // if it's just a value just use a regular behavior subject
      this._behavior$ = new BehaviorSubject<T>(_value);
    }
  }

  // taken from Observable
  transform(): ReadOnlyAtom<T>;
  transform<A>(op1: OperatorFunction<T, A>): ReadOnlyAtom<A>;
  transform<A, B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>
  ): ReadOnlyAtom<B>;
  transform<A, B, C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>
  ): ReadOnlyAtom<C>;
  transform<A, B, C, D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>
  ): ReadOnlyAtom<D>;
  transform<A, B, C, D, E>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>
  ): ReadOnlyAtom<E>;
  transform<A, B, C, D, E, F>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>
  ): ReadOnlyAtom<F>;
  transform<A, B, C, D, E, F, G>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>
  ): ReadOnlyAtom<G>;
  transform<A, B, C, D, E, F, G, H>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>
  ): ReadOnlyAtom<H>;
  transform<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>
  ): ReadOnlyAtom<I>;
  transform<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>,
    ...operations: OperatorFunction<any, any>[]
  ): ReadOnlyAtom<unknown>;

  transform(
    ...operations: OverloadedParameters<Observable<T>["pipe"]>
  ): ReadOnlyAtom<any> {
    // @ts-ignore can't match overloaded function
    const observable = this._behavior$.pipe(...operations);
    const newAtom = new ReadOnlyAtom(observable);

    return newAtom;
  }

  subscribe(...params: Parameters<BehaviorSubject<T>["subscribe"]>) {
    return this._behavior$.subscribe(...params);
  }

  getValue() {
    return this._behavior$.getValue();
  }

  // not needed?
  dispose() {
    this._fromObservableSubscription?.unsubscribe();
  }
}

export class Atom<T> extends ReadOnlyAtom<T> {
  static combine<A extends readonly unknown[]>(
    ...atoms: readonly [...AtomTuple<A>]
  ): ReadOnlyAtom<A> {
    const observable = combineLatest(...atoms.map((a) => a._behavior$));
    const newAtom = new ReadOnlyAtom(observable) as unknown as ReadOnlyAtom<A>;
    return newAtom;
  }

  push(nextVal: T) {
    this._behavior$.next(nextVal);
  }
}
