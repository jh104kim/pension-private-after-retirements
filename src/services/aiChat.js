const CHAT_API_ENDPOINT = '/api/chat'

export const AI_CHAT_ERROR_MESSAGE =
  'AI 응답 생성에 실패했습니다. API 키와 모델명을 확인하세요.'

export async function sendChatMessage(message, context) {
  const trimmed = message.trim()
  if (!trimmed) return ''

  const response = await fetch(CHAT_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: trimmed, context }),
  })

  if (!response.ok) {
    throw new Error(AI_CHAT_ERROR_MESSAGE)
  }

  const data = await response.json()
  if (!data?.text) {
    throw new Error(AI_CHAT_ERROR_MESSAGE)
  }

  return data.text
}
