/**
 * Cloudflare Workers AI 챗 호출 공통 로직
 * - functions/api/chat.js (Cloudflare Pages Function, 배포용)
 * - vite.config.js dev 미들웨어 (로컬 npm run dev 용)
 * 두 곳에서 공유한다.
 */

export const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct'

export const SYSTEM_PROMPT = [
  '너는 은퇴 연금·세금·건강보험료 분석 보조 챗봇이다.',
  '세금과 건강보험료는 반드시 추정값으로 설명하고 확정적 세무 자문을 하지 않는다.',
  '반드시 제공된 앱 컨텍스트의 숫자와 기준만 사용한다.',
  '컨텍스트에 없는 세율, 절감액, 확률, 자격 판단은 새로 지어내지 말고 "확인 필요"라고 답한다.',
  '건강보험은 임대소득 연 3,600만원 및 부동산 26억원 기준에서 피부양자 탈락 가능성이 높고 지역가입자 보험료가 발생하는 방향으로 설명한다.',
  '답변은 한국어로 간결하게 작성하고, 마지막에 세무사·국민건강보험공단 확인 필요를 짧게 덧붙인다.',
].join(' ')

export function buildMessages(context, message) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `현재 앱 컨텍스트:\n${context ?? ''}\n\n사용자 질문:\n${message}`,
    },
  ]
}

export function extractText(data) {
  const result = data?.result ?? data
  return result?.response
    ?? result?.text
    ?? result?.output_text
    ?? result?.generated_text
    ?? result?.[0]?.generated_text
    ?? ''
}

/**
 * 환경에서 Cloudflare 자격증명을 읽는다. (Pages env 또는 process.env)
 * @returns {{ accountId?:string, apiToken?:string, model:string }}
 */
export function readCloudflareConfig(env = {}) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || env.VITE_CLOUDFLARE_ACCOUNT_ID
  const apiToken  = env.CLOUDFLARE_API_TOKEN  || env.VITE_CLOUDFLARE_API_TOKEN
  const model     = env.CLOUDFLARE_AI_MODEL   || env.VITE_CLOUDFLARE_AI_MODEL || FALLBACK_MODEL
  return { accountId, apiToken, model }
}

/**
 * Cloudflare Workers AI 호출. 성공 시 텍스트 반환, 실패 시 Error throw.
 * 에러 메시지는 사용자에게 보여줄 수 있는 한국어 안내를 포함한다.
 */
export async function runCloudflareChat({ accountId, apiToken, model, context, message, fetchImpl }) {
  const doFetch = fetchImpl || fetch

  if (!accountId || !apiToken) {
    const err = new Error('Cloudflare 자격증명이 없습니다. .env에 CLOUDFLARE_ACCOUNT_ID와 CLOUDFLARE_API_TOKEN을 설정하세요.')
    err.code = 'ENV_MISSING'
    err.status = 500
    throw err
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`

  let upstream
  try {
    upstream = await doFetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: buildMessages(context, message) }),
    })
  } catch (e) {
    const err = new Error('Cloudflare API에 연결하지 못했습니다(네트워크/프록시). 회사망인 경우 HTTPS_PROXY 환경변수가 설정돼 있어야 합니다. 원인: ' + (e?.message || String(e)))
    err.code = 'NETWORK'
    err.status = 502
    throw err
  }

  const data = await upstream.json().catch(() => null)
  if (!upstream.ok || data?.success === false) {
    const err = new Error('Cloudflare AI 요청이 실패했습니다. 토큰 권한(Workers AI)과 모델명을 확인하세요.')
    err.code = 'UPSTREAM_FAILED'
    err.status = 502
    err.details = data?.errors ?? data
    throw err
  }

  const text = extractText(data)
  if (!text) {
    const err = new Error('AI 응답 텍스트가 비어 있습니다.')
    err.code = 'EMPTY'
    err.status = 502
    throw err
  }
  return text
}
