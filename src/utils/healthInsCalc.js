/**
 * 건강보험료 계산 유틸리티
 * 출처: 국민건강보험공단 2024 / 05-calc-logic.md §2
 * 단위: 입력 천원, 출력 천원/월
 * ⚠️ 모든 결과는 추정값 — UI에 "추정" 또는 "공단 확인 필요" 라벨 필수
 */

// ─── 소득점수 테이블 (단위: 천원/년) ────────────────────────
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
  [42_600, 52_590,  505],
  [52_590, 64_920,  641],
  [64_920, 80_170,  814],
  [80_170, Infinity, 1_034],
]

/**
 * 연간 과세소득 합계 → 소득점수
 * @param {number} annualTaxableIncome  천원/년 (국민연금 gross + 임대 gross 합산)
 * @returns {number}  소득점수
 */
export function calcIncomeScore(annualTaxableIncome) {
  if (annualTaxableIncome <= 0) return 0
  const entry = INCOME_SCORE_TABLE.find(([lo, hi]) =>
    annualTaxableIncome >= lo && annualTaxableIncome < hi
  )
  return entry ? entry[2] : 1_034
}

// ─── 재산점수 테이블 (단위: 만원, 재산세 과표 기준) ─────────
const ASSET_SCORE_TABLE = [
  [0,        4_500,   22],
  [4_500,    9_000,   44],
  [9_000,   13_500,   69],
  [13_500,  18_000,   99],
  [18_000,  27_000,  138],
  [27_000,  36_000,  192],
  [36_000,  45_000,  249],
  [45_000,  54_000,  310],
  [54_000,  63_000,  376],
  [63_000,  72_000,  442],
  [72_000,  81_000,  507],
  [81_000,  90_000,  572],
  [90_000,  99_000,  638],
  [99_000, 108_000,  703],
  [108_000, 117_000, 769],
  [117_000, Infinity, 835],
]

/**
 * 부동산 시가 → 재산점수
 * 시가 × 0.7 (공시가격) × 0.6 (과세표준) → 만원 단위 테이블 조회
 * @param {number} realEstateMarketValue  부동산 시가 (천원)
 * @returns {number}  재산점수
 */
export function calcAssetScore(realEstateMarketValue) {
  if (realEstateMarketValue <= 0) return 0
  const taxableBase = realEstateMarketValue * 0.7 * 0.6   // 재산세 과표 (천원)
  const taxableBaseManwon = taxableBase / 10               // 천원 → 만원 (1만원=10천원)
  const entry = ASSET_SCORE_TABLE.find(([lo, hi]) =>
    taxableBaseManwon >= lo && taxableBaseManwon < hi
  )
  return entry ? entry[2] : 835
}

// ─── 보험료 단가 ─────────────────────────────────────────────
const SCORE_UNIT_PRICE = 208.4   // 원/점 (2024년)
const LTC_RATE         = 0.1295  // 장기요양보험료율

/**
 * 지역가입자 월 건강보험료 추정
 *
 * 소득 기준: 국민연금 + 임대 gross 합산 (세전 총수령액)
 *
 * @param {number} annualGrossIncome   연간 과세소득 합계 (천원) — 국민연금+임대 합계
 * @param {number} realEstateValue     부동산 시가 (천원)
 * @returns {{
 *   incomeScore, assetScore, totalScore,
 *   income, asset, health, ltc, total  ← 모두 월 단위, 천원
 * }}
 */
export function localSubscriberPremium(annualGrossIncome, realEstateValue) {
  const incomeScore = calcIncomeScore(annualGrossIncome)
  const assetScore  = calcAssetScore(realEstateValue)
  const totalScore  = incomeScore + assetScore

  // 보험료 원 → 천원 (÷1000)
  const monthlyHealthWon = Math.round(totalScore * SCORE_UNIT_PRICE)
  const monthlyHealth    = Math.round(monthlyHealthWon / 1_000)
  const monthlyLTC       = Math.round(monthlyHealth * LTC_RATE)
  const monthlyTotal     = monthlyHealth + monthlyLTC

  return {
    incomeScore,
    assetScore,
    totalScore,
    income: Math.round(incomeScore * SCORE_UNIT_PRICE / 1_000),
    asset:  Math.round(assetScore  * SCORE_UNIT_PRICE / 1_000),
    health: monthlyHealth,
    ltc:    monthlyLTC,
    total:  monthlyTotal,
  }
}

// ─── 피부양자 자격 판정 ──────────────────────────────────────
/**
 * @param {number} annualIncome     연간 소득 합계 (천원)
 * @param {number} realEstateValue  부동산 시가 (천원)
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function dependentEligibility(annualIncome, realEstateValue) {
  const reasons = []
  const INCOME_LIMIT   = 20_000   // 2,000만원 (천원)
  const ASSET_LIMIT_A  = 900_000  // 과표 9억 (천원)
  const ASSET_LIMIT_B  = 540_000  // 과표 5.4억 (천원)
  const INCOME_B_LIMIT = 10_000   // 1,000만원 (천원)

  const assetTaxBase = realEstateValue * 0.7 * 0.6  // 재산세 과표 (천원)

  if (annualIncome > INCOME_LIMIT)
    reasons.push(`소득 기준 초과: ${Math.round(annualIncome / 1_000)}만원 > 2,000만원`)

  if (assetTaxBase > ASSET_LIMIT_A)
    reasons.push(`재산 과표 초과: ${(assetTaxBase / 100_000).toFixed(1)}억 > 9억`)

  if (assetTaxBase > ASSET_LIMIT_B && assetTaxBase <= ASSET_LIMIT_A && annualIncome > INCOME_B_LIMIT)
    reasons.push('재산(5.4억~9억) + 소득 1,000만 초과 동시 충족')

  return { eligible: reasons.length === 0, reasons }
}
