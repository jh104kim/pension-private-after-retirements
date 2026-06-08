import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, LabelList,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  localSubscriberPremium,
  dependentEligibility,
} from '@/utils/healthInsCalc'
import { PENSION_ANNUAL } from '@/data/pensionData'
import { cn } from '@/lib/utils'

// ── 차트 색상 ─────────────────────────────────────────────────
const COLOR_INCOME = '#F59E0B'   // amber  — 소득보험료
const COLOR_ASSET  = '#F87171'   // red    — 재산보험료

// ── 판정 결과 아이콘 ──────────────────────────────────────────
function ResultIcon({ result }) {
  if (result === 'pass') return <span className="text-emerald-500 text-sm">✅</span>
  if (result === 'fail') return <span className="text-red-500 text-sm">❌</span>
  return <span className="text-slate-400 text-sm">—</span>
}

// ── 차트 커스텀 툴팁 ──────────────────────────────────────────
function HealthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border rounded-md shadow-md p-2.5 text-[11px] min-w-[160px]">
      <p className="font-semibold mb-1.5">
        {label} <span className="text-amber-500 font-normal">(추정)</span>
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-3 leading-5">
          <span style={{ color: p.fill }}>● {p.name}</span>
          <span className="font-mono">{Number(p.value ?? 0).toFixed(1)}만원</span>
        </div>
      ))}
      <div className="border-t mt-1.5 pt-1.5 flex justify-between font-semibold">
        <span>건보+장기요양</span>
        <span className="font-mono text-red-600">
          {((payload[0]?.payload?.totalMonthly) ?? 0).toFixed(0)}만원/월
        </span>
      </div>
    </div>
  )
}

// ── 메인 화면 ─────────────────────────────────────────────────
export default function HealthInsurance() {
  // ── 슬라이더 로컬 상태 ───────────────────────────────────────
  const [rentalManwon, setRentalManwon] = useState(3_600)   // 万원/年
  const [realEstateOk, setRealEstateOk] = useState(26)      // 億원

  // ── 단위 변환 ─────────────────────────────────────────────
  // 1만원/년 × 10 = 10천원/년 = 10,000원/년
  const rentalKw     = rentalManwon * 10      // 千원/年
  const realEstateKw = realEstateOk * 100_000 // 千원

  // ── 57세 기준 건보료 (은퇴 직후 — 국민연금 없음) ─────────────
  const premiumAt57 = useMemo(
    () => localSubscriberPremium(rentalKw, realEstateKw),
    [rentalKw, realEstateKw],
  )

  // ── 피부양자 자격 ───────────────────────────────────────────
  const eligibility = useMemo(
    () => dependentEligibility(rentalKw, realEstateKw),
    [rentalKw, realEstateKw],
  )

  // ── 판정 항목별 계산 ────────────────────────────────────────
  const assetTaxBaseOk = realEstateOk * 0.7 * 0.6     // 億원 (재산세 과표)
  const isIncomeOver   = rentalManwon > 2_000          // 소득 2,000만 초과
  const isAssetAOver   = assetTaxBaseOk > 9            // 과표 9억 초과
  const isAssetBRange  = assetTaxBaseOk > 5.4 && assetTaxBaseOk <= 9
  const isAssetBFail   = isAssetBRange && rentalManwon > 1_000

  // ── 나이별 건보료 차트 데이터 ─────────────────────────────
  const chartData = useMemo(() => {
    const CHART_AGES = [57, 60, 61, 65, 70, 75, 80]
    return CHART_AGES.map(age => {
      const idx = age - 55
      const nationalKw    = idx >= 0 && idx < 36 ? PENSION_ANNUAL.national[idx] : 0
      const r = localSubscriberPremium(nationalKw + rentalKw, realEstateKw)
      return {
        age:         `${age}세`,
        소득보험료:  +(r.income / 10).toFixed(1),
        재산보험료:  +(r.asset  / 10).toFixed(1),
        totalMonthly: +(r.total  / 10).toFixed(1),  // 툴팁용
        totalLabel:  `${Math.round(r.total / 10)}만`,  // 바 위 라벨
      }
    })
  }, [rentalKw, realEstateKw])

  // ── 절감 시나리오 (57세 기준) ─────────────────────────────
  const savingsData = useMemo(() => {
    const base = Math.round(premiumAt57.total / 10)

    // 임대소득 경비 42.6% 적용 (과세소득 기준 재계산)
    const pExpense = localSubscriberPremium(
      Math.round(rentalKw * (1 - 0.426)), realEstateKw,
    )
    const expense = Math.round(pExpense.total / 10)

    // 부동산 50% 매각
    const pHalf = localSubscriberPremium(rentalKw, Math.round(realEstateKw * 0.5))
    const halfRE = Math.round(pHalf.total / 10)

    return [
      { name: '현재 계획',         value: base,    note: '',           isBase: true  },
      { name: '임대 경비 42.6%',   value: expense, note: '과세소득 기준', isBase: false },
      { name: '부동산 50% 매각',   value: halfRE,  note: '재산점수 감소', isBase: false },
      { name: '배우자 직장 피부양', value: 0,       note: '이론상 0원',   isBase: false },
    ]
  }, [premiumAt57, rentalKw, realEstateKw])

  // ── 만원 표시용 파생값 ─────────────────────────────────────
  const pm = {
    income: Math.round(premiumAt57.income / 10),  // 万원/月
    asset:  Math.round(premiumAt57.asset  / 10),
    health: Math.round(premiumAt57.health / 10),
    ltc:    Math.round(premiumAt57.ltc    / 10),
    total:  Math.round(premiumAt57.total  / 10),
  }

  const officialPriceOk   = (realEstateOk * 0.7).toFixed(1)        // 공시가격 추정 (億원)
  const taxBaseEok        = assetTaxBaseOk.toFixed(1)               // 재산세 과표 (億원)

  return (
    <div className="h-full p-6 flex flex-col gap-3">

      {/* ── 상단: 피부양자 자격 상태 배너 (h-[88px]) ──────── */}
      <Card className={cn(
        'h-[88px] shrink-0',
        eligibility.eligible
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-red-300   bg-red-50',
      )}>
        <CardContent className="h-full flex items-center gap-4 px-5">
          <span className="text-2xl select-none">{eligibility.eligible ? '✅' : '❌'}</span>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold',
              eligibility.eligible ? 'text-emerald-700' : 'text-red-700',
            )}>
              {eligibility.eligible
                ? '피부양자 자격 유지 가능'
                : '피부양자 탈락 확정 — 지역가입자 전환 필요'}
            </p>
            {eligibility.reasons.length > 0 && (
              <p className="text-[11px] text-red-600 mt-0.5 truncate">
                이유: {eligibility.reasons.join(' · ')}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              은퇴 시점 (2030년, 57세)부터 지역가입자 전환 → 보험료 별도 납부
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] text-amber-700 border-amber-300 bg-amber-50 shrink-0 whitespace-nowrap"
          >
            ⚠ 추정값 · 공단 확인 필요
          </Badge>
        </CardContent>
      </Card>

      {/* ── 본문 2분할 ─────────────────────────────────────── */}
      <div
        className="flex-1 grid gap-3 overflow-hidden"
        style={{ gridTemplateColumns: '364px 1fr' }}
      >

        {/* ── 좌: 슬라이더 입력 패널 ─────────────────────── */}
        <div className="flex flex-col gap-3 overflow-hidden">

          {/* 소득 기준 슬라이더 */}
          <Card className="shrink-0">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">소득 기준 — 임대소득</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">연간 임대소득</span>
                <span className="text-xl font-bold">
                  {rentalManwon.toLocaleString('ko-KR')}만원/년
                </span>
              </div>
              <Slider
                value={[rentalManwon]}
                onValueChange={([v]) => setRentalManwon(v)}
                min={0}
                max={7_200}
                step={100}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>1,800만</span>
                <span>3,600만</span>
                <span>5,400만</span>
                <span>7,200만</span>
              </div>
              <div className="flex items-center justify-between text-[12px] pt-1 border-t">
                <span className="text-muted-foreground">소득보험료 추정</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-amber-700">
                    약 {pm.income.toLocaleString('ko-KR')}만원/월
                  </span>
                  <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">추정</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 재산 기준 슬라이더 */}
          <Card className="shrink-0">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">재산 기준 — 부동산 시가</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">부동산 시가</span>
                <span className="text-xl font-bold">{realEstateOk.toFixed(1)}억원</span>
              </div>
              <Slider
                value={[realEstateOk]}
                onValueChange={([v]) => setRealEstateOk(parseFloat(v))}
                min={0}
                max={50}
                step={0.5}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>12.5억</span>
                <span>25억</span>
                <span>37.5억</span>
                <span>50억</span>
              </div>
              <div className="space-y-1.5 text-[11px] pt-1 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">공시가격 추정 (시가 × 70%)</span>
                  <span>약 {officialPriceOk}억원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">재산세 과표 (공시 × 60%)</span>
                  <span>약 {taxBaseEok}억원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">재산보험료 추정</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-red-600">
                      약 {pm.asset.toLocaleString('ko-KR')}만원/월
                    </span>
                    <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">추정</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 월 건보료 합계 요약 */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-4 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                월 건강보험료 합계 (57세 기준)
                <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">
                  추정
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {/* 소득보험료 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLOR_INCOME }} />
                    <span className="text-muted-foreground">소득보험료</span>
                  </div>
                  <span className="font-mono font-medium">{pm.income.toLocaleString('ko-KR')}만원</span>
                </div>

                {/* 재산보험료 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLOR_ASSET }} />
                    <span className="text-muted-foreground">재산보험료</span>
                  </div>
                  <span className="font-mono font-medium">{pm.asset.toLocaleString('ko-KR')}만원</span>
                </div>

                {/* 건강보험료 소계 */}
                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">건강보험료 소계</span>
                  <span className="font-mono font-medium">{pm.health.toLocaleString('ko-KR')}만원</span>
                </div>

                {/* 장기요양 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">장기요양보험료 (건보 × 12.95%)</span>
                  <span className="font-mono font-medium">+{pm.ltc.toLocaleString('ko-KR')}만원</span>
                </div>

                {/* 총합 */}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-semibold text-sm">총 건강보험료</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-600">
                      {pm.total.toLocaleString('ko-KR')}만원
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/월</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2">
                ⚠ 금융자산 보험료 미반영 · 점수당 단가 208.4원(2024) · 연도별 변동 가능
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── 우: 차트 + 하단 2분할 ──────────────────────────── */}
        <div className="flex flex-col gap-3 overflow-hidden">

          {/* 나이별 건보료 누적 바 차트 */}
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
            <CardHeader className="pb-1 pt-3 px-4 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                나이별 월 건강보험료 (소득 + 재산, 추정)
                <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">
                  추정
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 pt-0 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 12, left: -8, bottom: 4 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="만" width={42} />
                  <ReTooltip content={<HealthTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="소득보험료" stackId="a" fill={COLOR_INCOME} name="소득보험료" />
                  <Bar dataKey="재산보험료" stackId="a" fill={COLOR_ASSET}  name="재산보험료" radius={[3, 3, 0, 0]}>
                    <LabelList
                      dataKey="totalLabel"
                      position="top"
                      style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 하단 2분할: 피부양자 판정표 + 절감 시나리오 */}
          <div className="h-[204px] shrink-0 flex gap-3">

            {/* 피부양자 자격 판정표 */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                <CardTitle className="text-sm">피부양자 자격 판정표</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-[10px] pl-3 w-16">항목</TableHead>
                      <TableHead className="text-[10px]">기준</TableHead>
                      <TableHead className="text-[10px]">현황</TableHead>
                      <TableHead className="text-[10px] pr-3 text-right w-14">결과</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 소득 기준 */}
                    <TableRow>
                      <TableCell className="text-[11px] pl-3 py-2 font-medium">소득</TableCell>
                      <TableCell className="text-[11px] py-2 text-muted-foreground">연 2,000만원 이하</TableCell>
                      <TableCell className="text-[11px] py-2">
                        연 {rentalManwon.toLocaleString('ko-KR')}만원
                      </TableCell>
                      <TableCell className="text-[11px] py-2 pr-3 text-right">
                        <ResultIcon result={isIncomeOver ? 'fail' : 'pass'} />
                      </TableCell>
                    </TableRow>

                    {/* 재산 기준 A */}
                    <TableRow>
                      <TableCell className="text-[11px] pl-3 py-2 font-medium">재산A</TableCell>
                      <TableCell className="text-[11px] py-2 text-muted-foreground">과표 9억원 이하</TableCell>
                      <TableCell className="text-[11px] py-2">
                        과표 약 {taxBaseEok}억원
                      </TableCell>
                      <TableCell className="text-[11px] py-2 pr-3 text-right">
                        <ResultIcon result={isAssetAOver ? 'fail' : 'pass'} />
                      </TableCell>
                    </TableRow>

                    {/* 재산 기준 B */}
                    <TableRow>
                      <TableCell className="text-[11px] pl-3 py-2 font-medium">재산B</TableCell>
                      <TableCell className="text-[11px] py-2 text-muted-foreground">과표 5.4~9억 + 소득 1,000만↑</TableCell>
                      <TableCell className="text-[11px] py-2 text-muted-foreground">
                        {isAssetBRange
                          ? <span className="text-amber-600">과표 {taxBaseEok}억 (범위 내)</span>
                          : '범위 외'}
                      </TableCell>
                      <TableCell className="text-[11px] py-2 pr-3 text-right">
                        <ResultIcon result={isAssetBFail ? 'fail' : 'none'} />
                      </TableCell>
                    </TableRow>

                    {/* 최종 판정 */}
                    <TableRow className={eligibility.eligible ? 'bg-emerald-50' : 'bg-red-50'}>
                      <TableCell colSpan={3} className="text-[11px] pl-3 py-2 font-semibold">
                        최종 판정
                      </TableCell>
                      <TableCell className="text-[11px] py-2 pr-3 text-right font-bold">
                        {eligibility.eligible
                          ? <span className="text-emerald-700">피부양자 유지</span>
                          : <span className="text-red-700">지역가입자 전환</span>
                        }
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 절감 시나리오 */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  절감 시나리오 비교 (57세)
                  <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1 py-0">
                    추정
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  {savingsData.map((s, i) => {
                    const saving = i === 0 ? null : savingsData[0].value - s.value
                    return (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <div className="min-w-0">
                          <span className={cn(
                            'font-medium',
                            s.isBase ? 'text-red-700' : s.value === 0 ? 'text-emerald-600' : '',
                          )}>
                            {s.name}
                          </span>
                          {s.note && (
                            <span className="text-muted-foreground ml-1 text-[10px]">
                              ({s.note})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn(
                            'font-mono font-semibold',
                            s.isBase  ? 'text-red-600'    :
                            s.value === 0 ? 'text-emerald-600' : 'text-foreground',
                          )}>
                            {s.value.toLocaleString('ko-KR')}만원/월
                          </span>
                          {saving != null && saving > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] text-emerald-600 border-emerald-300 bg-emerald-50 px-1 py-0"
                            >
                              -{saving}만
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  연간 부담(현재): 약 {((savingsData[0]?.value ?? 0) * 12).toLocaleString('ko-KR')}만원
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
