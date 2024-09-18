
import { Router } from './router'

const hideSidebar = { delete: 'aside.scaffold-layout__aside' }

Router({
  '/notifications/': hideSidebar,
  '/feed/': hideSidebar,
})
