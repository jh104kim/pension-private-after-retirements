import { createContext, useContext, useState, useMemo } from 'react'
import { AGES, PENSION_ANNUAL } from '@/data/pensionData'
import { USER_DEFAULTS } from '@/data/userData'
import { localSubscriberPremium } from '@/utils/healthInsCalc'

const PensionContext = createContext(null)

export function PensionProvider({ children }) {
  // ── 사용자 입력 상태 ──────────────────────────────────────
  const [income,   setIncome]   = useState(USER_DEFAULTS.income)
  const [balances, setBalances] = useState(USER_DEFAULTS.balances)
  const [assets,   setAssets]   = useState(USER_DEFAULTS.assets)

  // ── 나이별 현금흐름 (만원/월) ─────────────────────────────
  const cashFlowByAge = useMemo(() =>
    AGES.map((age, i) => {
      const pensionItems = {
        national:   Math.round(PENSION_ANNUAL.national[i]   / 10 / 12),
        db:         Math.round(PENSION_ANNUAL.db[i]         / 10 / 12),
        savings:    Math.round(PENSION_ANNUAL.savings[i]    / 10 / 12),
        guaranteed: Math.round(PENSION_ANNUAL.guaranteed[i] / 10 / 12),
        nohup:      Math.round(PENSION_ANNUAL.nohup[i]      / 10 / 12),
        indexUp:    Math.round(PENSION_ANNUAL.indexUp[i]    / 10 / 12),
        ourChild1:  Math.round(PENSION_ANNUAL.ourChild1[i]  / 10 / 12),
        smartTop:   Math.round(PENSION_ANNUAL.smartTop[i]   / 10 / 12),
        ourChild2:  Math.round(PENSION_ANNUAL.ourChild2[i]  / 10 / 12),
      }
      const dbTotal = pensionItems.db + pensionItems.guaranteed
      const ownNontax = pensionItems.nohup + pensionItems.indexUp + pensionItems.smartTop
      const childTransfer = pensionItems.ourChild1 + pensionItems.ourChild2
      const pensionTotal = pensionItems.national + dbTotal + pensionItems.savings + ownNontax
      const excelPensionTotal = pensionTotal + childTransfer
      const rentalMonthly = Math.round(income.rental / 10)  // 천원/월 → 만원/월

      return {
        age,
        ...pensionItems,
        dbTotal,
        nontax: ownNontax,
        ownNontax,
        childTransfer,
        rental: rentalMonthly,
        total:  pensionTotal + rentalMonthly,
        excelTotal: excelPensionTotal + rentalMonthly,
      }
    }),
  [income])

  // ── 나이별 건강보험료 (천원/월) ───────────────────────────
  const healthByAge = useMemo(() =>
    AGES.map((age, i) => {
      // 건보 소득 기준: 국민연금 gross + 임대 gross 연간 합산
      const nationalGross = PENSION_ANNUAL.national[i]           // 천원/년
      const rentalGross   = income.rental * 12                   // 천원/년
      const annualGross   = nationalGross + rentalGross

      const result = localSubscriberPremium(annualGross, assets.realEstate)
      return { age, ...result }
    }),
  [income, assets])

  return (
    <PensionContext.Provider value={{
      income,   setIncome,
      balances, setBalances,
      assets,   setAssets,
      cashFlowByAge,
      healthByAge,
    }}>
      {children}
    </PensionContext.Provider>
  )
}

export function usePensionContext() {
  const ctx = useContext(PensionContext)
  if (!ctx) throw new Error('usePensionContext must be used within PensionProvider')
  return ctx
}
