function observeMutations({ element, listener, ...options }) {
  const observer = new MutationObserver(listener)
  observer.observe(element, options)
  return observer
}

export function waitForClassName({ ancestor, target }) {
  const ancestorEl = document.getElementsByClassName(ancestor)[0]
  const search = ancestorEl.getElementsByClassName(target)
  if (search.length > 0)
    return Promise.resolve(search[0])

  return new Promise(resolve => {
    const observer = observeMutations({
      listener,
      element: ancestorEl,
      childList: true,
      subtree: true
    })

    function listener(mutationRecords) {
      for (const mutationRecord of mutationRecords) {
        for (const node of mutationRecord.addedNodes)
          if (node?.classList?.contains?.(target)) {
            observer.disconnect()
            resolve(node)
          }
    }}
  })
}

export const waitForHead = new Promise<HTMLHeadElement>(resolve => {
  if (document.head instanceof HTMLHeadElement)
    return document.head

  const observer = observeMutations({
    listener,
    element: document.documentElement,
    childList: true
  })

  function listener(mutationRecords: MutationRecord[]) {
    for (const mutationRecord of mutationRecords) {
      for (const node of mutationRecord.addedNodes)
        if (node instanceof HTMLHeadElement) {
          observer.disconnect()
          resolve(node)
        }
  }}
})
