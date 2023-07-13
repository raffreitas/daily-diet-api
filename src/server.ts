import { env } from './env'
import { app } from './app'

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    const [{ address, port }] = app.addresses()
    console.log(`🚀 HTTP Server is running on http://${address}:${port}`)
  })
