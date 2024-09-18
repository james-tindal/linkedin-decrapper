import { Producer, Stream } from './stream'


export const getCurrentRoute = () =>
  new URL(window.location.toString())

const oldPushState = history.pushState.bind(history)
const oldReplaceState = history.replaceState.bind(history)

const producer: Producer<void> = push => {
  history.pushState = (...args) => {
    oldPushState(...args)
    push()
  }

  history.replaceState = (...args) => {
    oldReplaceState(...args)
    push()
  }

  const listener = () => push()
  window.addEventListener('popstate', listener)

  return () => {
    history.pushState = oldPushState
    history.replaceState = oldReplaceState
    window.removeEventListener('popstate', listener)
  }
}

export const routeChange$ = new Stream(producer)
