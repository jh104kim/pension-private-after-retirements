import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { usePensionContext } from '@/context/PensionContext'
import { AGES, PENSION_ANNUAL } from '@/data/pensionData'
import {
  comprehensiveIncomeTax,
  pensionIncomeDeduction,
  privatePensionTax,
  dbRetirementTax,
  rentalTaxableIncome,
} from '@/utils/taxCalc'
import { localSubscriberPremium } from '@/utils/healthInsCalc'
import { SCENARIO_IDS, SCENARIO_META } from '@/utils/scenarioCalc'
import { cn } from '@/lib/utils'

// ── 세금 항목 색상 ─────────────────────────────────────────────
const TAX_COLORS = {
  health:     '#06B6D4',   // 건강보험료
  incomeTax:  '#F87171',   // 종합소득세
  privateTax: '#F59E0B',   // 사적연금소득세
  dbTax:      '#8B5CF6',   // DB퇴직소득세
}

// ── 절세 전략 목록 (02-시나리오.md §8) ───────────────────────
const STRATEGIES = [
  { id: 'T1', text: '세제적격 1,200만 이하 유지',  stars: 5, badge: '필수',  badgeCls: 'border-red-200   text-red-600   bg-red-50'   },
  { id: 'T2', text: '비과세 상품 10년+ 유지 확인', stars: 5, badge: '필수',  badgeCls: 'border-red-200   text-red-600   bg-red-50'   },
  { id: 'T3', text: '국민연금 70세 연기 수령',      stars: 4, badge: '권장',  badgeCls: 'border-blue-200  text-blue-600  bg-blue-50'  },
  { id: 'T4', text: 'IRP 57세부터 분산 인출',       stars: 4, badge: '권장',  badgeCls: 'border-blue-200  text-blue-600  bg-blue-50'  },
  { id: 'T5', text: '비과세→적격→공적 순 인출',    stars: 4, badge: '권장',  badgeCls: 'border-blue-200  text-blue-600  bg-blue-50'  },
  { id: 'T6', text: '임대소득 경비 최대화 42.6%',   stars: 3, badge: '참고',  badgeCls: 'border-slate-200 text-slate-500 bg-slate-50' },
]

// ── 별점 ──────────────────────────────────────────────────────
function Stars({ count }) {
  return (
    <span className="text-[11px]">
      <span className="text-amber-400">{'★'.repeat(count)}</span>
      <span className="text-muted-foreground/30">{'★'.repeat(5 - count)}</span>
    </span>
  )
}

// ── 추천 카드 ─────────────────────────────────────────────────
function RecommendCard({ title, net65, savingVsCurrent, highlight }) {
  return (
    <Card className={cn('flex-1 min-w-0', highlight && 'border-emerald-300 bg-emerald-50')}>
      <CardContent className="p-3">
        <p className={cn(
          'text-[11px] font-semibold truncate',
          highlight ? 'text-emerald-700' : 'text-muted-foreground',
        )}>
          {title}
        </p>
        <p className={cn(
          'text-lg font-bold mt-0.5 leading-tight',
          highlight ? 'text-emerald-700' : 'text-foreground',
        )}>
          {net65.toLocaleString('ko-KR')}만원
          <span className="text-[10px] font-normal text-muted-foreground ml-1">세후/월</span>
        </p>
        {savingVsCurrent != null && savingVsCurrent > 0 ? (
          <p className="text-[10px] text-emerald-600 mt-0.5">
            현재 대비 +{savingVsCurrent.toLocaleString('ko-KR')}만원/월 추정
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-0.5">65세 기준 추정</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── 바 차트 커스텀 툴팁 ───────────────────────────────────────
function TaxTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-background border rounded-md shadow-md p-2.5 text-[11px] min-w-[160px]">
      <p className="font-semibold mb-1.5">
        {label} <span className="text-amber-500 font-normal">(추정)</span>
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3 leading-5">
          <span style={{ color: p.fill }}>● {p.name}</span>
          <span className="font-mono">{(p.value ?? 0).toLocaleString('ko-KR')}만원</span>
        </div>
      ))}
      <div className="border-t mt-1.5 pt-1.5 flex justify-between font-semibold">
        <span>합계</span>
        <span className="font-mono">{total.toLocaleString('ko-KR')}만원</span>
      </div>
    </div>
  )
}

// ── 라인 차트 커스텀 툴팁 ─────────────────────────────────────
function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-md shadow-md p-2.5 text-[11px]">
      <p className="font-semibold mb-1">
        {label}세 <span className="text-amber-500 font-normal">(추정)</span>
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 leading-5">
          <span style={{ color: p.stroke }}>
            ● {SCENARIO_META[p.dataKey]?.label ?? p.dataKey}
          </span>
          <span className="font-mono">{(p.value ?? 0).toLocaleString('ko-KR')}만원</span>
        </div>
      ))}
    </div>
  )
}

// ── 메인 화면 ─────────────────────────────────────────────────
export default function TaxScenario() {
  const { income, assets } = usePensionContext()

  // 활성 시나리오 (최소 1개 유지)
  const [active, setActive] = useState(SCENARIO_IDS)

  function toggleScenario(id) {
    setActive(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(x => x !== id) : prev
        : [...prev, id],
    )
  }

  // ── 4개 시나리오 × 36세 계산 ─────────────────────────────────
  const scenarios = useMemo(() => {
    const rentalAnnual = income.rental * 12   // 千원/年
    const realEstate   = assets.realEstate    // 千원

    // DB 퇴직소득세: 수령 기간 20년 (61~80세), 천원/年
    const DB_TAX_ANNUAL = dbRetirementTax(390_000, 30, 20)

    return SCENARIO_IDS.map(id => {
      const byAge = AGES.map((age, i) => {
        // ── 국민연금 (천원/年) ───────────────────────────────
        let nationalAnnual = PENSION_ANNUAL.national[i]

        // 지연 수령: 65~69세 0, 70세+ 136%
        if (id === 'delayed' || id === 'optimal') {
          if      (age >= 65 && age < 70) nationalAnnual = 0
          else if (age >= 70)             nationalAnnual = Math.round(PENSION_ANNUAL.national[i] * 1.36)
        }

        // ── 세제적격 합산 (천원/年) ──────────────────────────
        const savingsAnnual = PENSION_ANNUAL.savings[i]
        // 분산: 57~65세 미만에 IRP 9,620千원/年 추가 → 합계 ≤12,000
        const irpAnnual = (id === 'spread' || id === 'optimal') && age >= 57 && age < 65
          ? 9_620 : 0
        const qualifiedAnnual = savingsAnnual + irpAnnual  // 천원/年

        // ── 세제비적격 합산 (천원/年) ────────────────────────
        const nontaxAnnual =
          PENSION_ANNUAL.guaranteed[i] + PENSION_ANNUAL.nohup[i] +
          PENSION_ANNUAL.indexUp[i]    + PENSION_ANNUAL.ourChild1[i] +
          PENSION_ANNUAL.smartTop[i]   + PENSION_ANNUAL.ourChild2[i]

        const dbAnnual = PENSION_ANNUAL.db[i]

        // ── 세전 월수령액 (만원/月) ──────────────────────────
        const grossMonthly = Math.round(
          (nationalAnnual + qualifiedAnnual + nontaxAnnual + dbAnnual + rentalAnnual) / 10 / 12,
        )

        // ── 건강보험료 지역가입자 추정 (천원/月) ──────────────
        const { total: healthMonthlyKw } = localSubscriberPremium(
          nationalAnnual + rentalAnnual, realEstate,
        )
        const healthManwon = Math.round(healthMonthlyKw / 10)  // 만원/月

        // ── 사적연금소득세 (천원/年 → 만원/月) ───────────────
        const privateTaxKw     = qualifiedAnnual > 0 ? privatePensionTax(qualifiedAnnual, age).tax : 0
        const privateTaxManwon = Math.round(privateTaxKw / 10 / 12)

        // ── 종합소득세 (국민연금 + 임대, 천원/年 → 만원/月) ──
        const nationalTaxable = nationalAnnual > 0
          ? Math.max(0, nationalAnnual - pensionIncomeDeduction(nationalAnnual)) : 0
        const rentalTaxable   = rentalAnnual > 0 ? rentalTaxableIncome(rentalAnnual) : 0
        const incomeTaxKw     = comprehensiveIncomeTax(nationalTaxable + rentalTaxable)
        const incomeTaxManwon = Math.round(incomeTaxKw / 10 / 12)

        // ── DB 퇴직소득세 (61~80세, 천원/年 → 만원/月) ───────
        const dbTaxKw     = age >= 61 && age <= 80 ? DB_TAX_ANNUAL : 0
        const dbTaxManwon = Math.round(dbTaxKw / 10 / 12)

        // ── 세후 ──────────────────────────────────────────────
        const totalDeduct = healthManwon + privateTaxManwon + incomeTaxManwon + dbTaxManwon
        const netMonthly  = Math.max(0, grossMonthly - totalDeduct)

        return {
          age,
          gross:      grossMonthly,
          net:        netMonthly,
          health:     healthManwon,
          privateTax: privateTaxManwon,
          incomeTax:  incomeTaxManwon,
          dbTax:      dbTaxManwon,
          totalDeduct,
        }
      })

      const at65 = byAge.find(d => d.age === 65) ?? {}
      return { id, ...SCENARIO_META[id], byAge, at65 }
    })
  }, [income, assets])

  // ── 65세 누적 바 차트 데이터 ─────────────────────────────────
  const barData = useMemo(() =>
    scenarios.map(s => ({
      name:    s.label,
      건보료:   s.at65.health     ?? 0,
      종합소득세: s.at65.incomeTax  ?? 0,
      사적연금세: s.at65.privateTax ?? 0,
      'DB퇴직세': s.at65.dbTax     ?? 0,
    })),
  [scenarios])

  // ── 55~90세 라인 차트 데이터 ─────────────────────────────────
  const lineData = useMemo(() =>
    AGES.map((age, i) => {
      const row = { age }
      scenarios.forEach(s => { row[s.id] = s.byAge[i].net })
      return row
    }),
  [scenarios])

  // ── 추천 카드 값 ─────────────────────────────────────────────
  const currentNet65 = scenarios.find(s => s.id === 'current')?.at65.net ?? 0
  const optimalNet65 = scenarios.find(s => s.id === 'optimal')?.at65.net ?? 0
  const saving       = Math.max(0, optimalNet65 - currentNet65)

  return (
    <div className="h-full p-6 flex flex-col gap-3">

      {/* ── 시나리오 토글 행 ──────────────────────────────────── */}
      <div className="h-11 shrink-0 flex items-center gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">시나리오 선택</span>
        <div className="flex gap-1.5">
          {SCENARIO_IDS.map(id => {
            const isOn = active.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleScenario(id)}
                className="h-8 px-3 text-xs rounded border font-medium transition-all"
                style={{
                  backgroundColor: isOn ? SCENARIO_META[id].color : 'transparent',
                  borderColor:     SCENARIO_META[id].color,
                  color:           isOn ? '#ffffff' : SCENARIO_META[id].color,
                  opacity:         isOn ? 1 : 0.65,
                }}
              >
                {SCENARIO_META[id].label}
              </button>
            )
          })}
        </div>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] text-amber-700 border-amber-300 bg-amber-50 whitespace-nowrap"
        >
          ⚠ 모든 세금·건보료 수치는 추정값 — 공단·세무서 확인 필요
        </Badge>
      </div>

      {/* ── 본문 3분할 ───────────────────────────────────────── */}
      <div
        className="flex-1 grid gap-3 overflow-hidden"
        style={{ gridTemplateColumns: '348px 1fr 256px' }}
      >

        {/* 좌: 65세 세금 비교 + 추천 카드 */}
        <div className="flex flex-col gap-3 overflow-hidden">

          {/* 65세 누적 바 차트 */}
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
            <CardHeader className="pb-1 pt-3 px-4 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                세금·건보료 비교 (65세 기준)
                <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">
                  추정
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 pt-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 4, right: 8, left: -8, bottom: 4 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="만" width={42} />
                  <ReTooltip content={<TaxTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="건보료"    stackId="a" fill={TAX_COLORS.health}     />
                  <Bar dataKey="종합소득세" stackId="a" fill={TAX_COLORS.incomeTax}  />
                  <Bar dataKey="사적연금세" stackId="a" fill={TAX_COLORS.privateTax} />
                  <Bar dataKey="DB퇴직세"  stackId="a" fill={TAX_COLORS.dbTax}      radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 추천 카드 2개 */}
          <div className="h-[82px] shrink-0 flex gap-2">
            <RecommendCard
              title="✅ 분산+지연 수령 (최적)"
              net65={optimalNet65}
              savingVsCurrent={saving}
              highlight
            />
            <RecommendCard
              title="현재 계획 유지"
              net65={currentNet65}
            />
          </div>
        </div>

        {/* 중: 세후 월수령액 라인 차트 */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-4 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              세후 월수령액 (55~90세)
              <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">
                추정
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2 pt-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 4, right: 12, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="age"
                  type="number"
                  domain={[55, 90]}
                  ticks={[55, 60, 65, 70, 75, 80, 85, 90]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `${v}세`}
                />
                <YAxis tick={{ fontSize: 10 }} unit="만" width={46} />
                <ReTooltip content={<LineTooltip />} />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={value => SCENARIO_META[value]?.label ?? value}
                />
                {SCENARIO_IDS.filter(id => active.includes(id)).map(id => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    stroke={SCENARIO_META[id].color}
                    dot={false}
                    strokeWidth={2.5}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 우: 절세 전략 테이블 */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-4 shrink-0">
            <CardTitle className="text-sm">절세 전략</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-[10px] w-7 pl-3">No</TableHead>
                  <TableHead className="text-[10px]">전략</TableHead>
                  <TableHead className="text-[10px] w-12 pr-3 text-right">분류</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STRATEGIES.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="py-2.5 pl-3 text-[10px] text-muted-foreground font-mono align-top">
                      {s.id}
                    </TableCell>
                    <TableCell className="py-2.5 pr-2">
                      <p className="text-[11px] leading-snug mb-0.5">{s.text}</p>
                      <Stars count={s.stars} />
                    </TableCell>
                    <TableCell className="py-2.5 pr-3 align-top">
                      <Badge
                        variant="outline"
                        className={cn('text-[9px] px-1 py-0 whitespace-nowrap', s.badgeCls)}
                      >
                        {s.badge}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
