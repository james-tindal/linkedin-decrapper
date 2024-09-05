
import { Router } from './router'

const hideSidebar = `aside.scaffold-layout__aside { display: none }`

Router({
  '/notifications/': hideSidebar,
  '/feed/': hideSidebar,
})
