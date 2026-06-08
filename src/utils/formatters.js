/**
 * 숫자 포맷 유틸리티
 * 단위 규칙: 내부 계산 천원, 화면 표시 만원
 * 출처: 05-calc-logic.md §4
 */

/**
 * 천원 → 만원 문자열 (예: 34_178 → "3,418만원")
 * @param {number} cheonwon  천원 단위 금액
 */
export function toManwon(cheonwon) {
  const manwon = Math.round(cheonwon / 10)
  return manwon.toLocaleString('ko-KR') + '만원'
}

/**
 * 천원 → 억원 문자열 (예: 390_000 → "3.9억원")
 * @param {number} cheonwon  천원 단위 금액
 */
export function toEokwon(cheonwon) {
  const eok = (cheonwon / 100_000).toFixed(1)
  return eok + '억원'
}

/**
 * 연간 천원 → 월 만원 문자열 (예: 99_405 → "828만원")
 * pensionData.js 배열값(천원/년) → 화면 표시용
 * @param {number} annualCheonwon  연간 천원 금액
 */
export function toMonthlyManwon(annualCheonwon) {
  // ÷12 (월) ÷10 (천원→만원) = ÷120
  const manwon = Math.round(annualCheonwon / 120)
  return manwon.toLocaleString('ko-KR') + '만원'
}

/**
 * 만원 숫자 → 문자열 (예: 828 → "828만원")
 * 이미 만원으로 변환된 값에 사용
 * @param {number} manwon
 */
export function fmtManwon(manwon) {
  return Math.round(manwon).toLocaleString('ko-KR') + '만원'
}
