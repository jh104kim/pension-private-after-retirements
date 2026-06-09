import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { readCloudflareConfig, runCloudflareChat } from './functions/api/_chatCore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 회사망(프록시) 환경에서 Node fetch 는 HTTPS_PROXY 를 자동으로 따르지 않는다.
 * 프록시 변수가 있으면 undici ProxyAgent 를 경유하는 fetch 를 만들어 반환한다.
 * (dev 전용 — Cloudflare 배포 환경에서는 프록시 불필요)
 */
async function makeProxyFetch(env) {
  const proxy =
    env.HTTPS_PROXY || env.https_proxy ||
    env.HTTP_PROXY  || env.http_proxy  ||
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  if (!proxy) return undefined
  try {
    const { ProxyAgent } = await import('undici')
    const dispatcher = new ProxyAgent(proxy)
    return (url, opts = {}) => fetch(url, { ...opts, dispatcher })
  } catch {
    return undefined  // undici 미존재 시 기본 fetch 사용
  }
}

/**
 * 로컬 `npm run dev` 에서도 /api/chat 를 동작시키는 미들웨어.
 * 배포는 functions/api/chat.js (Cloudflare Pages Function)가 동일 로직을 처리한다.
 */
function chatApiDevPlugin(env) {
  return {
    name: 'dev-chat-api',
    configureServer(server) {
      // 시작 시 챗봇 설정 상태를 알려 진단을 돕는다.
      const { accountId, apiToken, model } = readCloudflareConfig(env)
      const proxy = env.HTTPS_PROXY || env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
      const creds = accountId && apiToken ? '자격증명 OK' : '자격증명 없음(.env 확인)'
      server.config.logger.info(
        `\n  [chat] ${creds} · 모델 ${model} · 프록시 ${proxy ? '감지됨' : '없음'}`
      )

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
            const fetchImpl = await makeProxyFetch(env)
            const text = await runCloudflareChat({ accountId, apiToken, model, context, message, fetchImpl })
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
  // __dirname(프로젝트 루트) 기준으로 .env 를 읽어, dev 서버를 어디서 실행하든
  // (예: npm run --prefix) 동일하게 자격증명을 인식하도록 한다.
  // process.env 값(셸/시스템 환경변수)도 함께 머지한다.
  const fileEnv = loadEnv(mode, __dirname, '')
  const env = { ...fileEnv, ...process.env }
  return {
    plugins: [react(), chatApiDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
