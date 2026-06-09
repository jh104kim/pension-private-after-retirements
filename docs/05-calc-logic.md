# 계산 로직 상세 명세

> `taxCalc.js` · `healthInsCalc.js` · `scenarioCalc.js` 구현 기준  
> 출처: 국세청 2024 / 국민건강보험공단 2024 | 기준일: 2026-06-08

---

## 0. 공통 규칙

```
모든 입력·출력 단위: 천원 (내부 계산)
화면 표시 시 formatters.js 경유 → 만원 변환
정확한 세액 산출이 어려운 항목 → UI에 "추정" 라벨 필수
```

---

## 1. taxCalc.js — 세금 계산

### 1-1. 사적연금 소득세 (세제적격: 연금저축·IRP)

> 소득세법 제129조 / 조세특례제한법 제86조의2

#### 세율표

| 수령 나이 | 세율 (소득세 + 지방소득세) | 적용 조건 |
|------|------|------|
| 55 ~ 69세 | **5.5%** | 연 1,500만원 이하 |
| 70 ~ 79세 | **4.4%** | 연 1,500만원 이하 |
| 80세 이상 | **3.3%** | 연 1,500만원 이하 |
| 모든 나이 | **16.5%** (선택적 분리과세) | 연 1,500만원 초과 시 |

#### 1,500만원 분기점 판단

```
연 과세 사적연금 = 연금저축 수령액 + IRP 인출액
(DB 퇴직연금은 별도 퇴직소득세 적용 — 합산 제외)

if (연 과세 사적연금 <= 15_000천원):
    세금 = 연 과세 사적연금 × 나이별 세율
    → 분리과세 완납 (종합소득세 미포함)

if (연 과세 사적연금 > 15_000천원):
    A안: 종합과세 (다른 소득과 합산 → §1-3 종합소득세 적용)
    B안: 16.5% 분리과세 (선택)
    → A·B 중 세금이 적은 방향 선택
```

#### 구현 함수

```js
/**
 * @param {number} annualQualified  연 세제적격 수령액 합계 (천원)
 * @param {number} age
 * @param {number} otherTaxableIncome  다른 종합소득 (국민연금 과세분 + 임대 등) (천원)
 * @returns {{ tax: number, method: 'separate' | 'comprehensive' | 'flat16.5' }}
 */
function privatePensionTax(annualQualified, age, otherTaxableIncome) {
  const THRESHOLD = 15_000 // 천원 (2024년 1,200만→1,500만 상향)

  if (annualQualified <= THRESHOLD) {
    const rate = age >= 80 ? 0.033 : age >= 70 ? 0.044 : 0.055
    return { tax: annualQualified * rate, method: 'separate' }
  }

  // 1,500만 초과: A안 vs B안 비교
  const taxA = comprehensiveIncomeTax(annualQualified + otherTaxableIncome)
             - comprehensiveIncomeTax(otherTaxableIncome) // 증가분
  const taxB = annualQualified * 0.165

  return taxA <= taxB
    ? { tax: taxA, method: 'comprehensive' }
    : { tax: taxB, method: 'flat16.5' }
}
```

#### 이 프로젝트 적용값 (기본 시나리오)

| 항목 | 연 수령액 | 적용 세율 | 연 세금 |
|------|---:|------|---:|
| 연금저축 (56세~) | 2,377천원 | 5.5% | **131천원** |
| IRP (시점 미정) | 사용자 설정 | 5.5% | 변동 |
| 합계 (기본) | 2,377천원 | — | 131천원 |

> ✅ 연금저축 단독: 237.7만원 < 1,500만원 → 분리과세 유지  
> ⚠️ IRP 추가 인출 시: 합산액 1,500만원 초과 여부 항상 체크

---

### 1-2. DB 퇴직연금 퇴직소득세

> 소득세법 제48조·제55조 / 퇴직소득세율 2024 기준

#### 계산 순서 (5단계)

```
① 근속연수 공제
② 환산급여 계산
③ 환산급여 공제
④ 환산산출세액 → 산출세액
⑤ 연금 수령 시 감면 적용
```

#### ① 근속연수 공제표

| 근속연수 | 공제액 |
|------|------|
| 5년 이하 | 30만원 × 근속연수 |
| 5년 초과 ~ 10년 | 150만원 + 50만원 × (연수 - 5) |
| 10년 초과 ~ 20년 | 400만원 + 80만원 × (연수 - 10) |
| **20년 초과** | **1,200만원 + 120만원 × (연수 - 20)** |

#### ② 환산급여

```
환산급여 = (퇴직급여 - 근속연수공제) ÷ 근속연수 × 12
```

#### ③ 환산급여 공제표

| 환산급여 | 공제액 |
|------|------|
| 800만원 이하 | 전액 |
| 800만 ~ 7,000만 | 800만 + 초과분 × 60% |
| 7,000만 ~ 1억 | 4,520만 + 초과분 × 55% |
| **1억 ~ 3억** | **6,170만 + 초과분 × 45%** |
| 3억 초과 | 15,170만 + 초과분 × 35% |

#### ④ 산출세액

```
환산 과세표준 = 환산급여 - 환산급여공제
환산산출세액  = 환산 과세표준 × 종합소득세율 (§1-3 세율표)
산출세액      = 환산산출세액 ÷ 12 × 근속연수
```

#### ⑤ 연금 수령 시 감면

```
연금 수령 세액 = 산출세액 × 감면율
  → 10년 이하 연금 수령: × 70%
  → 10년 초과 연금 수령: × 60%
```

#### 이 프로젝트 참조 계산 (근속연수 30년 가정)

```
퇴직급여:    390,000천원 (3.9억)
근속연수공제: 2,400만원  (1,200 + 120 × 10)
환산급여:    14,640만원  = (39,000 - 2,400) ÷ 30 × 12
환산급여공제: 8,258만원  = 6,170 + 4,640 × 45%
환산 과세표준: 6,382만원
환산산출세액:  955.7만원 (24% 구간)
산출세액:    2,389만원  = 955.7 ÷ 12 × 30
연금수령 세액: 1,672만원  = 2,389 × 70% (10년 이하)
               1,433만원  = 2,389 × 60% (10년 초과)

수령 기간 20년(61~80세) 기준 연 세금:
  → 약 119~143만원/년 (추정)
  → 월 약 10~12만원 수준
```

> ⚠️ 근속연수는 사용자 확인 필요 (현재 미입력). 기본값 30년 사용.

---

### 1-3. 국민연금 — 공적연금 종합소득세

> 소득세법 제47조의2 연금소득공제 / 2024 종합소득세율

#### 연금소득공제표

| 총 연금액 | 공제액 |
|------|------|
| 350만원 이하 | 전액 |
| 350만 ~ 700만 | 350만 + (초과분 × 40%) |
| 700만 ~ 1,400만 | 490만 + (초과분 × 20%) |
| **1,400만원 초과** | **630만 + (초과분 × 10%)** ← 한도 900만원 |

```js
function pensionIncomeDeduction(annualPension /* 천원 */) {
  const p = annualPension
  if (p <= 3_500)  return p
  if (p <= 7_000)  return 3_500 + (p - 3_500) * 0.4
  if (p <= 14_000) return 4_900 + (p - 7_000) * 0.2
  return Math.min(6_300 + (p - 14_000) * 0.1, 9_000) // 한도 900만원
}
```

#### 종합소득세율표 (2024)

| 과세표준 | 세율 | 누진공제 (천원) |
|------|------|------|
| 1,400만원 이하 | 6% | — |
| 1,400만 ~ 5,000만 | 15% | 1,260 |
| 5,000만 ~ 8,800만 | 24% | 5,760 |
| 8,800만 ~ 1.5억 | 35% | 15,440 |
| 1.5억 ~ 3억 | 38% | 19,940 |
| 3억 ~ 5억 | 40% | 25,940 |
| 5억 ~ 10억 | 42% | 35,940 |
| 10억 초과 | 45% | 65,940 |

```js
function comprehensiveIncomeTax(taxableIncome /* 천원 */) {
  const brackets = [
    [14_000,  0.06,      0],
    [50_000,  0.15,  1_260],
    [88_000,  0.24,  5_760],
    [150_000, 0.35, 15_440],
    [300_000, 0.38, 19_940],
    [500_000, 0.40, 25_940],
    [1_000_000, 0.42, 35_940],
    [Infinity,  0.45, 65_940],
  ]
  const [, rate, deduction] = brackets.find(([limit]) => taxableIncome <= limit)
  const incomeTax = taxableIncome * rate - deduction
  return incomeTax * 1.1 // 지방소득세 10% 포함
}
```

#### 국민연금 + 임대소득 합산 계산 흐름

```
① 국민연금 과세표준 = 국민연금 수령액 - 연금소득공제 - 기본공제(본인150 + 배우자150)
② 임대소득 과세금액 = 임대 총수입 × (1 - 단순경비율 42.6%)
③ 합산 과세표준 = ① + ②
④ 종합소득세 = comprehensiveIncomeTax(합산 과세표준)
```

#### 이 프로젝트 참조 계산 (66세 기준)

```
국민연금:     22,682천원/년
연금소득공제:  6,300 + (22,682 - 14,000) × 10% = 7,168천원
기본공제:     3,000천원 (본인 + 배우자)
국민연금 과세표준: 22,682 - 7,168 - 3,000 = 12,514천원

임대 총수입:  36,000천원/년
단순경비율:   42.6% → 과세: 36,000 × 0.574 = 20,664천원

합산 과세표준: 12,514 + 20,664 = 33,178천원
종합소득세:   33,178 × 15% - 1,260 = 3,717천원 × 1.1(지방세) = 4,089천원/년
           → 월 341천원 (약 34만원/월)
```

> 기본공제·추가공제 항목에 따라 실제 세액 변동 가능 — **추정값**

---

### 1-4. 세제비적격 상품 비과세 판단

> 보험업법 / 소득세법 시행령 제25조

```
비과세 요건 (모두 충족 시):
  ✅ 계약일로부터 10년 이상 유지
  ✅ 만 55세 이후 수령
  ✅ 연금 형태로 수령 (일시금 수령 시 과세)
  ✅ 월 납입보험료 150만원 이하 (2017년 이후 가입 기준)

이 프로젝트 적용:
  - 이율보증형 外: 퇴직연금 DB 운용상품으로 재분류 → 비과세가 아닌 DB/퇴직소득 과세 확인 필요
  - 노후적립연금보험: 2000년 이전 가입 → ✅ 비과세 (구 개인연금저축 특례)
  - 본인 변액연금 2종(인덱스Up·스마트Top): 가입 연도 확인 필요 → 10년+ 유지 가정 시 ✅ 비과세
  - 우리아이변액 1·2: 자녀 양도 예정 → 본인 연금 합계 제외, 별도 표기
```

```js
function isNonTaxable(product) {
  const { taxType, yearsHeld, receptionType } = product
  if (taxType !== 'nonqualified') return false
  return yearsHeld >= 10 && receptionType === 'annuity'
  // → true면 세금 = 0
}
```

---

### 1-5. 임대소득 과세

```
연 임대 총수입: 36,000천원
수입 기준:
  - 2,000만원 초과 → 종합과세 의무 (§1-3 흐름에 포함)
  - 2,000만원 이하 → 분리과세 14% + 지방세 1.4% = 15.4% 선택 가능

이 프로젝트: 3,600만원 > 2,000만원 → 종합과세 대상

필요경비 처리:
  단순경비율: 42.6% (2024, 주택임대)
  → 과세 소득금액 = 36,000 × (1 - 0.426) = 20,664천원
```

---

### 1-6. netMonthlyIncome — 종합 세후 계산

```js
/**
 * 나이별 월 세후 실수령액 계산
 * @param {number} age
 * @param {object} pension   { national, db, savings, irp, taxFree } 연간 (천원)
 * @param {object} income    { rental } 월 (천원)
 * @returns {{ gross, taxPension, taxRental, insurance, net }} 월 (천원)
 */
function netMonthlyIncome(age, pension, income) {
  // 1. 세제비적격 → 비과세 (taxFree 항목 제외)
  const qualifiedAnnual = pension.savings + (pension.irp ?? 0)

  // 2. 사적연금 세금
  const annualRentalIncome = income.rental * 12
  const taxPrivate = privatePensionTax(qualifiedAnnual, age, /* 나중에 합산 */)

  // 3. 국민연금 + 임대소득 종합과세
  const nationalTaxable = Math.max(0, pension.national - pensionIncomeDeduction(pension.national) - 3_000)
  const rentalTaxable = annualRentalIncome * (1 - 0.426)
  const taxComprehensive = comprehensiveIncomeTax(nationalTaxable + rentalTaxable)

  // 4. DB 퇴직연금 세금 (연간 배분)
  const taxDB = pension.db > 0 ? estimateDBTax(pension.db) : 0

  // 5. 건보료
  const { total: annualInsurance } = localSubscriberPremium(
    nationalTaxable + rentalTaxable,
    USER_DEFAULTS.assets.realEstate
  )

  const totalAnnualTax = taxPrivate.tax + taxComprehensive + taxDB
  const totalAnnualGross = Object.values(pension).reduce((a, b) => a + b, 0)
                         + annualRentalIncome

  return {
    gross:       Math.round(totalAnnualGross / 12),
    taxPension:  Math.round(totalAnnualTax / 12),
    insurance:   Math.round(annualInsurance / 12),
    net:         Math.round((totalAnnualGross - totalAnnualTax - annualInsurance) / 12),
  }
}
```

---

## 2. healthInsCalc.js — 건강보험료 계산

> 국민건강보험법 시행령 별표4 / 2024년 점수당 단가 208.4원

### 2-1. 소득점수 계산

#### 소득 구간별 점수표 (2024, 핵심 구간)

| 연간 소득 (만원) | 점수 |
|------|------|
| 336 이하 | 18 |
| 336 ~ 418 | 26 |
| 418 ~ 519 | 34 |
| 519 ~ 640 | 44 |
| 640 ~ 789 | 57 |
| 789 ~ 975 | 73 |
| 975 ~ 1,203 | 94 |
| 1,203 ~ 1,485 | 120 |
| 1,485 ~ 1,833 | 152 |
| 1,833 ~ 2,264 | 193 |
| **2,264 ~ 2,795** | **246** |
| 2,795 ~ 3,451 | 313 |
| 3,451 ~ 4,260 | 397 |
| **4,260 ~ 5,259** | **505** ← 임대소득 3,600만원 해당 구간 |
| 5,259 ~ 6,492 | 641 |
| 6,492 ~ 8,017 | 814 |
| 8,017 초과 | 비례 계산 |

```js
// 점수 구간 테이블 (하한, 상한, 점수)
const INCOME_SCORE_TABLE = [
  [0,       3_360,   18],
  [3_360,   4_180,   26],
  [4_180,   5_190,   34],
  [5_190,   6_400,   44],
  [6_400,   7_890,   57],
  [7_890,   9_750,   73],
  [9_750,  12_030,   94],
  [12_030, 14_850,  120],
  [14_850, 18_330,  152],
  [18_330, 22_640,  193],
  [22_640, 27_950,  246],
  [27_950, 34_510,  313],
  [34_510, 42_600,  397],
  [42_600, 52_590,  505],  // ← 임대소득 3,600만 = 36,000천원 해당
  [52_590, 64_920,  641],
  [64_920, 80_170,  814],
  [80_170, Infinity, 1_034],
]

function calcIncomeScore(annualTaxableIncome /* 천원 */) {
  const entry = INCOME_SCORE_TABLE.find(([lo, hi]) =>
    annualTaxableIncome >= lo && annualTaxableIncome < hi
  )
  return entry ? entry[2] : 1_034
}
```

### 2-2. 재산점수 계산

#### 재산 과표 산정

```
재산세 과세표준 = 공시가격 × 60%
공시가격 ≈ 시가 × 0.7 (아파트 기준, 연도별 상이)

이 프로젝트 (부동산 26억 시가 기준):
  공시가격 추정: 26억 × 0.70 = 18.2억
  재산세 과표:   18.2억 × 0.60 = 10.92억 → 약 10.9억
  (실제 공시가격은 국토부 공시가격 알리미에서 확인 필요)
```

#### 재산점수 구간표 (2024, 핵심 구간, 단위: 만원)

| 재산세 과표 | 점수 |
|------|------|
| 450 이하 | 22 |
| 450 ~ 900 | 44 |
| 900 ~ 1,350 | 69 |
| 1,350 ~ 1,800 | 99 |
| 1,800 ~ 2,700 | 138 |
| 2,700 ~ 3,600 | 192 |
| 3,600 ~ 4,500 | 249 |
| 4,500 ~ 5,400 | 310 |
| 5,400 ~ 6,300 | 376 |
| 6,300 ~ 7,200 | 442 |
| 7,200 ~ 8,100 | 507 |
| 8,100 ~ 9,000 | 572 |
| **9,000 ~ 9,900** | **638** ← 과표 10.9억 해당 구간 |
| 9,900 ~ 10,800 | 703 |
| **10,800 ~ 11,700** | **769** ← 과표 10.9억 가능 |
| 11,700 초과 | 비례 계산 |

```js
const ASSET_SCORE_TABLE = [
  [0,       4_500,   22],
  [4_500,   9_000,   44],
  [9_000,  13_500,   69],
  [13_500, 18_000,   99],
  [18_000, 27_000,  138],
  [27_000, 36_000,  192],
  [36_000, 45_000,  249],
  [45_000, 54_000,  310],
  [54_000, 63_000,  376],
  [63_000, 72_000,  442],
  [72_000, 81_000,  507],
  [81_000, 90_000,  572],
  [90_000, 99_000,  638],
  [99_000, 108_000, 703],
  [108_000, 117_000, 769], // ← 10.9억(=109,000만) 해당
  [117_000, Infinity, 835],
]

function calcAssetScore(realEstateMarketValue /* 천원 */) {
  // 공시가격 = 시가 × 0.7, 과세표준 = 공시가격 × 0.6
  const taxableBase = realEstateMarketValue * 0.7 * 0.6
  const taxableBaseManwon = taxableBase / 1_000 // 천원 → 만원 변환
  const entry = ASSET_SCORE_TABLE.find(([lo, hi]) =>
    taxableBaseManwon >= lo && taxableBaseManwon < hi
  )
  return entry ? entry[2] : 835
}
```

### 2-3. 최종 보험료 계산

```js
const SCORE_UNIT_PRICE = 208.4 // 원/점 (2024년)
const LTC_RATE = 0.1295         // 장기요양보험료율 (건보료의 12.95%)

/**
 * @param {number} annualTaxableIncome  연간 과세 소득 (천원)
 * @param {number} realEstateValue      부동산 시가 (천원)
 * @returns {{ income, asset, health, ltc, total }} 월 보험료 (천원)
 */
function localSubscriberPremium(annualTaxableIncome, realEstateValue) {
  const incomeScore = calcIncomeScore(annualTaxableIncome)
  const assetScore  = calcAssetScore(realEstateValue)
  const totalScore  = incomeScore + assetScore

  const monthlyHealth = Math.round(totalScore * SCORE_UNIT_PRICE / 1_000) // 천원
  const monthlyLTC    = Math.round(monthlyHealth * LTC_RATE)
  const monthlyTotal  = monthlyHealth + monthlyLTC

  return {
    income: Math.round(incomeScore * SCORE_UNIT_PRICE / 1_000),
    asset:  Math.round(assetScore  * SCORE_UNIT_PRICE / 1_000),
    health: monthlyHealth,
    ltc:    monthlyLTC,
    total:  monthlyTotal,
  }
}
```

#### 이 프로젝트 참조 계산 (57세 기준)

```
과세 소득: 임대 20,664천원/년 (필요경비 공제 후)
  → 소득점수: 505점 (42,600~52,590만원 구간)

부동산 시가: 2,600,000천원 (26억)
  → 공시가격: 2,600,000 × 0.70 = 1,820,000천원
  → 과세표준: 1,820,000 × 0.60 = 1,092,000천원 = 109,200만원
  → 재산점수: 703~769점

합산점수: 505 + 703~769 = 1,208~1,274점
건강보험료: 1,208~1,274 × 208.4 = 251,828~265,482원 ≈ 252~265천원/월
장기요양:   252~265 × 12.95% = 33천원/월
합계:       285~298천원/월 ≈ 약 29~30만원/월

⚠️ 단, 금융자산(1억) 500만원 초과분도 재산에 포함 시 재산점수 증가 가능
→ 실제 보험료는 30~40만원/월 수준으로 추정
```

> 기존 추정(80~100만원)과 차이 발생 → 공시가격 실측 후 재계산 필요. **추정값**

### 2-4. 피부양자 자격 판정

```js
/**
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
function dependentEligibility(annualIncome /* 천원 */, realEstateValue /* 천원 */) {
  const reasons = []
  const INCOME_LIMIT  = 20_000   // 2,000만원
  const ASSET_LIMIT_A = 900_000  // 과표 9억 (시가로 역산: 약 21.4억)
  const ASSET_LIMIT_B = 540_000  // 과표 5.4억
  const INCOME_B_LIMIT = 10_000  // 1,000만원 (재산B 조건)

  const assetTaxBase = realEstateValue * 0.7 * 0.6 // 과세표준

  // 소득 기준
  if (annualIncome > INCOME_LIMIT)
    reasons.push(`소득 초과: ${annualIncome/1000}만원 > 2,000만원`)

  // 재산 기준 A
  if (assetTaxBase > ASSET_LIMIT_A)
    reasons.push(`재산 과표 초과: ${Math.round(assetTaxBase/10000)}억 > 9억`)

  // 재산 기준 B
  if (assetTaxBase > ASSET_LIMIT_B && annualIncome > INCOME_B_LIMIT)
    reasons.push(`재산(5.4억~9억) + 소득 1,000만 초과 동시 충족`)

  return { eligible: reasons.length === 0, reasons }
}

// 이 프로젝트 결과:
// → eligible: false
// → reasons: ['소득 초과: 3600만원 > 2,000만원', '재산 과표 초과: 10.9억 > 9억']
```

---

## 3. scenarioCalc.js — 절세 시나리오 비교

### 3-1. 4개 시나리오 정의

| ID | 이름 | 핵심 변수 |
|------|------|------|
| `current` | 현재 계획 | 엑셀 기준 그대로 수령 |
| `spread` | 분산 수령 | 세제적격 연 1,500만원 이하 유지, IRP 65세 이후 분산 |
| `delayed` | 지연 수령 | 국민연금 70세 지연 (+36%), 65~70세 IRP로 보완 |
| `optimal` | 최적 조합 | spread + delayed 결합 |

### 3-2. 시나리오별 월 수령액 조정 로직

```js
/**
 * 시나리오별 나이별 연간 수령액 배열 생성
 * @param {'current'|'spread'|'delayed'|'optimal'} scenario
 * @returns {{ age, pension, rental, gross, tax, insurance, net }[]}
 */
function calcScenario(scenario) {
  return AGES.map((age, i) => {
    let pension = { ...getPensionAtAge(i) } // 기본값: 엑셀 데이터

    // --- 시나리오별 조정 ---
    if (scenario === 'delayed' || scenario === 'optimal') {
      // 국민연금 65→70세 지연: 65~69세 국민연금 0으로, 70세~는 +36%
      if (age >= 65 && age < 70) {
        pension.national = 0
      } else if (age >= 70) {
        pension.national = Math.round(pension.national * 1.36)
      }
    }

    if (scenario === 'spread' || scenario === 'optimal') {
      // IRP 인출: 65세 이전 연 1,500만원 이하 유지
      // (연금저축 237만 + IRP 962만 = 1,199만 → 분리과세 유지)
      if (age < 65) {
        pension.irp = age >= 57 ? 9_620 : 0  // 천원/년
      }
    }

    // --- 세금 계산 ---
    const annualGross = sumPension(pension) + income.rental * 12
    const annualTax   = calcTotalTax(age, pension, income)
    const annualIns   = localSubscriberPremium(
      calcTaxableIncome(pension, income),
      assets.realEstate
    ).total * 12

    return {
      age,
      gross:     Math.round(annualGross / 12),
      tax:       Math.round(annualTax / 12),
      insurance: Math.round(annualIns / 12),
      net:       Math.round((annualGross - annualTax - annualIns) / 12),
    }
  })
}
```

### 3-3. 시나리오 비교 요약 계산

```js
/**
 * 4개 시나리오 비교 요약 (65세 기준)
 */
function compareScenarios() {
  const scenarios = ['current', 'spread', 'delayed', 'optimal']
  return scenarios.map(id => {
    const data = calcScenario(id)
    const at65 = data.find(d => d.age === 65)
    const at70 = data.find(d => d.age === 70)
    const lifetimeNet = data.reduce((sum, d) => sum + d.net * 12, 0)

    return {
      id,
      netAt65:     at65?.net,
      netAt70:     at70?.net,
      annualTaxAt65:  at65?.tax,
      annualInsAt65:  at65?.insurance,
      lifetimeNet,
    }
  })
}
```

---

## 4. formatters.js — 숫자 포맷

```js
import numeral from 'numeral'

// 만원 단위 표시 (예: 34,178 → "3,418만원")
export const toManwon = (cheonwon) =>
  numeral(Math.round(cheonwon / 10)).format('0,0') + '만원'

// 억원 단위 표시 (예: 390,000 → "3.9억원")
export const toEokwon = (cheonwon) =>
  numeral(cheonwon / 100_000).format('0.0') + '억원'

// 월 수령액 표시 (천원/년 → 만원/월)
export const toMonthlyManwon = (annualCheonwon) =>
  numeral(Math.round(annualCheonwon / 120)).format('0,0') + '만원'
  //                                   ↑ /12(월) /10(천원→만원) = /120
```

---

## 5. 현재 근로소득 세금 계산 (은퇴 전 기준)

> 소득세법 제47조 근로소득공제 / 2024 기준

### 5-1. 근로소득공제표

| 총 급여액 | 공제율 |
|------|------|
| 500만원 이하 | 70% |
| 500만 ~ 1,500만 | 40% |
| 1,500만 ~ 4,500만 | 15% |
| 4,500만 ~ 1억원 | 10% |
| **1억원 초과** | **5%** ← 한도 2,000만원 |

```js
function laborIncomeDeduction(totalSalary /* 천원 */) {
  let deduction = 0
  if (totalSalary <= 5_000)       deduction = totalSalary * 0.70
  else if (totalSalary <= 15_000) deduction = 3_500 + (totalSalary - 5_000) * 0.40
  else if (totalSalary <= 45_000) deduction = 7_500 + (totalSalary - 15_000) * 0.15
  else if (totalSalary <= 100_000) deduction = 12_000 + (totalSalary - 45_000) * 0.10
  else deduction = 17_500 + (totalSalary - 100_000) * 0.05
  return Math.min(deduction, 20_000) // 한도 2,000만원
}
```

### 5-2. 이 프로젝트 참조 계산 (현재 소득 기준)

```
총 급여: 170,000천원 (연봉 1.2억 + 보너스 5천만)

근로소득공제:
  5,000천원 × 70%    =  3,500천원
  10,000 × 40%       =  4,000천원
  30,000 × 15%       =  4,500천원
  55,000 × 10%       =  5,500천원
  70,000 × 5%        =  3,500천원
  합계 21,000 → 한도  = 20,000천원 (2,000만원)

근로소득금액: 170,000 - 20,000 = 150,000천원 (1.5억)

기본공제:
  본인 1,500 + 배우자 1,500 + 자녀2 × 1,500 + 부모2 × 1,500 = 9,000천원

과세표준 (기타공제 미반영 간략화):
  150,000 - 9,000 = 141,000천원 → 약 1.41억

종합소득세 (38% 구간):
  141,000 × 38% - 19,940 = 53,580 - 19,940 = 33,640천원
  지방소득세 (10%): 3,364천원
  합계: 37,004천원 ≈ 연 3,700만원 (추정)

실효세율: 3,700 / 17,000 ≈ 21.8%
월 세금:  약 308만원
세후 월 수령: (170,000 - 37,000 - 사대보험) / 12 ≈ 약 1,100~1,150만원
```

> ⚠️ 연금저축·IRP 납입액, 의료비, 교육비 등 추가 공제 항목에 따라 세금 감소 가능 — **추정값**

### 5-3. 55~56세 재직+연금 병행 기간 세금 영향

```
55세 (2028): 급여 1.7억 + 연금 수령 시작
  - 세제비적격 (노후적립): 비과세 → 종합소득세 영향 없음
  - 이율보증형은 DB 운용상품으로 재분류 → 퇴직소득세/연금소득세 확인 필요
  - 세제적격 (연금저축 56세~): 분리과세 5.5% → 종합소득세 합산 제외
  → 근로소득세만 납부 (연 약 3,700만원)
  → 연금 수령 병행으로 실제 세금 증가 없음

56세 (2029): 연금저축 추가
  - 연금저축 2,377천원/년 × 5.5% = 131천원 (별도 분리과세)
  → 총 세금 약 3,713만원 (거의 변화 없음)
```

### 5-4. 은퇴 전후 세금 비교 (절세 효과 정량화)

| 시점 | 연 총소득 | 연 세금+건보료 | 연 세후소득 | 월 세후 |
|------|---:|---:|---:|---:|
| 재직 중 (53~54세) | 1.7억 | 약 4,200만원 | **약 1.28억** | **약 1,067만원** |
| 재직+연금 병행 (55~56세) | 약 2.1억 | 약 4,400만원 | **약 1.66억** | **약 1,383만원** |
| **은퇴 직후 (57세)** | **7,700만원** | **약 950만원** | **약 6,750만원** | **약 563만원** |
| 국민연금 개시 (65세) | 1.35억 | 약 1,700만원 | **약 1.18억** | **약 983만원** |

> 세금 부담: 재직 시 연 4,200만원 → 은퇴 후 950만원 → **연 3,250만원 절감**  
> 역설적으로 은퇴가 세금 측면에서는 유리 (소득세율 구간 38% → 15~24% 급락)

---

## 6. 엣지 케이스 & 주의사항

| 케이스 | 처리 방법 |
|------|------|
| 국민연금 65세 수령액(12,834) = 반년치 | 화면 표시 시 "첫 해 (7개월분)" 주석 |
| IRP 인출 시점 미결정 | 화면 1에서 사용자가 선택, 기본값 = 65세 |
| 변액연금 비과세 요건 미확인 | "비과세 가정" 배지 표시 + 확인 권고 |
| 임대소득 단순경비율 vs 장부 | MVP는 단순경비율 42.6% 고정 사용 |
| 근속연수 미입력 | 기본값 30년, 화면 1에서 수정 가능 |
| 금융자산 건보료 포함 여부 | 500만원 초과분 재산점수 포함, MVP는 제외 처리 후 주석 |
| 부동산 공시가격 vs 시가 | 기본값 70% 적용, 사용자 직접 조정 가능 |

---

*기준: 국세청 2024 / 건보공단 2024 | 모든 계산은 추정값으로 표시 필요*
