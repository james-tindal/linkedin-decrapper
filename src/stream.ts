
export type Producer<T> = (listener: Listener<T>) => () => void
export class Stream<T> {
  private listeners = new Listeners<T>
  subscribe = this.listeners.add.bind(this.listeners)

  constructor(producer: Producer<T>) {
    let stop: ReturnType<Producer<T>>
    this.listeners.onActiveChange(active => {
      if (active)
        stop = producer(value => this.listeners.push(value))
      else
        stop()
    })
  }

  filter<Out extends T>(predicate: (x: T) => x is Out): Stream<Out> {
    return new Stream(push => this.subscribe(value => {
      if (predicate(value))
        push(value)
    }))
  }

  map<S>(fn: (input: T) => S) {
    return new Stream<S>(push =>
      this.subscribe(value =>
        push(fn(value))
      )
    )
  }

  takeUntil(other: Stream<any>) {
    return new Stream<T>(push => {
      const unsub1 = this.subscribe(push)
      const unsub2 = other.subscribe((x) => {
        unsub1()
        unsub2()
      })
      return () => {
        unsub1()
        unsub2()
      }
    })
  }

  switchAll() {
    return new Stream<T extends Stream<infer Inner> ? Inner : never>(push => {
      let unsubPrevious: Function
      return this.subscribe(value => {
        if (value instanceof Stream) {
          unsubPrevious?.()
          unsubPrevious = value.subscribe(push)
        }
      })
    }) 
  }

  switchMap<S>(fn: (value: T) => Stream<S>) {
    return this.map(fn).switchAll()
  }

  merge<S>(other: Stream<S>) {
    return new Stream<T | S>(push => {
      const unsub1 = this.subscribe(push)
      const unsub2 = other.subscribe(push)
      return () => {
        unsub1()
        unsub2()
      }
    })
  }

  mergeAll() {
    return new Stream<T extends Stream<infer Inner> ? Inner : never>(push => {
      const subscriptions = [
        this.subscribe(value => {
          if (value instanceof Stream)
            subscriptions.push(value.subscribe(push))
        })
      ]
      return () => subscriptions.forEach(unsub => unsub())
    })
  }

  mergeMap<S>(fn: (input: T) => Stream<S>) {
    return this.map(fn).mergeAll()
  }

  static merge<A, B>(a: Stream<A>, b: Stream<B>) {
    return a.merge(b)
  }

  static from<X>(promise: Promise<X>) {
    return new Stream<X>(push => {
      promise.then(push)
      return () => {}
    })
  }

  static of<X>(...values: X[]) {
    return new Stream<X>(push => {
      for (const value of values)
        push(value)
      return () => {}
    })
  }
}

type Listener<T> = (value: T) => void
class Listeners<T> {
  private listeners = new Set<Listener<T>>
  private activeCallback?: (active: boolean) => void

  push(value: T) {
    for (const listener of this.listeners)
      listener(value)
  }

  add(listener: Listener<T>) {
    const active = this.listeners.size > 0
    this.listeners.add(listener)
    if (!active)
      this.activeCallback?.(true)

    return () => this.delete(listener)
  }

  private delete(listener: Listener<T>) {
    const active1 = this.listeners.size > 0
    this.listeners.delete(listener)
    const active2 = this.listeners.size > 0
    if (active1 != active2)
      this.activeCallback?.(false)
  }

  // Trigger callback when listener count changes between 0 and 1
  onActiveChange(callback: (active: boolean) => void) {
    this.activeCallback = callback
  }
}
