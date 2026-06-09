import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Pencil, GripVertical } from 'lucide-react'
import { PENSION_PRODUCTS, PENSION_ANNUAL } from '@/data/pensionData'
import { USER_DEFAULTS } from '@/data/userData'
import { usePensionContext } from '@/context/PensionContext'

const AGE_MIN = 55
const AGE_MAX = 90
const CURRENT_AGE = USER_DEFAULTS.currentAge

// 리사이즈 한계
const MIN_WIDTH = 240
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 320
const LS_WIDTH = 'pensionSidebarWidth'
const LS_COLLAPSED = 'pensionSidebarCollapsed'

const SECTIONS = [
  { id: 'qualified', label: '세제적격 계좌' },
  { id: 'nontax',   label: '비과세 계좌' },
  { id: 'child',    label: '자녀 양도 예정' },
  { id: 'public',   label: '공적연금' },
]

const STYLE = {
  qualified: { bar: '#10B981', dotClass: 'bg-emerald-500' },
  nontax:    { bar: '#94A3B8', dotClass: 'bg-slate-400'   },
  child:     { bar: '#EC4899', dotClass: 'bg-pink-400'    },
  public:    { bar: '#3B82F6', dotClass: 'bg-blue-500'    },
}

// 천원 → 억/만 표시 문자열
function fmtAmt(v) {
  if (v == null) return '—'
  const eok = v / 100000
  if (eok >= 1) return `${eok.toFixed(1)}억`
  return `${Math.round(v / 10).toLocaleString()}만`
}

// 수령 시작까지 남은 기간 레이블
function receiptStatus(startAge, endAge) {
  if (!startAge) return null
  if (CURRENT_AGE > endAge) return '종료'
  if (CURRENT_AGE >= startAge) return '수령중'
  return `D-${startAge - CURRENT_AGE}년`
}

export default function PensionSidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(LS_COLLAPSED) === '1'
  )
  const [width, setWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem(LS_WIDTH), 10)
    return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_WIDTH
  })
  const [dragging, setDragging] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [editValue,  setEditValue]  = useState('')
  const { balances, setBalances }   = usePensionContext()

  // ── 너비/접힘 상태 영속화 ─────────────────────────────────
  useEffect(() => { localStorage.setItem(LS_WIDTH, String(width)) }, [width])
  useEffect(() => { localStorage.setItem(LS_COLLAPSED, collapsed ? '1' : '0') }, [collapsed])

  // ── 드래그 리사이즈 ───────────────────────────────────────
  const startDrag = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
    const onMove = (ev) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX))
      setWidth(next)
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  // 더블클릭 시 기본 너비로 리셋
  const resetWidth = () => setWidth(DEFAULT_WIDTH)

  const startEdit = (key, currentThousand) => {
    setEditingKey(key)
    setEditValue(String(Math.round(currentThousand / 10)))  // 천원 → 만원
  }

  const confirmEdit = () => {
    const wan = parseFloat(String(editValue).replace(/,/g, ''))
    if (!isNaN(wan) && wan > 0) {
      setBalances(prev => ({ ...prev, [editingKey]: Math.round(wan * 10) }))  // 만원 → 천원
    }
    setEditingKey(null)
  }

  // 하단 합계 계산
  const totalBalance   = balances.db + balances.irp + balances.savings
  const ownKeys        = Object.keys(PENSION_ANNUAL).filter(k => !['ourChild1', 'ourChild2'].includes(k))
  const total65wan     = Math.round(ownKeys.reduce((s, k) => s + PENSION_ANNUAL[k][10], 0) / 10 / 12)
  const ownLifetime    = ownKeys.reduce((s, k) => s + PENSION_ANNUAL[k].reduce((a, v) => a + v, 0), 0)

  // ── 접힌 상태 ──────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside className="w-12 shrink-0 border-r flex flex-col items-center py-3 gap-4 bg-background">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 rounded hover:bg-muted"
          title="사이드바 펼치기"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 flex flex-col items-center gap-2 pt-2">
          {SECTIONS.map(s => (
            <div
              key={s.id}
              className={`w-2.5 h-2.5 rounded-full ${STYLE[s.id].dotClass}`}
              title={s.label}
            />
          ))}
        </div>
        <div className="text-[9px] text-muted-foreground text-center leading-tight pb-1">
          <div className="font-semibold text-foreground text-[10px]">{fmtAmt(totalBalance)}</div>
          <div>적립금</div>
        </div>
      </aside>
    )
  }

  // ── 펼친 상태 ──────────────────────────────────────────────
  return (
    <aside
      className="relative shrink-0 border-r flex flex-col bg-background"
      style={{ width }}
    >
      {/* 헤더 — 메인 헤더(h-14)와 높이 동기화 */}
      <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b">
        <span className="text-sm font-semibold">내 연금 포트폴리오</span>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-muted"
          title="사이드바 접기"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* 상품 목록 (스크롤) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {SECTIONS.map(sec => {
          const products = PENSION_PRODUCTS.filter(p => p.section === sec.id)
          if (!products.length) return null
          const st = STYLE[sec.id]

          return (
            <div key={sec.id}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
                {sec.label}
              </p>

              <div className="space-y-2">
                {products.map(prod => {
                  const stream  = PENSION_ANNUAL[prod.key]
                  const at65    = stream ? Math.round(stream[10] / 10 / 12) : null
                  const status  = receiptStatus(prod.startAge, prod.endAge)
                  const balance = prod.balanceKey ? balances[prod.balanceKey] : null

                  return (
                    <div key={prod.key} className="rounded-md border bg-card px-3 py-2.5 text-[13px]">

                      {/* 상품명 + 수령 상태 */}
                      <div className="flex items-start justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: st.bar }}
                          />
                          <span className="font-medium leading-tight">{prod.name}</span>
                        </div>
                        {status && (
                          <span className={`text-[10px] shrink-0 ml-1 font-medium ${
                            status === '수령중' ? 'text-emerald-600' :
                            status === '종료'   ? 'text-slate-400'   :
                            'text-orange-500'
                          }`}>
                            {status}
                          </span>
                        )}
                      </div>

                      {/* 기관명 */}
                      <p className="text-[11px] text-muted-foreground ml-3.5 mb-2">{prod.institution}</p>

                      {/* 수치 그리드 */}
                      <div className="ml-3.5 space-y-1">

                        {/* 현재 적립금 (인라인 편집 가능) */}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">현재 적립금</span>
                          {balance != null ? (
                            editingKey === prod.balanceKey ? (
                              <div className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  className="w-20 text-right border rounded px-1.5 text-[13px] h-6 bg-background"
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && confirmEdit()}
                                  onBlur={confirmEdit}
                                />
                                <span className="text-[11px] text-muted-foreground">만원</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(prod.balanceKey, balance)}
                                className="flex items-center gap-1 font-medium hover:text-primary group"
                              >
                                {fmtAmt(balance)}
                                <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                              </button>
                            )
                          ) : (
                            <span className="text-muted-foreground/60 italic">미기재</span>
                          )}
                        </div>

                        {/* 65세 월 수령액 */}
                        {prod.key !== 'irp' && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">65세 월 수령</span>
                            <span className={at65 && at65 > 0 ? 'font-medium' : 'text-muted-foreground'}>
                              {at65 && at65 > 0 ? `${at65.toLocaleString()}만` : '미개시'}
                            </span>
                          </div>
                        )}
                        {prod.key === 'irp' && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">수령 방식</span>
                            <span className="text-muted-foreground/80 italic text-[11px]">유연 인출</span>
                          </div>
                        )}

                        {/* 전생애 총 수령액 */}
                        {prod.lifetimeTotal != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">전생애 수령</span>
                            <span className="font-medium">{fmtAmt(prod.lifetimeTotal)}</span>
                          </div>
                        )}
                      </div>

                      {/* 수령 기간 미니 바 */}
                      {prod.startAge && (
                        <div className="mt-2.5 ml-3.5">
                          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 h-full rounded-full"
                              style={{
                                left:  `${((prod.startAge - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
                                width: `${((prod.endAge   - prod.startAge) / (AGE_MAX - AGE_MIN)) * 100}%`,
                                backgroundColor: st.bar,
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                            <span>55세</span>
                            <span>{prod.startAge}~{prod.endAge}세</span>
                            <span>90세</span>
                          </div>
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 하단 고정 합계 */}
      <div className="shrink-0 border-t bg-muted/40 px-3 py-3 space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          전체 요약
        </p>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">세제적격 적립금</span>
          <span className="font-semibold">{fmtAmt(totalBalance)}</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">65세 월 수령 (본인)</span>
          <span className="font-semibold">{total65wan.toLocaleString()}만/월</span>
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">전생애 수령 (본인)</span>
          <span className="font-semibold">{fmtAmt(ownLifetime)}</span>
        </div>
      </div>

      {/* 드래그 리사이즈 핸들 — 오른쪽 가장자리 */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={resetWidth}
        title="드래그하여 너비 조절 · 더블클릭 시 기본값"
        className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize group flex items-center justify-center
          ${dragging ? 'bg-primary/30' : 'hover:bg-primary/20'} transition-colors`}
        style={{ transform: 'translateX(50%)' }}
      >
        <GripVertical
          size={14}
          className={`text-muted-foreground/40 group-hover:text-primary ${dragging ? 'text-primary' : ''}`}
        />
      </div>
    </aside>
  )
}
