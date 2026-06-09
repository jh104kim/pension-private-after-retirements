const CHAT_API_ENDPOINT = '/api/chat'

export const AI_CHAT_ERROR_MESSAGE =
  'AI 응답 생성에 실패했습니다. API 키와 모델명을 확인하세요.'

export async function sendChatMessage(message, context) {
  const trimmed = message.trim()
  if (!trimmed) return ''

  let response
  try {
    response = await fetch(CHAT_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: trimmed, context }),
    })
  } catch {
    throw new Error('AI 서버에 연결하지 못했습니다. dev 서버가 실행 중인지 확인하세요.')
  }

  // 서버가 내려준 구체적 안내 메시지를 우선 노출
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || AI_CHAT_ERROR_MESSAGE)
  }
  if (!data?.text) {
    throw new Error(data?.error || AI_CHAT_ERROR_MESSAGE)
  }

  return data.text
}
