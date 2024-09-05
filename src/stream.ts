
type Producer<T> = (listener: Listener<T>) => () => void
export class Stream<T> {
  private listeners = new Listeners<T>
  subscribe = this.listeners.add.bind(this.listeners)

  constructor(producer: Producer<T>) {
    let stop: ReturnType<Producer<T>>
    this.listeners.onActiveChange(active => {
      if (active)
        stop = producer(this.listeners.push.bind(this.listeners))
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
