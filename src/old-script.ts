// This is intended to replace crappy feed links with linking directly to the post in question




/*  Listen for notifications page */

continueIfNotificationsPage()
window.addEventListener('locationchange', continueIfNotificationsPage)


async function continueIfNotificationsPage() {
  if (!isNotificationsPage()) return

  const cardList = await waitForElement({ target: "nt-card-list", ancestor: 'application-outlet' })

  changeLinks(cardList)
}

function changeLinks(cardList) {
  const initial_notification_elements = cardList.children

  // Instead this should respond to mutation events

  // change link for initial 10 loaded notifications
  for(const el of initial_notification_elements) changeLink(el)

  // change link for any notifications that load later
  const listener = mutation_records => mutation_records
    .forEach(mr => mr.addedNodes.forEach(node => node.nodeName === 'DIV' && changeLink(node)))

  observeMutations({ element: cardList, listener, childList: true })
}

function changeLink (notification_element) {
  const link_element = notification_element
    .querySelector('a.nt-card__headline')
  const url = link_element.attributes.href.value
  const newUrl = url
    .replace(/^\/feed\/\?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A(\d{19}).*/, '/feed/update/urn:li:activity:$1')
  link_element.setAttribute('href', newUrl)
  remove_click_events(link_element)
}

/* ... */

function observeMutations({ element, listener, ...options }) {
  const observer = new MutationObserver(listener)
  observer.observe(element, options)
  return observer
}

function waitForElement({ ancestor, target }) {
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

// Counter click events overriding the new href
function remove_click_events(element) {
  element.outerHTML = element.outerHTML
}

function isNotificationsPage() {
  const matchNotificationsPage = /^https:\/\/www\.linkedin\.com\/notifications\/?\??.*$/
  //@ts-expect-error
  return matchNotificationsPage.test(window.location)
}
