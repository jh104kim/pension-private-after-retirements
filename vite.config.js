import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { readCloudflareConfig, runCloudflareChat } from './functions/api/_chatCore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 로컬 `npm run dev` 에서도 /api/chat 를 동작시키는 미들웨어.
 * 배포는 functions/api/chat.js (Cloudflare Pages Function)가 동일 로직을 처리한다.
 */
function chatApiDevPlugin(env) {
  return {
    name: 'dev-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', (req, res, next) => {
        if (req.method !== 'POST') return next()

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          const send = (status, obj) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(obj))
          }
          try {
            const { message, context } = JSON.parse(body || '{}')
            if (!message || typeof message !== 'string') {
              return send(400, { error: 'message is required' })
            }
            const { accountId, apiToken, model } = readCloudflareConfig(env)
            const text = await runCloudflareChat({ accountId, apiToken, model, context, message })
            send(200, { text })
          } catch (error) {
            send(error?.status ?? 500, {
              error: error instanceof Error ? error.message : 'AI 응답 생성에 실패했습니다.',
              code: error?.code,
              details: error?.details,
            })
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // CLOUDFLARE_* 등 모든 키 로드 (VITE_ prefix 외 포함)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), chatApiDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
