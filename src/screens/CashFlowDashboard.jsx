import { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { usePensionContext } from '@/context/PensionContext'
import { comprehensiveIncomeTax, pensionIncomeDeduction } from '@/utils/taxCalc'
import { CHART_COLORS } from '@/utils/chartColors'
import { cn } from '@/lib/utils'

// ── 상수 ─────────────────────────────────────────────────────────────
const BAR_KEYS   = ['nontax', 'savings', 'dbTotal', 'national', 'rental']
const BAR_LABELS = {
  nontax:   '본인 변액·개인(비과세)',
  savings:  '연금저축',
  dbTotal:  'DB퇴직연금(이율보증형 포함)',
  national: '국민연금',
  rental:   '임대소득',
}
const BAR_COLORS = {
  nontax:   CHART_COLORS.nontax,
  savings:  CHART_COLORS.savings,
  dbTotal:  CHART_COLORS.db,
  national: CHART_COLORS.national,
  rental:   CHART_COLORS.rental,
}
const MILESTONE_COLOR_MAP = {
  orange:  'border-orange-200 bg-orange-50',
  emerald: 'border-emerald-200 bg-emerald-50',
  blue:    'border-blue-200 bg-blue-50',
  red:     'border-red-200 bg-red-50',
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────

/** 커스텀 Recharts Tooltip */
function PensionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const bars = payload.filter(e => BAR_KEYS.includes(e.dataKey) && (e.value ?? 0) > 0)
  const netEntry = payload.find(e => e.dataKey === 'net')
  const grossTotal = bars.reduce((s, e) => s + (e.value ?? 0), 0)
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs min-w-[196px]">
      <p className="font-semibold mb-2 text-sm">{label}세</p>
      {bars.map(entry => (
        <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: BAR_COLORS[entry.dataKey] }}>
            {BAR_LABELS[entry.dataKey]}
          </span>
          <span className="font-medium tabular-nums">
            {Math.round(entry.value).toLocaleString('ko-KR')}만
          </span>
        </div>
      ))}
      <Separator className="my-1.5" />
      {payload[0]?.payload?.childTransfer > 0 && (
        <div className="flex justify-between gap-4 py-0.5" style={{ color: CHART_COLORS.child }}>
          <span>자녀 양도 예정</span>
          <span className="font-medium tabular-nums">
            {Math.round(payload[0].payload.childTransfer).toLocaleString('ko-KR')}만
          </span>
        </div>
      )}
      {payload[0]?.payload?.childTransfer > 0 && <Separator className="my-1.5" />}
      <div className="flex justify-between font-semibold">
        <span>본인 합계 (세전)</span>
        <span className="tabular-nums">{Math.round(grossTotal).toLocaleString('ko-KR')}만원</span>
      </div>
      {netEntry?.value != null && (
        <div className="flex justify-between mt-1" style={{ color: CHART_COLORS.deduct }}>
          <span>세후 추정 ⚠️</span>
          <span className="tabular-nums">{Math.round(netEntry.value).toLocaleString('ko-KR')}만원</span>
        </div>
      )}
    </div>
  )
}

/** KPI 카드 */
function KpiCard({ title, value, sub, highlight = false }) {
  return (
    <Card className={cn('flex-1', highlight && 'border-blue-200 bg-blue-50')}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground leading-tight">{title}</p>
        <p className={cn(
          'text-xl font-bold mt-1 leading-tight',
          highlight ? 'text-blue-600' : 'text-foreground',
        )}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

/** 마일스톤 카드 */
function MilestoneCard({ year, age, title, items, color }) {
  return (
    <Card className={cn('flex-1', MILESTONE_COLOR_MAP[color])}>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground">{year}년 · {age}세</p>
        <p className="text-xs font-semibold mt-0.5 leading-snug">{title}</p>
        <ul className="mt-1.5 space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-[11px] text-muted-foreground leading-snug">• {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ── 메인 화면 ─────────────────────────────────────────────────────────
export default function CashFlowDashboard() {
  const [showAfterTax, setShowAfterTax] = useState(false)
  const { cashFlowByAge, healthByAge } = usePensionContext()

  /**
   * 세후 추정 포함 차트 데이터
   * - 사적연금(세제적격): 분리과세 5.5%
   * - 국민연금 + 임대소득: 연금소득공제 + 종합소득세 (추정)
   * - 건강보험료: healthByAge[i].total (千원/月 → 万원/月)
   */
  const chartData = useMemo(() =>
    cashFlowByAge.map((row, i) => {
      // 1) 사적연금 분리과세 (5.5%, 지방세 포함)
      const qualifiedTaxMonthly = (row.dbTotal + row.savings) * 0.055

      // 2) 국민연금 + 임대 종합소득세 (taxCalc 함수는 千원 기준)
      //    万원/月 → 千원/年 변환: × 12 × 10
      const nationalKY = row.national * 120       // 千원/年
      const rentalKY   = row.rental   * 120       // 千원/年
      const deductK    = pensionIncomeDeduction(nationalKY)
      const natTaxableK = Math.max(0, nationalKY - deductK)
      const rentTaxableK = rentalKY * (1 - 0.426) // 단순경비율 42.6%
      const combinedK  = Math.max(0, natTaxableK + rentTaxableK - 3_000) // 기본공제 300万=3000千
      const annualTaxK = comprehensiveIncomeTax(combinedK)
      const incomeTaxMonthly = annualTaxK / 10 / 12  // 千원/年 → 万원/月

      // 3) 건강보험료 (千원/月 → 万원/月)
      const healthMonthly = (healthByAge[i]?.total ?? 0) / 10

      const totalDeduct = qualifiedTaxMonthly + incomeTaxMonthly + healthMonthly
      const net = Math.max(0, Math.round(row.total - totalDeduct))

      return { ...row, net }
    }),
  [cashFlowByAge, healthByAge])

  // KPI 파생값
  const at57 = chartData.find(r => r.age === 57)
  const at64 = chartData.find(r => r.age === 64)
  const at65 = chartData.find(r => r.age === 65)
  const at70 = chartData.find(r => r.age === 70)

  const v57     = at57?.total  ?? 0
  const v70     = at70?.total  ?? 0
  const jump65  = (at65?.total ?? 0) - (at64?.total ?? 0)
  const net65   = at65?.net    ?? 0

  return (
    <div className="h-full p-6 flex flex-col gap-4">

      {/* ── KPI 행 (h-24) ──────────────────────────────────────────── */}
      <div className="flex gap-3 h-24 shrink-0">
        <KpiCard
          title="은퇴 직후 (57세)"
          value={`${v57.toLocaleString('ko-KR')}만원/월`}
          sub="연금+임대, 세전 기준"
        />
        <KpiCard
          title="피크 수령 (70세)"
          value={`${v70.toLocaleString('ko-KR')}만원/월`}
          sub="연금+임대 합산"
          highlight
        />
        <KpiCard
          title="국민연금 개시 증가 (65세)"
          value={`+${jump65.toLocaleString('ko-KR')}만원`}
          sub="64세 대비 월 수령 증가"
        />
        <KpiCard
          title="세후 추정 (65세) ⚠️"
          value={`~${net65.toLocaleString('ko-KR')}만원/월`}
          sub="세금·건보료 차감 추정값"
        />
      </div>

      {/* ── 메인 차트 (flex-1) ─────────────────────────────────────── */}
      <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
        <CardHeader className="pb-2 pt-3 px-4 shrink-0 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">나이별 월 수령액 (만원)</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">세전</span>
            <Switch checked={showAfterTax} onCheckedChange={setShowAfterTax} />
            <span className="text-xs text-muted-foreground">세후 추정</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-2 pt-0 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              barCategoryGap="10%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />

              <XAxis
                dataKey="age"
                ticks={[55, 57, 60, 61, 65, 70, 75, 81, 85, 90]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={v => `${v}세`}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}만`}
                domain={[0, 1400]}
                width={46}
              />

              <ReTooltip content={<PensionTooltip />} />

              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              />

              {/* 누적 바 — 아래부터: 본인 비과세 → savings → DB합계 → national → rental */}
              <Bar dataKey="nontax"   name={BAR_LABELS.nontax}
                   stackId="a" fill={BAR_COLORS.nontax}   isAnimationActive={false} />
              <Bar dataKey="savings"  name={BAR_LABELS.savings}
                   stackId="a" fill={BAR_COLORS.savings}  isAnimationActive={false} />
              <Bar dataKey="dbTotal"  name={BAR_LABELS.dbTotal}
                   stackId="a" fill={BAR_COLORS.dbTotal}  isAnimationActive={false} />
              <Bar dataKey="national" name={BAR_LABELS.national}
                   stackId="a" fill={BAR_COLORS.national} isAnimationActive={false} />
              <Bar dataKey="rental"   name={BAR_LABELS.rental}
                   stackId="a" fill={BAR_COLORS.rental}   isAnimationActive={false} />

              {/* 세후 추정 점선 (Toggle ON 시) */}
              {showAfterTax && (
                <Line
                  dataKey="net"
                  name="세후 추정"
                  stroke={CHART_COLORS.deduct}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
              )}

              {/* 마일스톤 수직선 */}
              <ReferenceLine
                x={57}
                stroke="#F97316"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{ value: '은퇴', position: 'insideTopLeft',
                         fontSize: 9, fill: '#F97316', dy: -4 }}
              />
              <ReferenceLine
                x={65}
                stroke={CHART_COLORS.national}
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{ value: '국민연금', position: 'insideTopLeft',
                         fontSize: 9, fill: CHART_COLORS.national, dy: -4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── 마일스톤 카드 (h-[148px]) ──────────────────────────────── */}
      <div className="flex gap-3 h-[148px] shrink-0">
        <MilestoneCard
          year={2030} age={57}
          title="🏁 은퇴"
          items={[
            `월 ${v57.toLocaleString('ko-KR')}만원 (세전)`,
            '급여소득 종료',
            '지역가입자 전환',
          ]}
          color="orange"
        />
        <MilestoneCard
          year={2034} age={61}
          title="DB 퇴직연금 개시"
          items={[
            `+${(at65 ? Math.round(chartData.find(r=>r.age===61)?.db ?? 0) : 77)}만원/월`,
            'DB채권형 61~80세 수령',
            '건보 소득점수 증가',
          ]}
          color="emerald"
        />
        <MilestoneCard
          year={2038} age={65}
          title="⭐ 국민연금 개시"
          items={[
            `+${jump65.toLocaleString('ko-KR')}만원/월`,
            '종합소득세 대폭 증가',
            '인덱스Up·스마트Top 개시',
          ]}
          color="blue"
        />
        <MilestoneCard
          year={2047} age={75}
          title="⚠️ 이율보증형(DB)·노후적립 종료"
          items={[
            '월 약 314만원 감소',
            'DB채권형은 80세까지 지속',
            '우리아이 1·2는 자녀 양도 예정',
          ]}
          color="red"
        />
      </div>
    </div>
  )
}
