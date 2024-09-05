/*  Monkey-patch locationchange event  */

import { waitForHead } from './wait-for-element'

const oldPushState = history.pushState
history.pushState = function pushState() {
  const ret = oldPushState.apply(this, arguments)
  window.dispatchEvent(new Event('locationchange'))
  return ret
}

const oldReplaceState = history.replaceState
history.replaceState = function replaceState() {
  const ret = oldReplaceState.apply(this, arguments)
  window.dispatchEvent(new Event('locationchange'))
  return ret
}

window.addEventListener('popstate', () =>
  window.dispatchEvent(new Event('locationchange')))


// Feature
// can set a stylesheet to only show on this page

// Refactor
// Router takes a settings object instead of method calls


type Action = string | (() => void) | {
  style?: string,
  script?: () => void
}
type Route = { glob: string, action: Action }
type Routes = Record<string, Action>
let styleElement: HTMLStyleElement
export function Router(routes: Routes) {
  styleElement = document.createElement('style')
  waitForHead.then(headElement => {
    headElement.append(styleElement)

    for (const [glob, action] of Object.entries(routes))
      matchRoute({ glob, action })
  })
}

function matchRoute({ glob, action }: Route) {
  const route = window.location.pathname
  if (route == glob)
    runAction(action)
}

function runAction(action: Action) {
  const style =
    typeof action == 'string' ? action
    : 'style' in action ? action.style
    : null
  
  const script =
    typeof action == 'function' ? action
    : typeof action == 'object' && 'script' in action ? action.script
    : null
  
  // @ts-expect-error
  setStyle(style)
  script?.()
}

function setStyle(style: string | null) {
  styleElement.textContent = style
}
