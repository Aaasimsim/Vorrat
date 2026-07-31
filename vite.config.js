import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `vite dev` does not run Vercel functions, so without this the app would have
 * to be developed against a mock. This runs the real handler on the real feed,
 * so dev and production share one code path.
 */
function apiDevServer() {
  return {
    name: 'vorrat-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/shortages', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/shortages.js')

        // Minimal shim for the bits of the Vercel response object the handler uses.
        const shim = {
          setHeader: (key, value) => res.setHeader(key, value),
          status(code) {
            res.statusCode = code
            return this
          },
          json(body) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(body))
          },
        }

        try {
          await handler(req, shim)
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'dev_handler_failed', message: String(error) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServer()],
})
