import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Label,
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
import { CHART_COLORS } from '@/utils/chartColors'
import { cn } from '@/lib/utils'

// ── 세제 구분 배지 ────────────────────────────────────────────
const TAX_BADGE_CONFIG = {
  public:    { label: '공적연금', cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
  qualified: { label: '세제적격', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  nontax:    { label: '비 과 세', cls: 'bg-green-100  text-green-700  border-green-200'  },
}
function TaxBadge({ type }) {
  const { label, cls } = TAX_BADGE_CONFIG[type]
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cls)}>
      {label}
    </Badge>
  )
}

// ── KPI 카드 ──────────────────────────────────────────────────
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

// ── 연금 계좌 메타 (정적 — 수령 기간·기관·세제 구분) ──────────
// 사용자 요구사항 반영 수령 기간:
//   DB퇴직연금: 61~80세 | nohup: 55~74세
//   indexUp·smartTop: 65~90세 | ourChild1·ourChild2: 60~90세
const PENSION_META = [
  { institution: '국민연금공단', name: '노령연금',    key: 'national',   age: '65세~',   taxType: 'public' },
  { institution: '삼성증권',    name: 'DB 채권형',   key: 'db',         age: '61~80세', taxType: 'qualified', balance: '3.9억' },
  { institution: '삼성생명',    name: '이율보증형',   key: 'guaranteed', age: '55~74세', taxType: 'nontax' },
  { institution: '삼성생명',    name: '노후적립',    key: 'nohup',      age: '55~74세', taxType: 'nontax' },
  { institution: '삼성생명',    name: '인덱스Up',    key: 'indexUp',    age: '65~90세', taxType: 'nontax' },
  { institution: '삼성생명',    name: '우리아이 1',  key: 'ourChild1',  age: '60~90세', taxType: 'nontax' },
  { institution: '삼성생명',    name: '스마트Top',   key: 'smartTop',   age: '65~90세', taxType: 'nontax' },
  { institution: '삼성생명',    name: '우리아이 2',  key: 'ourChild2',  age: '60~90세', taxType: 'nontax' },
  { institution: '삼성생명',    name: '연금저축골드', key: 'savings',    age: '56~90세', taxType: 'qualified', balance: '6천만' },
  { institution: '(별도)',      name: 'IRP',         key: null,         age: '미정',    taxType: 'qualified', balance: '6천만' },
]

// ── 연금 계좌 목록 테이블 ────────────────────────────────────
function PensionTable({ row65 }) {
  return (
    <div className="overflow-y-auto h-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="text-[11px] w-24">기관</TableHead>
            <TableHead className="text-[11px]">상품명</TableHead>
            <TableHead className="text-[11px] text-right w-[88px]">65세 월수령</TableHead>
            <TableHead className="text-[11px] w-20">수령 기간</TableHead>
            <TableHead className="text-[11px] w-[72px]">구분</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PENSION_META.map((meta, idx) => {
            const monthly = meta.key ? (row65[meta.key] ?? null) : null
            return (
              <TableRow key={idx} className="text-[11px]">
                <TableCell className="py-2.5 text-muted-foreground">{meta.institution}</TableCell>
                <TableCell className="py-2.5 font-medium">
                  {meta.name}
                  {meta.balance && (
                    <span className="ml-1 text-[10px] text-muted-foreground">({meta.balance})</span>
                  )}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono">
                  {monthly != null ? `${monthly.toLocaleString('ko-KR')}만원` : '—'}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground">{meta.age}</TableCell>
                <TableCell className="py-2.5"><TaxBadge type={meta.taxType} /></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ── 도넛 차트 중앙 라벨 ──────────────────────────────────────
function DonutCenterLabel({ viewBox, total }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text
        x={cx} y={cy - 8}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 15, fontWeight: 700, fill: '#0f172a' }}
      >
        {total.toLocaleString('ko-KR')}만원
      </text>
      <text
        x={cx} y={cy + 11}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: 10, fill: '#94a3b8' }}
      >
        65세 기준/월
      </text>
    </g>
  )
}

// ── 도넛 차트 (65세 기준 수령액 구성) ────────────────────────
function PensionPieChart({ row65 }) {
  const pensionTotal = (row65.total ?? 0) - (row65.rental ?? 0)

  const data = useMemo(() => [
    { name: '세제비적격(비과세)', value: row65.nontax   ?? 0, color: CHART_COLORS.nontax   },
    { name: '국민연금',          value: row65.national ?? 0, color: CHART_COLORS.national },
    { name: 'DB퇴직연금',        value: row65.db       ?? 0, color: CHART_COLORS.db       },
    { name: '연금저축',          value: row65.savings  ?? 0, color: CHART_COLORS.savings  },
  ], [row65])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="42%"
          innerRadius="32%"
          outerRadius="52%"
          paddingAngle={2}
          dataKey="value"
          isAnimationActive
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
          <Label
            content={<DonutCenterLabel total={pensionTotal} />}
            position="center"
          />
        </Pie>

        <ReTooltip
          formatter={(value, name) => [`${value.toLocaleString('ko-KR')}만원`, name]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          iconSize={10}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value, entry) =>
            `${value}: ${(entry.payload?.value ?? 0).toLocaleString('ko-KR')}만원`
          }
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── 수령 시작 타임라인 ────────────────────────────────────────
// 수령 기간 반영:
//   이율보증형·노후적립: 55~74세 | 연금저축: 56~90세
//   우리아이 1·2: 60~90세 | DB퇴직연금: 61~80세 | 국민연금·변액4종: 65~90세
const TIMELINE_ENTRIES = [
  { label: '이율보증형·노후적립', start: 55, end: 74, color: CHART_COLORS.nontax   },
  { label: '연금저축',           start: 56, end: 90, color: CHART_COLORS.savings  },
  { label: '우리아이 1·2',       start: 60, end: 90, color: CHART_COLORS.nontax   },
  { label: 'DB퇴직연금',         start: 61, end: 80, color: CHART_COLORS.db       },
  { label: '국민연금·변액4종',    start: 65, end: 90, color: CHART_COLORS.national },
]
const AGE_MIN   = 55
const AGE_RANGE = 35  // 55 → 90
const AXIS_AGES = [55, 60, 65, 70, 75, 80, 85, 90]

function PensionTimeline() {
  return (
    <div className="space-y-1.5 pt-1">
      {/* 나이 레이블 축 */}
      <div className="relative h-4 mb-0.5">
        {AXIS_AGES.map(age => (
          <span
            key={age}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            style={{ left: `${((age - AGE_MIN) / AGE_RANGE) * 100}%` }}
          >
            {age}
          </span>
        ))}
      </div>

      {/* 수령 기간 바 */}
      {TIMELINE_ENTRIES.map((entry, i) => (
        <div key={i} className="relative h-[22px]">
          {/* 트랙 배경 */}
          <div className="absolute inset-0 rounded-sm bg-muted/50" />
          {/* 수령 기간 컬러 바 */}
          <div
            className="absolute top-0 bottom-0 rounded-sm flex items-center px-2"
            style={{
              left:            `${((entry.start - AGE_MIN) / AGE_RANGE) * 100}%`,
              width:           `${((entry.end   - entry.start) / AGE_RANGE) * 100}%`,
              backgroundColor: entry.color,
              opacity:         0.85,
            }}
          >
            <span className="text-[9px] text-white font-medium truncate leading-none">
              {entry.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 메인 화면 ─────────────────────────────────────────────────
export default function PensionInput() {
  const { cashFlowByAge, balances } = usePensionContext()

  /* 65세 기준 행 (cashFlowByAge[10], age=65) */
  const row65 = useMemo(
    () => cashFlowByAge.find(r => r.age === 65) ?? {},
    [cashFlowByAge],
  )

  /* KPI: 세제적격 총 적립금 — 천원 → 억원 */
  const totalKw = (balances?.db ?? 390_000)
                + (balances?.irp ?? 60_000)
                + (balances?.savings ?? 60_000)
  const totalOkText = `${(totalKw / 100_000).toFixed(1)}억원`

  /* KPI: 65세 연금 월 수령 (임대소득 제외) */
  const pensionAt65 = (row65.total ?? 0) - (row65.rental ?? 0)

  return (
    <div className="h-full p-6 flex flex-col gap-4">

      {/* ── KPI 행 (h-24) ──────────────────────────────────── */}
      <div className="flex gap-3 h-24 shrink-0">
        <KpiCard
          title="총 적립금 (세제적격)"
          value={totalOkText}
          sub="DB 3.9억 · IRP 6천 · 연금저축 6천"
        />
        <KpiCard
          title="월 수령액 (65세 기준)"
          value={`${pensionAt65.toLocaleString('ko-KR')}만원`}
          sub="9개 연금 합산 · 세전 · 임대 제외"
          highlight
        />
        <KpiCard
          title="세제적격 계좌"
          value="3개"
          sub="DB퇴직 · IRP · 연금저축"
        />
        <KpiCard
          title="세제비적격 (비과세)"
          value="6개"
          sub="이율보증형 · 노후적립 · 변액4종"
        />
      </div>

      {/* ── 본문 2분할 ─────────────────────────────────────── */}
      <div
        className="flex-1 grid gap-4 overflow-hidden"
        style={{ gridTemplateColumns: '460px 1fr' }}
      >

        {/* 좌: 연금 계좌 목록 */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 shrink-0">
            <CardTitle className="text-sm">연금 계좌 목록</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <PensionTable row65={row65} />
          </CardContent>
        </Card>

        {/* 우: 도넛 차트 + 타임라인 */}
        <div className="flex flex-col gap-4 overflow-hidden">

          {/* 도넛 차트 — flex-1 */}
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
            <CardHeader className="pb-2 pt-3 px-4 shrink-0">
              <CardTitle className="text-sm">수령액 구성 (65세 기준, 세전)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 pt-0 min-h-0">
              <PensionPieChart row65={row65} />
            </CardContent>
          </Card>

          {/* 타임라인 — h-52 고정 */}
          <Card className="h-52 shrink-0">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm">수령 시작 타임라인</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <PensionTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
