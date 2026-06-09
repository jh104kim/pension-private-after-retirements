import { useState, useEffect } from 'react'
import {
  Lightbulb, GraduationCap, BookOpen, ChevronDown, ExternalLink,
  CheckCircle2, Circle, AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  KNOWLEDGE_TIPS, KNOWLEDGE_CURRICULUM, KNOWLEDGE_RESOURCES,
} from '@/data/knowledgeContent'

const LS_DONE = 'knowledge_done'
const LS_MEMO = 'knowledge_memo'

const CATEGORIES = [
  { id: 'tips',    label: '맞춤 팁·체크리스트', icon: Lightbulb },
  { id: 'study',   label: '학습 로드맵',         icon: GraduationCap },
  { id: 'sources', label: '추천 자료',           icon: BookOpen },
]

const IMPORTANCE_STYLE = {
  '필수': 'text-red-600 border-red-200 bg-red-50',
  '권장': 'text-blue-600 border-blue-200 bg-blue-50',
  '참고': 'text-slate-500 border-slate-200 bg-slate-50',
}

const LEVEL_STYLE = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  blue:    'border-blue-200 bg-blue-50 text-blue-700',
  violet:  'border-violet-200 bg-violet-50 text-violet-700',
}

function useLocalSet(key) {
  const [set, setSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')) }
    catch { return new Set() }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify([...set])) }, [key, set])
  const toggle = (id) => setSet(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  return [set, toggle]
}

// 외부 링크 (사용자 클릭으로만 열림, 새 탭)
function ResourceLink({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:border-primary hover:bg-muted/50 transition-colors"
    >
      <ExternalLink size={13} className="text-muted-foreground group-hover:text-primary shrink-0" />
      <span className="flex-1">{label}</span>
      <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
        {url.replace(/^https?:\/\//, '')}
      </span>
    </a>
  )
}

function TipCard({ tip, done, onToggle }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-lg border bg-card transition-colors ${done ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-xl shrink-0">{tip.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{tip.title}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${IMPORTANCE_STYLE[tip.importance]}`}>
              {tip.importance}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">🗓 {tip.timing}</p>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 space-y-2.5 text-[13px] border-t">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-0.5">왜 중요한가</p>
            <p className="leading-relaxed">{tip.why}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-0.5">언제·어떻게</p>
            <p className="leading-relaxed">{tip.how}</p>
          </div>
          {tip.caveat && (
            <div className="flex gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-amber-800 text-[12px]">{tip.caveat}</p>
            </div>
          )}
          {tip.sources?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {tip.sources.map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                  <ExternalLink size={11} /> {s.label}
                </a>
              ))}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(tip.id) }}
            className={`inline-flex items-center gap-1.5 text-[12px] font-medium rounded-md px-2.5 py-1 border
              ${done ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {done ? '확인 완료' : '확인함으로 표시'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function KnowledgeHub() {
  const [cat, setCat] = useState('tips')
  const [done, toggleDone] = useLocalSet(LS_DONE)
  const [studyDone, toggleStudy] = useLocalSet(LS_DONE + '_study')
  const [memo, setMemo] = useState(() => localStorage.getItem(LS_MEMO) || '')
  useEffect(() => { localStorage.setItem(LS_MEMO, memo) }, [memo])

  const tipsDone = KNOWLEDGE_TIPS.filter(t => done.has(t.id)).length
  const allStudy = KNOWLEDGE_CURRICULUM.flatMap(l => l.topics)
  const studyDoneCount = allStudy.filter(t => studyDone.has(t.id)).length

  return (
    <div className="h-full flex flex-col">

      {/* 상단 면책 배너 */}
      <div className="shrink-0 px-8 py-2 bg-amber-50/60 border-b flex items-center gap-2">
        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
        <p className="text-[11px] text-amber-800">
          교육용 일반 정보입니다. 세금·건강보험·연금 적용 전 반드시 공식기관(국민연금공단·국세청·국민건강보험공단)에서 본인 기준으로 확인하세요.
        </p>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 좌측 카테고리 네비 */}
        <nav className="w-56 shrink-0 border-r p-3 space-y-1.5 bg-muted/20">
          {CATEGORIES.map(c => {
            const Icon = c.icon
            const active = cat === c.id
            const progress = c.id === 'tips'  ? `${tipsDone}/${KNOWLEDGE_TIPS.length}`
                          : c.id === 'study' ? `${studyDoneCount}/${allStudy.length}`
                          : null
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-left transition-colors
                  ${active ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{c.label}</span>
                {progress && (
                  <span className={`text-[10px] ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {progress}
                  </span>
                )}
              </button>
            )
          })}

          <div className="pt-3 mt-2 border-t">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1 mb-1.5">진행률</p>
            <div className="px-1 space-y-2">
              <ProgressRow label="맞춤 팁" value={tipsDone} max={KNOWLEDGE_TIPS.length} />
              <ProgressRow label="학습 로드맵" value={studyDoneCount} max={allStudy.length} />
            </div>
          </div>
        </nav>

        {/* 우측 콘텐츠 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-6">

          {cat === 'tips' && (
            <div className="max-w-3xl space-y-2.5">
              <SectionHeader
                title="내가 더 신경 써야 할 것들"
                desc="놓치기 쉬운 연금·절세·건보 액션 항목. 카드를 눌러 상세를 펼치고, 확인한 항목은 체크하세요."
              />
              {KNOWLEDGE_TIPS.map(tip => (
                <TipCard key={tip.id} tip={tip} done={done.has(tip.id)} onToggle={toggleDone} />
              ))}

              {/* 개인 메모 / 할 일 */}
              <div className="pt-4">
                <p className="text-sm font-semibold mb-1.5">📝 내 메모 · 할 일</p>
                <textarea
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="예: 통합연금포털에서 추납 가능 기간 조회하기 / 배우자 직장 피부양자 등재 문의"
                  className="w-full h-28 resize-none rounded-md border bg-background px-3 py-2 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground mt-1">이 메모와 체크 상태는 브라우저에 자동 저장됩니다.</p>
              </div>
            </div>
          )}

          {cat === 'study' && (
            <div className="max-w-3xl space-y-5">
              <SectionHeader
                title="시간 날 때 익히면 좋은 학습 로드맵"
                desc="입문 → 중급 → 고급 순서로 개념을 쌓아보세요. 익힌 주제는 체크할 수 있습니다."
              />
              {KNOWLEDGE_CURRICULUM.map(level => (
                <div key={level.level}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={`text-xs ${LEVEL_STYLE[level.color]}`}>{level.level}</Badge>
                    <span className="text-[12px] text-muted-foreground">{level.desc}</span>
                  </div>
                  <div className="space-y-1.5">
                    {level.topics.map(topic => {
                      const isDone = studyDone.has(topic.id)
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleStudy(topic.id)}
                          className={`w-full flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors
                            ${isDone ? 'border-emerald-200 bg-emerald-50/40' : 'bg-card hover:bg-muted/50'}`}
                        >
                          {isDone
                            ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            : <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isDone ? 'text-emerald-800' : ''}`}>{topic.title}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{topic.note}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cat === 'sources' && (
            <div className="max-w-3xl space-y-5">
              <SectionHeader
                title="추천 학습 자료"
                desc="공식기관에서 본인 데이터를 직접 조회하고, 해설 자료로 개념을 보완하세요. (새 탭으로 열림)"
              />
              {KNOWLEDGE_RESOURCES.map(group => (
                <div key={group.group}>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase mb-2">{group.group}</p>
                  <div className="space-y-1.5">
                    {group.items.map(item => (
                      <ResourceLink key={item.url} label={item.label} url={item.url} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, desc }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-[12px] text-muted-foreground mt-0.5">{desc}</p>
    </div>
  )
}

function ProgressRow({ label, value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>{label}</span><span>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
