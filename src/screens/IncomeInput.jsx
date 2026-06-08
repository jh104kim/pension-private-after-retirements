import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, LabelList,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { usePensionContext } from '@/context/PensionContext'
import { PENSION_ANNUAL } from '@/data/pensionData'
import { CHART_COLORS } from '@/utils/chartColors'
import { cn } from '@/lib/utils'

// ── 마일스톤 나이 (차트 Y축) ──────────────────────────────────
const MILESTONE_AGES = [57, 60, 61, 65, 70, 75, 80]

// ── KPI 카드 ──────────────────────────────────────────────────
function KpiCard({ title, value, sub, alert = false, success = false }) {
  return (
    <Card className={cn(
      'flex-1',
      alert   && 'border-amber-300 bg-amber-50',
      success && 'border-emerald-300 bg-emerald-50',
    )}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground leading-tight">{title}</p>
        <p className={cn(
          'text-xl font-bold mt-1 leading-tight',
          alert   && 'text-amber-700',
          success && 'text-emerald-700',
        )}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── 리스크 체크 항목 ──────────────────────────────────────────
function RiskItem({ icon, title, sub, statusType, statusLabel }) {
  const statusCls = {
    ok:     'text-emerald-600 bg-emerald-50 border-emerald-200',
    warn:   'text-amber-600   bg-amber-50   border-amber-200',
    danger: 'text-red-600     bg-red-50     border-red-200',
    info:   'text-blue-600    bg-blue-50    border-blue-200',
  }
  return (
    <div className="flex items-start gap-2.5 py-2">
      <span className="text-sm leading-none mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium leading-snug text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{sub}</p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          'text-[9px] px-1.5 py-0.5 shrink-0 whitespace-nowrap font-medium',
          statusCls[statusType] ?? statusCls.info,
        )}
      >
        {statusLabel}
      </Badge>
    </div>
  )
}

// ── 소득 입력 행 ──────────────────────────────────────────────
function IncomeRow({ label, value, onChange, unit, note, badgeText, badgeType }) {
  const badgeCls = {
    neutral: 'text-slate-500 border-slate-200',
    active:  'text-blue-600  border-blue-200  bg-blue-50',
    danger:  'text-red-600   border-red-300   bg-red-50',
    cyan:    'text-cyan-600  border-cyan-300  bg-cyan-50',
  }
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {badgeText && (
          <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', badgeCls[badgeType] ?? badgeCls.neutral)}>
            {badgeText}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-9 text-right font-mono text-sm"
          placeholder="0"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap w-14 shrink-0">{unit}</span>
      </div>
      {note && (
        <p className="mt-1.5 text-[10px] text-muted-foreground leading-snug">{note}</p>
      )}
    </div>
  )
}

// ── 메인 화면 ─────────────────────────────────────────────────
export default function IncomeInput() {
  const { income, setIncome, cashFlowByAge } = usePensionContext()

  // ── 입력 표시값 ── context 단위: 천원/월 ──────────────────
  // rental / labor : 만원/월 (÷10)
  // financial / other : 만원/년 (천원/월 × 12 ÷ 10)
  const [fields, setFields] = useState({
    rental:    Math.round(income.rental    / 10),         // 만원/월
    labor:     Math.round(income.labor     / 10),         // 만원/월
    financial: Math.round(income.financial * 12 / 10),   // 만원/년
    other:     Math.round(income.other     * 12 / 10),   // 만원/년
  })

  function updateField(key, raw) {
    const n = Math.max(0, parseInt(raw) || 0)
    const next = { ...fields, [key]: n }
    setFields(next)
    setIncome({
      rental:    next.rental    * 10,                       // 만원/월 → 천원/월
      labor:     next.labor     * 10,                       // 만원/월 → 천원/월
      financial: Math.round(next.financial * 10 / 12),     // 만원/년 → 천원/월
      other:     Math.round(next.other     * 10 / 12),     // 만원/년 → 천원/월
    })
  }

  // ── 65세 기준 cashFlow 행 ─────────────────────────────────
  const flow65 = useMemo(
    () => cashFlowByAge.find(r => r.age === 65) ?? {},
    [cashFlowByAge],
  )

  // ── 파생 KPI (모두 만원/月) ───────────────────────────────
  const pension65     = (flow65.total ?? 0) - (flow65.rental ?? 0)  // 연금만
  const rentalMonthly = flow65.rental ?? 0
  const laborMonthly  = Math.round(income.labor     / 10)
  const finMonthly    = Math.round(income.financial / 10)
  const otherMonthly  = Math.round(income.other     / 10)
  const otherIncome   = rentalMonthly + laborMonthly + finMonthly + otherMonthly
  const totalAt65     = pension65 + otherIncome

  // ── 종합과세 판정 ─────────────────────────────────────────
  const rentalAnnualMw           = fields.rental    * 12   // 만원/년
  const financialAnnualMw        = fields.financial        // 만원/년 (직접 입력)
  const isRentalComprehensive    = rentalAnnualMw    > 2_000
  const isFinancialComprehensive = financialAnnualMw > 2_000

  // ── 사적연금 65세 기준 (연금저축, 천원/년 → 만원/년) ──────
  const savingsAnnualMw = Math.round(PENSION_ANNUAL.savings[10] / 10)  // index 10 = 65세

  // ── 가로 누적 바 차트 데이터 ──────────────────────────────
  const chartData = useMemo(() => {
    const lMo = Math.round(income.labor     / 10)
    const fMo = Math.round(income.financial / 10)
    const oMo = Math.round(income.other     / 10)

    return MILESTONE_AGES.map(age => {
      const flow    = cashFlowByAge.find(r => r.age === age) ?? {}
      const pension = Math.max(0, (flow.total ?? 0) - (flow.rental ?? 0))
      const rental  = flow.rental ?? 0
      const etc     = lMo + fMo + oMo
      const total   = pension + rental + etc
      return { age: `${age}세`, 연금소득: pension, 임대소득: rental, 기타소득: etc, total }
    })
  }, [cashFlowByAge, income])

  const maxTotal = useMemo(
    () => Math.ceil(Math.max(...chartData.map(d => d.total)) / 100) * 100 + 100,
    [chartData],
  )

  return (
    <div className="h-full p-6 flex flex-col gap-3">

      {/* ── KPI 행 ─────────────────────────────────────────── */}
      <div className="h-[84px] shrink-0 flex gap-3">
        <KpiCard
          title="총 월 소득 (65세 기준)"
          value={`${totalAt65.toLocaleString('ko-KR')}만원`}
          sub="연금 + 임대 + 기타 합산 · 세전 추정"
        />
        <KpiCard
          title="연금 수령액 (65세)"
          value={`${pension65.toLocaleString('ko-KR')}만원`}
          sub="9개 상품 합산 · 세전 · 임대 제외"
        />
        <KpiCard
          title="기타 소득 / 월 (65세)"
          value={`${otherIncome.toLocaleString('ko-KR')}만원`}
          sub={`임대 ${rentalMonthly}만 · 근로 ${laborMonthly}만 · 금융 ${finMonthly}만`}
        />
        <KpiCard
          title="종합과세 판단"
          value={isRentalComprehensive ? '⚠ 종합과세 해당' : '✅ 분리과세 가능'}
          sub={isRentalComprehensive
            ? `임대 연 ${rentalAnnualMw.toLocaleString()}만원 > 2,000만원`
            : `임대 연 ${rentalAnnualMw.toLocaleString()}만원 ≤ 2,000만원`}
          alert={isRentalComprehensive}
          success={!isRentalComprehensive}
        />
      </div>

      {/* ── 본문 2분할 ─────────────────────────────────────── */}
      <div
        className="flex-1 grid gap-3 overflow-hidden"
        style={{ gridTemplateColumns: '376px 1fr' }}
      >

        {/* ── 좌: 소득 입력 패널 ──────────────────────────── */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-4 shrink-0">
            <CardTitle className="text-sm">은퇴 후 소득 입력</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 overflow-y-auto">

            {/* ① 임대소득 */}
            <IncomeRow
              label="임대소득"
              value={fields.rental}
              onChange={v => updateField('rental', v)}
              unit="만원/월"
              badgeText="주요 소득"
              badgeType="cyan"
              note={
                `연간 ${rentalAnnualMw.toLocaleString()}만원` +
                `  ·  단순경비율 42.6% 적용 시 과세소득 약 ${Math.round(rentalAnnualMw * 0.574).toLocaleString()}만원/년`
              }
            />

            <Separator />

            {/* ② 근로소득 */}
            <IncomeRow
              label="근로소득"
              value={fields.labor}
              onChange={v => updateField('labor', v)}
              unit="만원/월"
              badgeText={fields.labor === 0 ? '미입력' : '입력됨'}
              badgeType={fields.labor === 0 ? 'neutral' : 'active'}
              note={fields.labor > 0
                ? '※ 근로+연금소득 합산 시 종합과세 대상 여부 확인 필요 (확인 필요)'
                : undefined}
            />

            <Separator />

            {/* ③ 금융소득 */}
            <IncomeRow
              label="금융소득 (이자·배당)"
              value={fields.financial}
              onChange={v => updateField('financial', v)}
              unit="만원/년"
              badgeText={isFinancialComprehensive ? '종합과세' : '분리과세 가능'}
              badgeType={isFinancialComprehensive ? 'danger' : 'neutral'}
              note="※ 2,000만원 초과 시 종합과세 전환 · 14% 분리과세 불가 (추정)"
            />

            <Separator />

            {/* ④ 기타소득 */}
            <IncomeRow
              label="기타소득"
              value={fields.other}
              onChange={v => updateField('other', v)}
              unit="만원/년"
              badgeText={fields.other === 0 ? '미입력' : '입력됨'}
              badgeType={fields.other === 0 ? 'neutral' : 'active'}
              note="※ 기타소득금액 300만원 초과 시 종합과세 대상"
            />

          </CardContent>
        </Card>

        {/* ── 우: 차트 + 리스크 체크리스트 ────────────────── */}
        <div className="flex flex-col gap-3 overflow-hidden">

          {/* 가로 누적 바 차트 */}
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
            <CardHeader className="pb-1 pt-3 px-4 shrink-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">은퇴 시점별 소득 구성</CardTitle>
                <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 bg-amber-50 px-1.5 py-0">
                  세전 추정
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-2 pt-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 4, right: 64, left: 4, bottom: 16 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, maxTotal]}
                    tick={{ fontSize: 10 }}
                    unit="만"
                    tickCount={6}
                  />
                  <YAxis
                    type="category"
                    dataKey="age"
                    tick={{ fontSize: 11 }}
                    width={44}
                  />
                  <ReTooltip
                    formatter={(v, name) => [`${v.toLocaleString('ko-KR')}만원`, name]}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10 }}
                    verticalAlign="bottom"
                  />
                  <Bar dataKey="연금소득" stackId="a" fill={CHART_COLORS.national} />
                  <Bar dataKey="임대소득" stackId="a" fill={CHART_COLORS.rental}   />
                  <Bar dataKey="기타소득" stackId="a" fill={CHART_COLORS.labor}    radius={[0, 3, 3, 0]}>
                    <LabelList
                      dataKey="total"
                      position="right"
                      formatter={v => `${v.toLocaleString('ko-KR')}만`}
                      style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 소득 리스크 체크리스트 */}
          <Card className="h-[210px] shrink-0 flex flex-col overflow-hidden">
            <CardHeader className="pb-1 pt-3 px-4 shrink-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">소득 리스크 체크리스트</CardTitle>
                <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-300 bg-amber-50 px-1.5 py-0">
                  추정 · 확인 필요
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-2 flex-1 overflow-hidden">
              <div className="divide-y">

                {/* T1 사적연금 1,200만원 분기점 */}
                <RiskItem
                  icon="💰"
                  title={`사적연금 1,200만원 분기점 — 연금저축 연 ${savingsAnnualMw}만원`}
                  sub="현재 분리과세 유지 · IRP 인출 합산 시 한도 초과 여부 재확인 필요 (확인 필요)"
                  statusType={savingsAnnualMw <= 1_200 ? 'ok' : 'warn'}
                  statusLabel={savingsAnnualMw <= 1_200 ? '✅ 분리과세 유지' : '⚠ 합산 확인'}
                />

                {/* T2 임대소득 종합과세 */}
                <RiskItem
                  icon="🏠"
                  title={`임대소득 종합과세 — 연 ${rentalAnnualMw.toLocaleString()}만원`}
                  sub={isRentalComprehensive
                    ? '2,000만원 초과 → 종합과세 의무 · 단순경비율 42.6% 필요경비 적용 (추정)'
                    : '2,000만원 이하 → 14% 분리과세 선택 가능 (추정)'}
                  statusType={isRentalComprehensive ? 'warn' : 'ok'}
                  statusLabel={isRentalComprehensive ? '⚠ 종합과세' : '✅ 분리과세 가능'}
                />

                {/* T3 피부양자 탈락 */}
                <RiskItem
                  icon="🏥"
                  title="피부양자 자격 — 건강보험"
                  sub={isRentalComprehensive
                    ? '임대소득 2,000만원 초과 → 피부양자 탈락 확정 · 지역가입자 전환 (공단 확인 필요)'
                    : '임대소득 2,000만원 이하 → 피부양자 유지 가능 · 재산 기준 별도 확인 필요'}
                  statusType={isRentalComprehensive ? 'danger' : 'info'}
                  statusLabel={isRentalComprehensive ? '❌ 탈락 확정' : '▶ 재산 기준 확인'}
                />

                {/* T4 금융소득 2,000만원 */}
                <RiskItem
                  icon="💳"
                  title={`금융소득 2,000만원 기준 — 연 ${financialAnnualMw.toLocaleString()}만원`}
                  sub={isFinancialComprehensive
                    ? '2,000만원 초과 → 금융소득 종합과세 · 전체 소득 합산 적용 (확인 필요)'
                    : '2,000만원 이하 → 14% 분리과세 유지 가능 (추정)'}
                  statusType={isFinancialComprehensive ? 'warn' : 'ok'}
                  statusLabel={isFinancialComprehensive ? '⚠ 종합과세' : '✅ 분리과세 가능'}
                />

              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
