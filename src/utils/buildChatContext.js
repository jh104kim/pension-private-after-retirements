function toManwonFromHealthKw(value) {
  return Math.round((value ?? 0) / 10)
}

function flowLine(row) {
  if (!row) return null
  const pensionOnly = (row.total ?? 0) - (row.rental ?? 0)
  return `${row.age}세: 본인 총 ${row.total}만원/월, 본인 연금 ${pensionOnly}만원/월, 임대 ${row.rental}만원/월, 국민연금 ${row.national}만원, DB합계 ${row.dbTotal}만원, 본인 비과세 ${row.nontax}만원, 자녀 양도 예정 ${row.childTransfer}만원`
}

export function buildChatContext({ income, balances, assets, cashFlowByAge, healthByAge }) {
  const milestoneAges = [57, 60, 61, 65, 70, 75, 80, 81, 90]
  const cashFlowSummary = milestoneAges
    .map(age => flowLine(cashFlowByAge.find(row => row.age === age)))
    .filter(Boolean)
    .join('\n')

  const health57 = healthByAge.find(row => row.age === 57)
  const health65 = healthByAge.find(row => row.age === 65)
  const rentalMonthly = Math.round((income.rental ?? 0) / 10)
  const laborMonthly = Math.round((income.labor ?? 0) / 10)
  const financialAnnual = Math.round(((income.financial ?? 0) * 12) / 10)
  const otherAnnual = Math.round(((income.other ?? 0) * 12) / 10)

  return `
사용자 기본 정보
- 1973년 5월생, 2026년 기준 53세
- 2030년 57세 은퇴 예정
- 국민연금 표준 개시: 2038년 65세
- 부양가족: 배우자, 자녀 2명, 부모님 2명

연금 데이터 기준
- 원천: 연금수령.xlsx, pensionData.js 배열
- 분석 기간: 55세~90세
- DB퇴직연금: 삼성증권 DB채권형 61~80세 + 삼성생명 이율보증형 55~74세로 분류
- DB채권형 잔액/정확한 계좌 성격: 추가 확인 필요, 현재 확인 잔액 ${Math.round((balances.db ?? 0) / 100_000 * 10) / 10}억원
- IRP: 잔액 ${Math.round((balances.irp ?? 0) / 10).toLocaleString('ko-KR')}만원
- 연금저축: 56~90세, 잔액 ${Math.round((balances.savings ?? 0) / 10).toLocaleString('ko-KR')}만원
- 노후적립연금(nohup): 55~74세
- 이율보증형: 퇴직연금 DB 운용상품으로 재분류, 55~74세
- indexUp / smartTop: 65~90세
- ourChild1 / ourChild2: 60~90세, 자녀 양도 예정이므로 본인 연금 합계에서 제외하고 별도 표기

현재 입력 소득과 자산
- 임대소득: 월 ${rentalMonthly.toLocaleString('ko-KR')}만원
- 은퇴 후 근로소득: 월 ${laborMonthly.toLocaleString('ko-KR')}만원
- 금융소득: 연 ${financialAnnual.toLocaleString('ko-KR')}만원
- 기타소득: 연 ${otherAnnual.toLocaleString('ko-KR')}만원
- 부동산 시가: ${Math.round((assets.realEstate ?? 0) / 100_000 * 10) / 10}억원
- 금융자산: ${Math.round((assets.financial ?? 0) / 100_000 * 10) / 10}억원

주요 현금흐름(세전 추정)
${cashFlowSummary}

건강보험료 추정
- 57세 기준: 약 ${toManwonFromHealthKw(health57?.total).toLocaleString('ko-KR')}만원/월
- 65세 기준: 약 ${toManwonFromHealthKw(health65?.total).toLocaleString('ko-KR')}만원/월
- 임대소득 연 3,600만원과 부동산 26억원 기준에서는 피부양자 탈락 및 지역가입자 전환 가능성이 높음
- 지역가입자 전환은 보험료 부담이 새로 발생하거나 증가하는 리스크로 설명해야 함
- 보험료 절감은 임대소득 감소, 부동산 처분, 직장가입자/피부양자 자격 등 별도 조건이 있을 때만 가능하므로 단정하지 않음

중요 전제
- 모든 세금과 건강보험료는 앱 계산식 기반 추정값이다.
- 우리아이 1·2는 자녀 양도 예정이므로 본인 은퇴 현금흐름으로 설명하지 않는다.
- 확정적 세무 자문, 건강보험 자격 확정 판단, 투자 권유를 하지 않는다.
- 정확한 세액과 보험료는 세무사, 국민건강보험공단, 금융기관 확인이 필요하다.
`.trim()
}
