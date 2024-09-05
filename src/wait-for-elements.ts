import { Stream } from "./stream"

const appends = new Stream<Element>(push => {
  const observer = new MutationObserver(records => {
    for (const record of records)
      for (const node of record.addedNodes)
        if (node instanceof Element)
          push(node)
  })
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
  return observer.disconnect
})

const one = <Out extends Element>(selector: string) => new Promise(resolve => {
  const immediateResult = document.querySelector(selector)
  if (immediateResult)
    return resolve(immediateResult)

  const unsubscribe = appends
    .filter((element): element is Out => element.matches(selector))
    .subscribe(element => {
      resolve(element)
      unsubscribe()
    })
})

const many = <Out extends Element>(selector: string) => new Stream<Out>(push => {
  const immediateResult = document.querySelectorAll(selector) as NodeListOf<Out>
  for (const element of immediateResult)
    push(element)

  return appends
    .filter((element): element is Out => element.matches(selector))
    .subscribe(push)
})

const head = new Promise<HTMLHeadElement>(resolve => {
  const immediateResult = document.head
  if (immediateResult)
    return resolve(immediateResult)

  const unsubscribe = appends
    .filter((element): element is HTMLHeadElement => element instanceof HTMLHeadElement)
    .subscribe(headElement => {
      resolve(headElement)
      unsubscribe()
    })
})

export const waitFor = { one, many, head }
