import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Development only: run the existing Vercel Gemini handler under the normal
 * Vite server at /api/ask, so npm run dev works without Vercel CLI.
 *
 * GEMINI_* environment variables are loaded on the Node/Vite server, NOT
 * injected into import.meta.env or bundled into browser JavaScript.
 */
export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    const local = loadEnv(mode, process.cwd(), 'GEMINI_')
    for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL'] as const) {
      if (!process.env[key] && local[key]) process.env[key] = local[key]
    }
  }

  return {
    plugins: [
      react(),
      {
        name: 'promisepulse-local-gemini',
        apply: 'serve' as const,
        configureServer(server) {
          // This line confirms the local API middleware was actually registered.
          // Never log the Gemini key, its prefix, or its value.
          server.config.logger.info('[PromisePulse] Local Gemini API mounted at /api/ask (server-side configuration)')
          server.middlewares.use('/api/ask', async (request, response) => {
            response.setHeader('Cache-Control', 'no-store')
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.setHeader('X-Content-Type-Options', 'nosniff')
            const fail = (status: number, message: string) => {
              if (!response.writableEnded) {
                response.statusCode = status
                response.end(JSON.stringify({ error: message }))
              }
            }

            try {
              let length = 0
              const buffers: Buffer[] = []
              for await (const chunk of request) {
                const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
                length += part.length
                if (length > 4096) {
                  fail(413, 'The request is too large.')
                  return
                }
                buffers.push(part)
              }

              let body: unknown = null
              if (length) {
                try {
                  body = JSON.parse(Buffer.concat(buffers).toString('utf8'))
                } catch {
                  fail(400, 'Malformed JSON request.')
                  return
                }
              }

              // Resolve a fixed local project file rather than any client-supplied path.
              const apiFile = pathToFileURL(resolve(process.cwd(), 'api/ask.js')).href
              const { default: handler } = await import(apiFile)
              const adapter = {
                setHeader(name: string, value: string) {
                  response.setHeader(name, value)
                  return this
                },
                status(code: number) {
                  response.statusCode = code
                  return this
                },
                json(value: unknown) {
                  if (!response.writableEnded) response.end(JSON.stringify(value))
                  return this
                },
              }
              await handler({ method: request.method, headers: request.headers, body }, adapter)
            } catch {
              // Never echo server exceptions, key values, or upstream responses.
              fail(500, 'The local Gemini service encountered an error.')
            }
          })
        },
      },
    ],
    base: './',
    server: { port: 5173 },
    build: { target: 'es2022' },
  }
})
