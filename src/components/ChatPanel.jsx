import { useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePensionContext } from '@/context/PensionContext'
import { buildChatContext } from '@/utils/buildChatContext'
import { AI_CHAT_ERROR_MESSAGE, sendChatMessage } from '@/services/aiChat'
import { cn } from '@/lib/utils'

const QUICK_QUESTIONS = [
  '65세 이후 세후 월수령액과 리스크를 요약해줘',
  '건강보험 피부양자 탈락 가능성과 보험료 부담을 설명해줘',
  '절세 관점에서 가장 먼저 확인할 것은?',
]

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[86%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground',
      )}>
        {text}
      </div>
    </div>
  )
}

export default function ChatPanel() {
  const contextState = usePensionContext()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '연금·세금·건강보험료를 앱 데이터 기준으로 설명합니다. 모든 세금·건보료 답변은 추정값입니다.',
    },
  ])
  const inputRef = useRef(null)

  const chatContext = useMemo(
    () => buildChatContext(contextState),
    [contextState],
  )

  async function submitMessage(nextMessage = input) {
    const question = nextMessage.trim()
    if (!question || loading) return

    setOpen(true)
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', text: question }])

    try {
      const answer = await sendChatMessage(question, chatContext)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `${answer}\n\n※ 앱 데이터 기반 추정 설명이며, 확정 세무·건강보험 판단은 세무사 및 국민건강보험공단 확인이 필요합니다.`,
        },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: AI_CHAT_ERROR_MESSAGE }])
    } finally {
      setLoading(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    submitMessage()
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-12 rounded-full shadow-lg px-4 gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        AI 분석 챗봇
      </Button>
    )
  }

  return (
    <Card className="fixed right-4 top-[112px] bottom-4 z-50 w-[360px] shadow-2xl flex flex-col overflow-hidden">
      <CardHeader className="h-14 shrink-0 px-4 py-3 border-b flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm">AI 연금 분석 챗봇</CardTitle>
          <div className="mt-1 flex gap-1.5">
            <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 bg-amber-50 px-1.5 py-0">
              추정
            </Badge>
            <Badge variant="outline" className="text-[9px] text-red-600 border-red-200 bg-red-50 px-1.5 py-0">
              세무 자문 아님
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOpen(false)}
          aria-label="챗봇 닫기"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
          {messages.map((message, index) => (
            <ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.text} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                응답 생성 중...
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map(question => (
              <button
                key={question}
                type="button"
                disabled={loading}
                onClick={() => submitMessage(question)}
                className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submitMessage()
                }
              }}
              placeholder="예: 75세 급감 원인을 설명해줘"
              className="min-h-10 max-h-24 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="전송"
              disabled={loading || !input.trim()}
              className="h-10 w-10 shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground leading-snug">
            배포 전 Cloudflare Worker/Pages Function 프록시에서 토큰을 관리해야 합니다. 현재 UI는 /api/chat 프록시만 호출합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
