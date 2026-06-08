const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct'

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) },
  })
}

function extractText(data) {
  const result = data?.result ?? data
  return result?.response
    ?? result?.text
    ?? result?.output_text
    ?? result?.generated_text
    ?? result?.[0]?.generated_text
    ?? ''
}

export async function onRequestPost({ request, env }) {
  try {
    const { message, context } = await request.json()
    if (!message || typeof message !== 'string') {
      return jsonResponse({ error: 'message is required' }, { status: 400 })
    }

    const accountId = env.CLOUDFLARE_ACCOUNT_ID || env.VITE_CLOUDFLARE_ACCOUNT_ID
    const apiToken = env.CLOUDFLARE_API_TOKEN || env.VITE_CLOUDFLARE_API_TOKEN
    const model = env.CLOUDFLARE_AI_MODEL || env.VITE_CLOUDFLARE_AI_MODEL || FALLBACK_MODEL

    if (!accountId || !apiToken || !model) {
      return jsonResponse({ error: 'Cloudflare AI environment variables are missing' }, { status: 500 })
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              [
                '너는 은퇴 연금·세금·건강보험료 분석 보조 챗봇이다.',
                '세금과 건강보험료는 반드시 추정값으로 설명하고 확정적 세무 자문을 하지 않는다.',
                '반드시 제공된 앱 컨텍스트의 숫자와 기준만 사용한다.',
                '컨텍스트에 없는 세율, 절감액, 확률, 자격 판단은 새로 지어내지 말고 "확인 필요"라고 답한다.',
                '건강보험은 임대소득 연 3,600만원 및 부동산 26억원 기준에서 피부양자 탈락 가능성이 높고 지역가입자 보험료가 발생하는 방향으로 설명한다.',
                '답변은 한국어로 간결하게 작성하고, 마지막에 세무사·국민건강보험공단 확인 필요를 짧게 덧붙인다.',
              ].join(' '),
          },
          {
            role: 'user',
            content: `현재 앱 컨텍스트:\n${context ?? ''}\n\n사용자 질문:\n${message}`,
          },
        ],
      }),
    })

    const data = await upstream.json().catch(() => null)
    if (!upstream.ok || data?.success === false) {
      return jsonResponse({
        error: 'AI request failed',
        details: data?.errors ?? data,
      }, { status: 502 })
    }

    const text = extractText(data)
    if (!text) {
      return jsonResponse({ error: 'AI response text is empty' }, { status: 502 })
    }

    return jsonResponse({ text })
  } catch (error) {
    return jsonResponse({
      error: 'AI 응답 생성에 실패했습니다.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 })
}
