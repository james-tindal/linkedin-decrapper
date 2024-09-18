/*  Monkey-patch locationchange event  */

import { routeChange$, getCurrentRoute } from './route-changes'
import { Stream } from './stream'
import { waitFor } from './wait-for-elements'


const Style = (styleSheet: string) => ({ tag: 'style', styleSheet }) as const
type Style = ReturnType<typeof Style>
const Script = (script: () => void) => ({ tag: 'script', script }) as const
type Script = ReturnType<typeof Script>
const Delete = (selector: string) => ({ tag: 'delete', selector }) as const
type Delete = ReturnType<typeof Delete>
const ClearStyle = { tag: 'style' } as const
type ClearStyle = typeof ClearStyle
type SubAction = Style | Script | Delete | ClearStyle
type Action = string | (() => void) | {
  style?: string,
  script?: () => void,
  delete?: string
}
type Matcher = `/${string}`
type RouterConfig = Record<Matcher, Action>
const styleElement = document.createElement('style')
export function Router(config: RouterConfig) {
  const styleElReady = 
    waitFor.head.then(headElement =>
      headElement.append(styleElement))

  const styleElReady$ = Stream.from(styleElReady)

  const currentRoute$ =
    Stream.merge(styleElReady$, routeChange$)
      .map(getCurrentRoute)

  const action$ = currentRoute$.map(matchRoutes(config))


  const subAction$ = action$.mergeMap(splitAction)

  subAction$.subscribe(runSubAction)

  const selectorToDelete$ = subAction$
    .filter(sa => sa.tag === 'delete')
    .map(sa => sa.selector)

  const elementsToDelete$ = selectorToDelete$
    .switchMap(waitFor.selector)
  
  elementsToDelete$.subscribe(element => element.remove())
}

const matchRoutes = (config: RouterConfig) => (url: URL) => {
  for (const [ matcher, action ] of Object.entries(config))
    if (matchRoute(matcher, url))
      return action
  return {}
}

function matchRoute(matcher: string, url: URL) {
  // Algorithm for matching matchers to routes
  return matcher = url.pathname
}

function splitAction(action: Action) {
  const style =
    typeof action == 'string' ? action :
    'style' in action         ? action.style : undefined
  
  const script =
    typeof action == 'function'                     ? action :
    typeof action == 'object' && 'script' in action ? action.script : undefined
  
  const delet = typeof action == 'object' ? action.delete : undefined

  const subactions: SubAction[] = [
    ClearStyle,
    style  != null && Style(style),
    script != null && Script(script),
    delet  != null && Delete(delet)
  ].filter(x => !!x)
  
  return Stream.of(...subactions)
}

function runSubAction(sa: SubAction) {
  if (sa.tag === 'script')
    sa.script()
  if (sa.tag === 'style')
    // @ts-expect-error
    setStyle(sa.styleSheet)
}

function setStyle(style?: string) {
  styleElement.textContent = style ?? null
}
