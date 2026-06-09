# 컴포넌트 구현 가이드

> shadcn/ui props·패턴 + 화면별 JSX 구조  
> 와이어프레임(03) 레이아웃을 실제 코드로 연결하는 기준 문서

---

## 0. 공통 임포트 맵

```jsx
// shadcn/ui — src/components/ui/ 아래 복사 후 사용
import { Badge }        from '@/components/ui/badge'
import { Button }       from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input }        from '@/components/ui/input'
import { Label }        from '@/components/ui/label'
import { Separator }    from '@/components/ui/separator'
import { Slider }       from '@/components/ui/slider'
import { Switch }       from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Recharts
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  Legend, ReferenceLine, ResponsiveContainer, Label as ReLabel
} from 'recharts'

// 유틸
import { cn } from '@/lib/utils'               // clsx + tailwind-merge
import { toManwon, toMonthlyManwon } from '@/utils/formatters'
```

---

## 1. 글로벌 레이아웃 — App.jsx

```jsx
// src/App.jsx
export default function App() {
  return (
    // overflow-hidden → No Scroll 강제
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* 헤더 — 56px */}
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-8">
        <span className="font-semibold text-base">🏦 은퇴 연금 분석</span>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">2026.06 기준</Badge>
          <Badge variant="secondary" className="text-xs">53세</Badge>
        </div>
      </header>

      {/* 탭 — 44px */}
      <Tabs defaultValue="cashflow" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="h-11 shrink-0 w-full justify-start rounded-none border-b bg-background px-8 gap-1">
          <TabsTrigger value="pension"   className="text-sm">연금 현황</TabsTrigger>
          <TabsTrigger value="income"    className="text-sm">은퇴 소득</TabsTrigger>
          <TabsTrigger value="cashflow"  className="text-sm">현금흐름</TabsTrigger>
          <TabsTrigger value="health"    className="text-sm">건강보험</TabsTrigger>
          <TabsTrigger value="tax"       className="text-sm">절세 시나리오</TabsTrigger>
        </TabsList>

        {/* 콘텐츠 — 800px (나머지 전체) */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="pension"  className="h-full m-0"><PensionInput /></TabsContent>
          <TabsContent value="income"   className="h-full m-0"><IncomeInput /></TabsContent>
          <TabsContent value="cashflow" className="h-full m-0"><CashFlowDashboard /></TabsContent>
          <TabsContent value="health"   className="h-full m-0"><HealthInsurance /></TabsContent>
          <TabsContent value="tax"      className="h-full m-0"><TaxScenario /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
```

### 높이 배분 원칙

```
전체 h-screen (900px)
├── header:  h-14    = 56px  (shrink-0)
├── tablist: h-11    = 44px  (shrink-0)
└── content: flex-1  = 800px (overflow-hidden)

각 화면 내부:
  p-6 (패딩 24px × 2) → 사용 가능 높이: 752px
  KPI 행: h-24 (96px) → 본문: 656px
```

---

## 2. 공통 컴포넌트 패턴

### 2-1. KPI 카드

```jsx
// 재사용 패턴 — 4개 카드를 가로로 배치
function KpiCard({ title, value, sub, highlight = false }) {
  return (
    <Card className={cn("flex-1", highlight && "border-blue-200 bg-blue-50")}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className={cn(
          "text-2xl font-bold mt-1",
          highlight ? "text-blue-600" : "text-foreground"
        )}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// 사용 예
<div className="flex gap-3 h-24 shrink-0">
  <KpiCard title="은퇴 후 월 수령 (57세)" value="642만원"   sub="세전 기준"     />
  <KpiCard title="피크 수령액 (70세)"      value="1,235만원" sub="연금+임대 합산" highlight />
  <KpiCard title="국민연금 개시 증가"      value="+486만원"  sub="65세 기준"     />
  <KpiCard title="세후 추정 (65세)"        value="~960만원"  sub="추정값"        />
</div>
```

### 2-2. Badge 세제 구분 색상

```jsx
// 세제 구분별 Badge — 도메인 정의서 색상 기준
const TAX_BADGE = {
  public:       { label: '공적연금',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  qualified:    { label: '세제적격',   className: 'bg-violet-100 text-violet-700 border-violet-200' },
  nonqualified: { label: '세제비적격', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  nontax:       { label: '비과세',     className: 'bg-green-100 text-green-700 border-green-200' },
}

function TaxBadge({ type }) {
  const { label, className } = TAX_BADGE[type]
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", className)}>
      {label}
    </Badge>
  )
}
```

### 2-3. 차트 공통 래퍼

```jsx
// 차트 컨테이너 — 부모 높이에 맞게 채움
function ChartWrapper({ title, children, action }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 pt-3 px-4 shrink-0 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex-1 p-2 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### 2-4. 차트 색상 상수

```js
// src/utils/chartColors.js
export const CHART_COLORS = {
  national:   '#3B82F6',  // 국민연금 — blue-500
  db:         '#10B981',  // DB퇴직연금 — emerald-500
  irp:        '#8B5CF6',  // IRP — violet-500
  savings:    '#F59E0B',  // 연금저축 — amber-500
  nontax:     '#94A3B8',  // 세제비적격 — slate-400
  rental:     '#06B6D4',  // 임대소득 — cyan-500
  deduct:     '#F87171',  // 세금/건보료 — red-400
  labor:      '#84CC16',  // 근로소득 — lime-500
}
```

### 2-5. 커스텀 Tooltip (Recharts)

```jsx
function PensionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold mb-2">{label}세</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium">{toManwon(entry.value * 10)}</span>
        </div>
      ))}
      <Separator className="my-1.5" />
      <div className="flex justify-between font-semibold">
        <span>합계</span>
        <span>{toManwon(payload.reduce((s, e) => s + e.value, 0) * 10)}</span>
      </div>
    </div>
  )
}
```

---

## 3. 화면 1 — PensionInput.jsx

> 레이아웃: `h-[800px] p-6` | 2분할 grid (460px : 900px)

```jsx
export default function PensionInput() {
  return (
    <div className="h-full p-6 flex flex-col gap-4">
      {/* KPI 행 — h-24 */}
      <div className="flex gap-3 h-24 shrink-0">
        <KpiCard title="총 적립금 (세제적격)" value="5.1억원"  sub="DB 3.9억+IRP 6천+저축 6천" />
        <KpiCard title="월 수령액 (65세)"     value="828만원"  sub="세전, 연금만"   highlight />
        <KpiCard title="세제적격 계좌"         value="3개"      sub="1.5억 적립"    />
        <KpiCard title="자녀 양도 예정"       value="87만원"   sub="우리아이 1·2 별도" />
      </div>

      {/* 본문 — flex-1, 2분할 */}
      <div className="flex-1 grid gap-4 overflow-hidden"
           style={{ gridTemplateColumns: '460px 1fr' }}>

        {/* 좌: 연금 계좌 목록 */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 shrink-0">
            <CardTitle className="text-sm">연금 계좌 목록</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <PensionTable />
          </CardContent>
        </Card>

        {/* 우: 구성 차트 + 타임라인 */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <ChartWrapper title="수령액 구성 (65세 기준)" className="flex-1">
            <PensionPieChart />
          </ChartWrapper>
          <Card className="h-48 shrink-0">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm">수령 시작 타임라인</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <PensionTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

### PensionTable — 계좌 목록 테이블

```jsx
const PENSION_ROWS = [
  { type: 'public',       institution: '국민연금공단', name: '노령연금',       monthly: 189,  age: '65세~',    taxType: 'public'       },
  { type: 'qualified',    institution: '삼성증권',    name: 'DB 채권형',      monthly: 77,   age: '61~80세',  taxType: 'qualified', balance: '확인 필요' },
  { type: 'qualified',    institution: '삼성생명',    name: '이율보증형(DB)', monthly: 207,  age: '55~74세',  taxType: 'qualified'   },
  { type: 'nonqualified', institution: '삼성생명',    name: '노후적립',       monthly: 115,  age: '55~74세',  taxType: 'nontax'       },
  { type: 'nonqualified', institution: '삼성생명',    name: '인덱스Up변액',   monthly: 98,   age: '65~90세',  taxType: 'nontax'       },
  { type: 'child',        institution: '삼성생명',    name: '우리아이변액1',  monthly: 45,   age: '60~90세',  taxType: 'child'        },
  { type: 'nonqualified', institution: '삼성생명',    name: '스마트Top변액',  monthly: 117,  age: '65~90세',  taxType: 'nontax'       },
  { type: 'child',        institution: '삼성생명',    name: '우리아이변액2',  monthly: 42,   age: '60~90세',  taxType: 'child'        },
  { type: 'qualified',    institution: '삼성생명',    name: '연금저축골드',   monthly: 20,   age: '56~89세',  taxType: 'qualified', balance: '6천만' },
  { type: 'qualified',    institution: '(별도)',      name: 'IRP',           monthly: null, age: '미정',     taxType: 'qualified', balance: '6천만' },
]

function PensionTable() {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          <TableHead className="w-[100px] text-xs">기관</TableHead>
          <TableHead className="text-xs">상품명</TableHead>
          <TableHead className="text-xs text-right">월 수령</TableHead>
          <TableHead className="text-xs">수령 시기</TableHead>
          <TableHead className="w-[80px] text-xs">구분</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {PENSION_ROWS.map((row, i) => (
          <TableRow key={i} className="text-xs">
            <TableCell className="py-2 text-muted-foreground">{row.institution}</TableCell>
            <TableCell className="py-2 font-medium">
              {row.name}
              {row.balance && (
                <span className="ml-1 text-[10px] text-muted-foreground">({row.balance})</span>
              )}
            </TableCell>
            <TableCell className="py-2 text-right font-mono">
              {row.monthly ? `${row.monthly}만원` : '—'}
            </TableCell>
            <TableCell className="py-2 text-muted-foreground">{row.age}</TableCell>
            <TableCell className="py-2"><TaxBadge type={row.taxType} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### PensionPieChart — 수령액 도넛 차트

```jsx
function PensionPieChart() {
  const data = [
    { name: '세제비적격', value: 453, color: CHART_COLORS.nontax   },
    { name: '국민연금',   value: 189, color: CHART_COLORS.national  },
    { name: 'DB퇴직연금', value: 77,  color: CHART_COLORS.db        },
    { name: '연금저축',   value: 20,  color: CHART_COLORS.savings   },
  ]
  return (
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
           dataKey="value" paddingAngle={2}>
        {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        {/* 중앙 텍스트 — foreignObject 또는 커스텀 라벨 */}
      </Pie>
      <ReTooltip formatter={(v) => [`${v}만원`, '']} />
      <Legend formatter={(v, e) => (
        <span className="text-xs">{v}: {e.payload.value}만원</span>
      )} />
    </PieChart>
  )
}
```

---

## 4. 화면 2 — IncomeInput.jsx

> 레이아웃: `h-[800px] p-6` | 2분할 (460px : 900px)

```jsx
export default function IncomeInput() {
  const { income, setIncome } = usePensionContext()

  return (
    <div className="h-full p-6 flex flex-col gap-4">
      {/* KPI 행 */}
      <div className="flex gap-3 h-24 shrink-0">
        <KpiCard title="현재 근로소득" value="1.7억원/년" sub="연봉1.2억+보너스5천만" />
        <KpiCard title="은퇴 후 연금" value="342만원/월" sub="57세 기준, 세전"    />
        <KpiCard title="임대소득"     value="300만원/월" sub="필요경비 공제 전"   highlight />
        <KpiCard title="피부양자"     value="탈락 확정"  sub="임대소득>2,000만" highlight />
      </div>

      {/* 본문 */}
      <div className="flex-1 grid gap-4 overflow-hidden"
           style={{ gridTemplateColumns: '460px 1fr' }}>

        {/* 좌: 소득 입력 폼 */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">은퇴 후 소득 입력</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-5">
            <IncomeField
              label="임대소득"
              value={income.rental}
              onChange={v => setIncome({ ...income, rental: v })}
              sub="월 300만원 = 연 3,600만원 → 종합과세 대상"
            />
            <IncomeField
              label="근로소득 (은퇴 후)"
              value={income.labor}
              onChange={v => setIncome({ ...income, labor: v })}
              sub="미입력 시 0으로 계산"
              placeholder="0"
            />
            <IncomeField
              label="금융소득 (이자·배당)"
              value={income.financial}
              onChange={v => setIncome({ ...income, financial: v })}
              sub="연 2,000만 초과 시 종합과세 합산"
              placeholder="0"
            />
            <IncomeField
              label="기타소득"
              value={income.other}
              onChange={v => setIncome({ ...income, other: v })}
              placeholder="0"
            />

            {/* 소득 합계 */}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">은퇴 후 월 비연금 소득</span>
              <span className="text-lg font-bold text-blue-600">
                {toManwon((income.rental + income.labor + income.financial / 12) * 10)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 우: 소득 구성 차트 + 리스크 체크 */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <ChartWrapper title="은퇴 시점별 월 소득 구성" className="flex-[2]">
            <IncomeBarChart />
          </ChartWrapper>
          <RiskChecklist className="flex-1 shrink-0" />
        </div>
      </div>
    </div>
  )
}

// 소득 입력 필드 — Label + Input + 부가설명 패턴
function IncomeField({ label, value, onChange, sub, placeholder = '0' }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className="h-8 text-right font-mono"
        />
        <span className="text-sm text-muted-foreground shrink-0">만원/월</span>
      </div>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// 리스크 체크리스트
function RiskChecklist() {
  const risks = [
    { ok: true,  text: '사적연금 1,500만원 이하 → 분리과세 유지 가능' },
    { ok: false, text: '임대소득 3,600만원 > 2,000만원 → 종합과세 대상' },
    { ok: false, text: '피부양자 탈락 확정 → 지역가입자 전환' },
    { ok: true,  text: '변액연금 비과세 요건 충족 가정 (확인 필요)' },
  ]
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-sm">소득 리스크</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {risks.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span>{r.ok ? '✅' : '⚠️'}</span>
            <span className={r.ok ? 'text-foreground' : 'text-amber-700'}>{r.text}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

---

## 5. 화면 3 — CashFlowDashboard.jsx ⭐

> 레이아웃: `h-[800px] p-6` | KPI(96px) + 차트(520px) + 마일스톤(148px)

```jsx
export default function CashFlowDashboard() {
  const [showAfterTax, setShowAfterTax] = useState(false)
  const cashFlowData = useCashFlowData()  // Context에서 나이별 계산값

  return (
    <div className="h-full p-6 flex flex-col gap-4">
      {/* KPI 행 */}
      <div className="flex gap-3 h-24 shrink-0">
        <KpiCard title="은퇴 직후 (57세)"  value="642만원/월"   sub="연금+임대, 세전"  />
        <KpiCard title="피크 수령 (70세)"  value="1,235만원/월" sub="전체 합산"  highlight />
        <KpiCard title="국민연금 개시 (65세)" value="+486만원"  sub="월 수령 증가"     />
        <KpiCard title="세후 추정 (65세)"  value="~960만원/월"  sub="세금·건보료 차감"  />
      </div>

      {/* 메인 차트 */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="pb-2 pt-3 px-4 shrink-0 flex-row items-center justify-between">
          <CardTitle className="text-sm">나이별 월 수령액 (만원)</CardTitle>
          {/* 세전/세후 토글 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">세전</span>
            <Switch checked={showAfterTax} onCheckedChange={setShowAfterTax} />
            <span className="text-xs text-muted-foreground">세후(추정)</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashFlowData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="age" tick={{ fontSize: 11 }}
                     tickFormatter={v => `${v}세`} />
              <YAxis tick={{ fontSize: 11 }}
                     tickFormatter={v => `${v}만`}
                     domain={[0, 1400]} />
              <ReTooltip content={<PensionTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />

              {/* 누적 바 */}
              <Bar dataKey="nontax"   name="변액·개인(비과세)" stackId="a" fill={CHART_COLORS.nontax}   />
              <Bar dataKey="savings"  name="연금저축"          stackId="a" fill={CHART_COLORS.savings}  />
              <Bar dataKey="db"       name="DB퇴직연금"         stackId="a" fill={CHART_COLORS.db}       />
              <Bar dataKey="national" name="국민연금"           stackId="a" fill={CHART_COLORS.national} />
              <Bar dataKey="rental"   name="임대소득"           stackId="a" fill={CHART_COLORS.rental}   />

              {/* 세후 점선 라인 */}
              {showAfterTax && (
                <Line dataKey="net" name="세후 추정"
                      stroke={CHART_COLORS.deduct} strokeWidth={2}
                      strokeDasharray="5 5" dot={false} />
              )}

              {/* 마일스톤 수직선 */}
              <ReferenceLine x={57} stroke="#F97316" strokeDasharray="3 3">
                <ReLabel value="은퇴" position="top" fontSize={10} fill="#F97316" />
              </ReferenceLine>
              <ReferenceLine x={65} stroke={CHART_COLORS.national} strokeDasharray="3 3">
                <ReLabel value="국민연금" position="top" fontSize={10} fill={CHART_COLORS.national} />
              </ReferenceLine>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 마일스톤 카드 — 4개 */}
      <div className="flex gap-3 h-[148px] shrink-0">
        <MilestoneCard year={2030} age={57}
          title="🏁 은퇴"
          items={['급여 종료', '월 642만원', '지역가입자 전환']}
          color="orange" />
        <MilestoneCard year={2034} age={61}
          title="DB 퇴직연금 개시"
          items={['+77만원/월', '월 806만원']}
          color="emerald" />
        <MilestoneCard year={2038} age={65}
          title="⭐ 국민연금 개시"
          items={['+486만원/월', '월 1,128만원', '종합소득세 증가']}
          color="blue" />
        <MilestoneCard year={2048} age={75}
          title="⚠️ 일부 상품 종료"
          items={['이율보증형·노후적립 종료', '월 648만원으로 감소']}
          color="red" />
      </div>
    </div>
  )
}

// 마일스톤 카드
function MilestoneCard({ year, age, title, items, color }) {
  const colorMap = {
    orange:  'border-orange-200 bg-orange-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    blue:    'border-blue-200 bg-blue-50',
    red:     'border-red-200 bg-red-50',
  }
  return (
    <Card className={cn("flex-1", colorMap[color])}>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground">{year}년 · {age}세</p>
        <p className="text-xs font-semibold mt-0.5">{title}</p>
        <ul className="mt-1.5 space-y-0.5">
          {items.map((item, i) => (
            <li key={i} className="text-[11px] text-muted-foreground">• {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
```

---

## 6. 화면 4 — HealthInsurance.jsx

> 레이아웃: `h-[800px] p-6` | 판정 배너(72px) + 본문 2분할

```jsx
export default function HealthInsurance() {
  const { assets } = usePensionContext()
  const [rentalIncome, setRentalIncome] = useState(3600)    // 만원/년
  const [realEstate,   setRealEstate]   = useState(26)      // 억원

  const result = useHealthInsCalc(rentalIncome * 10, realEstate * 100_000)

  return (
    <div className="h-full p-6 flex flex-col gap-4">

      {/* 피부양자 판정 배너 */}
      <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
        <span className="text-red-500 text-lg">❌</span>
        <div>
          <p className="text-sm font-semibold text-red-700">피부양자 탈락 확정</p>
          <p className="text-xs text-red-600">
            임대소득 {rentalIncome}만원/년 &gt; 기준 2,000만원 |
            재산 과표 ~10.9억 &gt; 기준 9억 |
            2030년 은퇴 시점부터 지역가입자 전환
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 grid gap-4 overflow-hidden"
           style={{ gridTemplateColumns: '460px 1fr' }}>

        {/* 좌: 입력 패널 */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm">보험료 산정 입력</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-6">
            {/* 임대소득 슬라이더 */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm">연간 과세 임대소득</Label>
                <span className="text-sm font-bold">{rentalIncome}만원/년</span>
              </div>
              <Slider min={0} max={10000} step={100}
                      value={[rentalIncome]}
                      onValueChange={([v]) => setRentalIncome(v)} />
              <p className="text-xs text-muted-foreground">
                소득 보험료: 약 {result.incomeMonth}만원/월
              </p>
            </div>

            <Separator />

            {/* 부동산 시가 슬라이더 */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-sm">부동산 시가</Label>
                <span className="text-sm font-bold">{realEstate}억원</span>
              </div>
              <Slider min={0} max={50} step={0.5}
                      value={[realEstate]}
                      onValueChange={([v]) => setRealEstate(v)} />
              <p className="text-xs text-muted-foreground">
                공시가격 추정 {(realEstate * 0.7).toFixed(1)}억 → 과표 {(realEstate * 0.42).toFixed(1)}억 → 재산 보험료 약 {result.assetMonth}만원/월
              </p>
            </div>

            <Separator />

            {/* 월 보험료 합계 */}
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground">월 건강보험료 합계 (추정)</p>
              <p className="text-3xl font-bold mt-1">
                약 {result.totalMonth}만원
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                건보 {result.healthMonth}만 + 장기요양 {result.ltcMonth}만
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 우: 차트 + 판정표 + 절감 방법 */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <ChartWrapper title="나이별 월 건강보험료 추정 (만원)" className="flex-1">
            <HealthBarChart />
          </ChartWrapper>

          <div className="grid grid-cols-2 gap-4 h-44 shrink-0">
            <EligibilityTable rentalIncome={rentalIncome} realEstate={realEstate} />
            <SavingsCard />
          </div>
        </div>
      </div>
    </div>
  )
}

// 피부양자 자격 판정표
function EligibilityTable({ rentalIncome, realEstate }) {
  const assetBase = realEstate * 0.42  // 억
  const rows = [
    { item: '소득 기준', standard: '2,000만원',  current: `${rentalIncome}만원`, pass: rentalIncome <= 2000 },
    { item: '재산 기준A', standard: '과표 9억',  current: `${assetBase.toFixed(1)}억`, pass: assetBase <= 9 },
  ]
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-3"><CardTitle className="text-xs">피부양자 자격 판정</CardTitle></CardHeader>
      <CardContent className="px-3 pb-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] py-1">항목</TableHead>
              <TableHead className="text-[10px] py-1">기준</TableHead>
              <TableHead className="text-[10px] py-1">현황</TableHead>
              <TableHead className="text-[10px] py-1 text-center">결과</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-[10px] py-1">{r.item}</TableCell>
                <TableCell className="text-[10px] py-1">{r.standard}</TableCell>
                <TableCell className="text-[10px] py-1">{r.current}</TableCell>
                <TableCell className="text-[10px] py-1 text-center">{r.pass ? '✅' : '❌'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

---

## 7. 화면 5 — TaxScenario.jsx

> 레이아웃: `h-[800px] p-6` | 토글(44px) + 차트2분할(400px) + 전략표(280px)

```jsx
const SCENARIO_IDS = ['current', 'spread', 'delayed', 'optimal']
const SCENARIO_LABELS = {
  current: '현재 계획', spread: '분산 수령', delayed: '지연 수령', optimal: '최적 조합'
}
const SCENARIO_COLORS = {
  current: '#94A3B8', spread: '#3B82F6', delayed: '#10B981', optimal: '#F59E0B'
}

export default function TaxScenario() {
  const [active, setActive] = useState(['current', 'optimal'])
  const scenarioData = useScenarioData()

  return (
    <div className="h-full p-6 flex flex-col gap-4">

      {/* 시나리오 선택 토글 */}
      <div className="flex items-center gap-3 shrink-0 h-11">
        <span className="text-sm text-muted-foreground shrink-0">비교 시나리오:</span>
        <ToggleGroup type="multiple" value={active} onValueChange={setActive}
                     className="justify-start">
          {SCENARIO_IDS.map(id => (
            <ToggleGroupItem key={id} value={id} size="sm"
                             className="text-xs px-3 data-[state=on]:font-semibold"
                             style={{ '--toggle-color': SCENARIO_COLORS[id] }}>
              {SCENARIO_LABELS[id]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* 차트 2분할 */}
      <div className="flex gap-4 overflow-hidden" style={{ height: '400px' }}>
        {/* 세금 그룹 바 차트 */}
        <ChartWrapper title="65세 기준 연간 세금·건보료 비교 (만원)" className="flex-1">
          <TaxBarChart active={active} data={scenarioData.taxAt65} />
        </ChartWrapper>

        {/* 세후 실수령 라인 차트 */}
        <ChartWrapper title="나이별 세후 월 수령액 비교 (만원)" className="flex-1">
          <NetIncomeLineChart active={active} data={scenarioData.byAge} />
        </ChartWrapper>
      </div>

      {/* 절세 전략 테이블 */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="pb-2 pt-3 px-4 shrink-0">
          <CardTitle className="text-sm">절세 전략 우선순위</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <TaxStrategyTable />
        </CardContent>
      </Card>

      {/* 추천/보수 2개 카드 */}
      <div className="flex gap-4 h-20 shrink-0">
        <RecommendCard
          icon="🏆" title="추천: 분산+지연 수령"
          desc="국민연금 70세 지연 + 사적연금 1,500만 이하 유지 → 연 50~100만원 절세 효과"
          color="amber" />
        <RecommendCard
          icon="🛡️" title="보수 대안: 현재 계획 유지"
          desc="엑셀 기준 그대로 + 세무사 연 상담으로 공제 최적화"
          color="slate" />
      </div>
    </div>
  )
}

// 세후 라인 차트
function NetIncomeLineChart({ active, data }) {
  const DASH = { current: '', spread: '5 5', delayed: '10 5', optimal: '' }
  return (
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="age" tick={{ fontSize: 10 }} tickFormatter={v => `${v}세`} />
      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}만`} />
      <ReTooltip formatter={(v) => [`${v}만원`, '']} />
      <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
      {SCENARIO_IDS.filter(id => active.includes(id)).map(id => (
        <Line key={id} dataKey={id} name={SCENARIO_LABELS[id]}
              stroke={SCENARIO_COLORS[id]}
              strokeWidth={id === 'optimal' ? 2.5 : 1.5}
              strokeDasharray={DASH[id]}
              dot={false} />
      ))}
      <ReferenceLine x={57} stroke="#F97316" strokeDasharray="2 2" />
      <ReferenceLine x={65} stroke="#3B82F6" strokeDasharray="2 2" />
    </LineChart>
  )
}

// 전략 테이블
const STRATEGIES = [
  { name: '사적연금 1,500만원 이하 분리과세 유지', range: '57세~', effect: '5.5% 저율 유지', priority: 5, status: 'apply' },
  { name: '세제비적격 비과세 요건 확인',           range: '55세~', effect: '세금 0원',      priority: 5, status: 'apply' },
  { name: '국민연금 지연 수령 (70세)',             range: '65→70', effect: '+816만원/년',  priority: 4, status: 'review' },
  { name: 'IRP 분산 인출',                        range: '60~75', effect: '1,500만 이하',  priority: 4, status: 'review' },
  { name: '인출 순서 최적화 (비과세 먼저)',         range: '57세~', effect: '과세 이연',    priority: 4, status: 'apply' },
  { name: '임대소득 경비 최대화',                  range: '매년',  effect: '과세표준 감소', priority: 3, status: 'check' },
]

function TaxStrategyTable() {
  const statusConfig = {
    apply:  { label: '✅ 적용',  className: 'text-green-600' },
    review: { label: '○ 검토',   className: 'text-blue-600'  },
    check:  { label: '⚠️ 확인',  className: 'text-amber-600' },
  }
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-background">
        <TableRow>
          <TableHead className="text-xs">전략</TableHead>
          <TableHead className="text-xs w-20">적용 구간</TableHead>
          <TableHead className="text-xs w-28">기대 효과</TableHead>
          <TableHead className="text-xs w-16 text-center">우선순위</TableHead>
          <TableHead className="text-xs w-16 text-center">상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {STRATEGIES.map((s, i) => (
          <TableRow key={i} className="text-xs">
            <TableCell className="py-2">{s.name}</TableCell>
            <TableCell className="py-2 text-muted-foreground">{s.range}</TableCell>
            <TableCell className="py-2 font-medium">{s.effect}</TableCell>
            <TableCell className="py-2 text-center">{'★'.repeat(s.priority)}</TableCell>
            <TableCell className={cn("py-2 text-center text-[11px]", statusConfig[s.status].className)}>
              {statusConfig[s.status].label}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 8. Context 훅 사용 패턴

```jsx
// src/context/PensionContext.jsx — 전역 상태 접근
export function usePensionContext() {
  return useContext(PensionContext)
}

// 파생 계산 훅 — 화면 3 전용
export function useCashFlowData() {
  const { income, assets } = usePensionContext()
  return useMemo(() =>
    AGES.map((age, i) => ({
      age,
      nontax:   Math.round(PENSION_ANNUAL.guaranteed[i] + PENSION_ANNUAL.nohup[i]
                         + PENSION_ANNUAL.indexUp[i]    + PENSION_ANNUAL.ourChild1[i]
                         + PENSION_ANNUAL.smartTop[i]   + PENSION_ANNUAL.ourChild2[i]) / 120,
      savings:  Math.round(PENSION_ANNUAL.savings[i] / 120),
      db:       Math.round(PENSION_ANNUAL.db[i] / 120),
      national: Math.round(PENSION_ANNUAL.national[i] / 120),
      rental:   income.rental / 10,           // 천원 → 만원
      net:      null,  // taxCalc 결과 대입
    }))
  , [income])
}

// 건보료 계산 훅 — 화면 4 전용
export function useHealthInsCalc(annualIncome, realEstateValue) {
  return useMemo(() => {
    const result = localSubscriberPremium(annualIncome, realEstateValue)
    return {
      incomeMonth: Math.round(result.income / 10),
      assetMonth:  Math.round(result.asset / 10),
      healthMonth: Math.round(result.health / 10),
      ltcMonth:    Math.round(result.ltc / 10),
      totalMonth:  Math.round(result.total / 10),
    }
  }, [annualIncome, realEstateValue])
}
```

---

## 9. 주요 구현 주의사항

| 항목 | 규칙 |
|------|------|
| 차트 `ResponsiveContainer` | 부모에 명시적 높이 필요 (`h-full` or `height: N`) |
| `flex-1` 자식의 차트 | 부모에 `overflow-hidden` 필수, 미설정 시 스크롤 발생 |
| Recharts 데이터 단위 | 내부 계산은 천원, 차트 표시는 만원 (`/10`) |
| Slider `value` | 반드시 배열 `[number]` 형태, 숫자 단독 전달 시 오류 |
| `ToggleGroup` 다중 선택 | `type="multiple"` + `value={string[]}` |
| 추정값 표시 | 차트 Tooltip, 카드 sub 텍스트에 항상 "추정" 명시 |

---

*기준: shadcn/ui latest + Recharts 2.x + Tailwind CSS 3.x | 2026-06-08*
