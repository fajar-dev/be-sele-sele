import { Hono } from 'hono'
import router from './delivery/http/router'

import { cors } from 'hono/cors'

const app = new Hono()

app.use('/*', cors())


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/', router)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
