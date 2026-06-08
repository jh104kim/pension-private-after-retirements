// 데이터 검증 스크립트 — node verify-data.js
import {
  PENSION_ANNUAL,
  AGES,
  PENSION_TOTAL,
  MY_PENSION_TOTAL,
  CHILD_TRANSFER_TOTAL,
  getCashFlowByAge,
} from './src/data/pensionData.js'

const EXPECTED_SUMS = {
  national:   850759,
  db:         185140,
  guaranteed: 496680,
  nohup:      276115,
  indexUp:    305832,
  ourChild1:  165608,
  smartTop:   366658,
  ourChild2:  158028,
  savings:     83207,
}

let ok = true

// 1. 나이 배열 길이
if (AGES.length !== 36) {
  console.error(`❌ AGES.length = ${AGES.length} (expected 36)`)
  ok = false
} else {
  console.log(`✅ AGES.length = 36  (55~90세)`)
}

// 2. 각 상품 배열 길이·합계
for (const [key, arr] of Object.entries(PENSION_ANNUAL)) {
  const len = arr.length
  const sum = arr.reduce((a, b) => a + b, 0)
  const exp = EXPECTED_SUMS[key]

  if (len !== 36) {
    console.error(`❌ ${key} length = ${len}`)
    ok = false
  } else if (exp !== undefined && sum !== exp) {
    console.error(`❌ ${key} sum = ${sum.toLocaleString()} (expected ${exp.toLocaleString()})`)
    ok = false
  } else {
    console.log(`✅ ${key.padEnd(12)} len=36  sum=${sum.toLocaleString().padStart(9)} ${exp ? '✓' : '(no expected)'}`)
  }
}

// 3. PENSION_TOTAL 일치
const manualTotal = AGES.map((_, i) =>
  Object.values(PENSION_ANNUAL).reduce((s, arr) => s + arr[i], 0)
)
const mismatch = PENSION_TOTAL.findIndex((v, i) => v !== manualTotal[i])
if (mismatch !== -1) {
  console.error(`❌ PENSION_TOTAL[${mismatch}] = ${PENSION_TOTAL[mismatch]} vs manual ${manualTotal[mismatch]}`)
  ok = false
} else {
  console.log(`✅ PENSION_TOTAL matches sum of all 9 arrays`)
}

// 4. 본인 합계 / 자녀 양도 예정 합계 일치
const manualChildTransfer = AGES.map((_, i) =>
  PENSION_ANNUAL.ourChild1[i] + PENSION_ANNUAL.ourChild2[i]
)
const childMismatch = CHILD_TRANSFER_TOTAL.findIndex((v, i) => v !== manualChildTransfer[i])
if (childMismatch !== -1) {
  console.error(`❌ CHILD_TRANSFER_TOTAL[${childMismatch}] = ${CHILD_TRANSFER_TOTAL[childMismatch]} vs manual ${manualChildTransfer[childMismatch]}`)
  ok = false
} else {
  console.log(`✅ CHILD_TRANSFER_TOTAL matches ourChild1 + ourChild2`)
}

const myMismatch = MY_PENSION_TOTAL.findIndex((v, i) => v !== PENSION_TOTAL[i] - CHILD_TRANSFER_TOTAL[i])
if (myMismatch !== -1) {
  console.error(`❌ MY_PENSION_TOTAL[${myMismatch}] = ${MY_PENSION_TOTAL[myMismatch]} vs source ${PENSION_TOTAL[myMismatch] - CHILD_TRANSFER_TOTAL[myMismatch]}`)
  ok = false
} else {
  console.log(`✅ MY_PENSION_TOTAL excludes child-transfer products`)
}

// 5. getCashFlowByAge 샘플
const cf = getCashFlowByAge()
if (cf.length !== 36 || cf[0].age !== 55 || cf[35].age !== 90) {
  console.error(`❌ getCashFlowByAge() output invalid`)
  ok = false
} else {
  console.log(`✅ getCashFlowByAge() returns 36 rows, age 55~90`)
}

const age65 = cf.find(row => row.age === 65)
if (!age65 || age65.total !== age65.excelTotal - age65.childTransfer) {
  console.error(`❌ age65 total should exclude childTransfer`)
  ok = false
} else {
  console.log(`✅ cashFlowByAge total excludes childTransfer; childTransfer is separate`)
}

console.log(ok ? '\n✅ 모든 검증 통과' : '\n❌ 검증 실패 있음')
process.exit(ok ? 0 : 1)
