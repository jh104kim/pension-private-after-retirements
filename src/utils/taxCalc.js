/**
 * 세금 계산 유틸리티
 * 출처: 국세청 2024 / 05-calc-logic.md §1
 * 단위: 모든 입·출력 천원
 * ⚠️ 모든 결과는 추정값 — UI에 "추정" 라벨 필수
 */

// ─── 종합소득세 (2024 기준) ─────────────────────────────────
const TAX_BRACKETS = [
  [14_000,    0.06,       0],
  [50_000,    0.15,   1_260],
  [88_000,    0.24,   5_760],
  [150_000,   0.35,  15_440],
  [300_000,   0.38,  19_940],
  [500_000,   0.40,  25_940],
  [1_000_000, 0.42,  35_940],
  [Infinity,  0.45,  65_940],
]

/**
 * 종합소득세 (지방소득세 10% 포함)
 * @param {number} taxableIncome  과세표준 (천원)
 * @returns {number}              세액 (천원)
 */
export function comprehensiveIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0
  const [, rate, deduction] = TAX_BRACKETS.find(([limit]) => taxableIncome <= limit)
  const incomeTax = taxableIncome * rate - deduction
  return Math.round(Math.max(0, incomeTax) * 1.1)  // 지방소득세 10%
}

// ─── 연금소득공제 (국민연금용) ──────────────────────────────
/**
 * @param {number} annualPension  연간 국민연금 수령액 (천원)
 * @returns {number}              공제액 (천원)
 */
export function pensionIncomeDeduction(annualPension) {
  const p = annualPension
  if (p <= 3_500)  return p
  if (p <= 7_000)  return 3_500 + (p - 3_500) * 0.4
  if (p <= 14_000) return 4_900 + (p - 7_000) * 0.2
  return Math.min(6_300 + (p - 14_000) * 0.1, 9_000)  // 한도 900만원
}

// ─── 사적연금 소득세 (세제적격: 연금저축·IRP) ─────────────
/**
 * @param {number} annualQualified       세제적격 연간 수령액 합계 (천원)
 * @param {number} age                   수령 나이
 * @param {number} otherTaxableIncome    기타 종합소득 과세분 (천원), 1,200만 초과 시 사용
 * @returns {{ tax: number, method: string }}
 */
export function privatePensionTax(annualQualified, age, otherTaxableIncome = 0) {
  const THRESHOLD = 12_000  // 1,200만원 (천원)
  if (annualQualified <= 0) return { tax: 0, method: 'none' }

  if (annualQualified <= THRESHOLD) {
    const rate = age >= 80 ? 0.033 : age >= 70 ? 0.044 : 0.055
    return { tax: Math.round(annualQualified * rate), method: 'separate' }
  }

  // 1,200만원 초과: A안(종합과세 증가분) vs B안(16.5% 분리)
  const taxA = comprehensiveIncomeTax(annualQualified + otherTaxableIncome)
             - comprehensiveIncomeTax(otherTaxableIncome)
  const taxB = Math.round(annualQualified * 0.165)

  return taxA <= taxB
    ? { tax: taxA, method: 'comprehensive' }
    : { tax: taxB, method: 'flat16.5' }
}

// ─── DB 퇴직연금 퇴직소득세 (연금 수령 배분) ──────────────
/**
 * 퇴직소득세 5단계 계산 후 연금 수령 기간으로 배분
 * @param {number} retirePay      퇴직급여 (천원)
 * @param {number} yearsOfService 근속연수
 * @param {number} annuityYears   연금 수령 기간 (년)
 * @returns {number}              연간 세금 (천원)
 */
export function dbRetirementTax(retirePay, yearsOfService = 30, annuityYears = 14) {
  // ① 근속연수 공제
  let tenureDeduct = 0
  const y = yearsOfService
  if (y <= 5)  tenureDeduct = 300 * y
  else if (y <= 10) tenureDeduct = 1_500 + 500 * (y - 5)
  else if (y <= 20) tenureDeduct = 4_000 + 800 * (y - 10)
  else tenureDeduct = 12_000 + 1_200 * (y - 20)

  // ② 환산급여
  const convertedPay = Math.max(0, retirePay - tenureDeduct) / y * 12

  // ③ 환산급여 공제
  let convertedDeduct = 0
  if (convertedPay <= 8_000)       convertedDeduct = convertedPay
  else if (convertedPay <= 70_000) convertedDeduct = 8_000 + (convertedPay - 8_000) * 0.6
  else if (convertedPay <= 100_000) convertedDeduct = 45_200 + (convertedPay - 70_000) * 0.55
  else if (convertedPay <= 300_000) convertedDeduct = 61_700 + (convertedPay - 100_000) * 0.45
  else convertedDeduct = 151_700 + (convertedPay - 300_000) * 0.35

  // ④ 환산 과세표준 → 산출세액
  const convertedTaxBase = Math.max(0, convertedPay - convertedDeduct)
  const convertedTax = comprehensiveIncomeTax(convertedTaxBase)
  const retireTax = convertedTax / 12 * y  // 환산 역산

  // ⑤ 연금 수령 감면 (10년 이하: 70%, 10년 초과: 60%)
  const reduction = annuityYears > 10 ? 0.6 : 0.7
  const annualTax = (retireTax * reduction) / annuityYears
  return Math.round(annualTax)
}

// ─── 근로소득공제 (현재 재직 기간) ─────────────────────────
/**
 * @param {number} totalSalary  총 급여액 (천원)
 * @returns {number}            공제액 (천원, 최대 2,000만원)
 */
export function laborIncomeDeduction(totalSalary) {
  let deduction = 0
  if (totalSalary <= 5_000)        deduction = totalSalary * 0.70
  else if (totalSalary <= 15_000)  deduction = 3_500 + (totalSalary - 5_000) * 0.40
  else if (totalSalary <= 45_000)  deduction = 7_500 + (totalSalary - 15_000) * 0.15
  else if (totalSalary <= 100_000) deduction = 12_000 + (totalSalary - 45_000) * 0.10
  else                             deduction = 17_500 + (totalSalary - 100_000) * 0.05
  return Math.min(Math.round(deduction), 20_000)  // 한도 2,000만원
}

// ─── 임대소득 과세 ──────────────────────────────────────────
/** 단순경비율 42.6% 적용한 과세 소득금액 */
export function rentalTaxableIncome(grossRentalAnnual) {
  return Math.round(grossRentalAnnual * (1 - 0.426))
}
