/*  Monkey-patch locationchange event  */

import { waitFor } from './wait-for-elements'

const oldPushState = history.pushState
history.pushState = function pushState(...args) {
  const ret = oldPushState.apply(this, args)
  window.dispatchEvent(new Event('locationchange'))
  return ret
}

const oldReplaceState = history.replaceState
history.replaceState = function replaceState(...args) {
  const ret = oldReplaceState.apply(this, args)
  window.dispatchEvent(new Event('locationchange'))
  return ret
}

window.addEventListener('popstate', () =>
  window.dispatchEvent(new Event('locationchange')))


type Action = string | (() => void) | {
  style?: string,
  script?: () => void
}
type Route = { glob: string, action: Action }
type Routes = Record<string, Action>
const styleElement = document.createElement('style')
export function Router(routes: Routes) {
  waitFor.head.then(headElement => {
    headElement.append(styleElement)

    matchRoutes(routes)

    addEventListener('locationchange', () =>
      matchRoutes(routes))
  })
}

function matchRoutes(routes: Routes) {
  styleElement.textContent = null
  for (const [glob, action] of Object.entries(routes))
    matchRoute({ glob, action })
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
    : undefined
  
  const script =
    typeof action == 'function' ? action
    : typeof action == 'object' && 'script' in action ? action.script
    : undefined
  
  setStyle(style)
  script?.()
}

function setStyle(style?: string) {
  styleElement.textContent = style ?? null
}
