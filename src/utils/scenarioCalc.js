/**
 * 절세 시나리오 비교 계산 (스텁)
 * 출처: 05-calc-logic.md §3
 * 화면 5 (TaxScenario) 구현 시 완성 예정
 */

import { AGES, PENSION_ANNUAL } from '@/data/pensionData'
import { USER_DEFAULTS } from '@/data/userData'

export const SCENARIO_IDS = ['current', 'spread', 'delayed', 'optimal']

export const SCENARIO_META = {
  current: { label: '현재 계획',   color: '#94A3B8' },
  spread:  { label: '분산 수령',   color: '#3B82F6' },
  delayed: { label: '지연 수령',   color: '#10B981' },
  optimal: { label: '최적 조합',   color: '#F59E0B' },
}

/**
 * 시나리오별 나이별 데이터 (스텁 — 현재 계획만 실제 반환)
 * @param {'current'|'spread'|'delayed'|'optimal'} scenarioId
 * @param {{ rental: number }} income  소득 입력 (천원/월)
 * @returns {{ age, gross, net }[]}  만원/월
 */
export function calcScenario(scenarioId, income = USER_DEFAULTS.income) {
  return AGES.map((age, i) => {
    const pensionAnnual = Object.values(PENSION_ANNUAL).reduce((s, arr) => s + arr[i], 0)
    const rentalAnnual = income.rental * 12

    let nationalAnnual = PENSION_ANNUAL.national[i]

    // 지연 수령: 국민연금 65→70세 연기, 70세+ 36% 증가
    if (scenarioId === 'delayed' || scenarioId === 'optimal') {
      if (age >= 65 && age < 70) {
        nationalAnnual = 0
      } else if (age >= 70) {
        nationalAnnual = Math.round(PENSION_ANNUAL.national[i] * 1.36)
      }
    }

    const adjustedPensionAnnual = pensionAnnual
      - PENSION_ANNUAL.national[i]
      + nationalAnnual

    const grossMonthly = Math.round((adjustedPensionAnnual + rentalAnnual) / 10 / 12)

    // TODO: 세금·건보료 차감 계산 (화면 5 구현 시 완성)
    const estimatedTaxRate = age >= 65 ? 0.12 : 0.08
    const netMonthly = Math.round(grossMonthly * (1 - estimatedTaxRate))

    return { age, gross: grossMonthly, net: netMonthly }
  })
}

/**
 * 4개 시나리오 비교 요약 (65세 기준)
 * @param {{ rental: number }} income
 */
export function compareScenarios(income = USER_DEFAULTS.income) {
  return SCENARIO_IDS.map(id => {
    const data = calcScenario(id, income)
    const at65 = data.find(d => d.age === 65)
    const at70 = data.find(d => d.age === 70)
    return {
      id,
      ...SCENARIO_META[id],
      netAt65: at65?.net ?? 0,
      netAt70: at70?.net ?? 0,
      byAge: data,
    }
  })
}
