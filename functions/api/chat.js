import { readCloudflareConfig, runCloudflareChat } from './_chatCore.js'

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers ?? {}) },
  })
}

export async function onRequestPost({ request, env }) {
  try {
    const { message, context } = await request.json()
    if (!message || typeof message !== 'string') {
      return jsonResponse({ error: 'message is required' }, { status: 400 })
    }

    const { accountId, apiToken, model } = readCloudflareConfig(env)
    const text = await runCloudflareChat({ accountId, apiToken, model, context, message })
    return jsonResponse({ text })
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : 'AI 응답 생성에 실패했습니다.',
      code: error?.code,
      details: error?.details,
    }, { status: error?.status ?? 500 })
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 })
}
