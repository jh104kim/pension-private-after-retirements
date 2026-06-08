/**
 * 사용자 기본값
 * 출처: 07-data-spec.md §6, 01-domain-def.md
 * 단위 규칙:
 *   balances, assets → 천원
 *   income           → 천원/월
 */
export const USER_DEFAULTS = {
  // ── 기본 정보 ──────────────────────────────────────────────
  birthYear:      1973,
  birthMonth:     5,
  retirementYear: 2030,
  retirementAge:  57,
  currentYear:    2026,
  currentAge:     53,

  // ── 연금 계좌 잔액 (단위: 천원) ────────────────────────────
  balances: {
    db:      390_000,   // DB퇴직연금 삼성증권 3.9억
    irp:      60_000,   // IRP 6천만원
    savings:  60_000,   // 연금저축 골드연금보험 6천만원
    // 변액·노후적립: 잔액 미기재, 엑셀 수령액 사용
  },

  // ── 자산 (단위: 천원) ──────────────────────────────────────
  assets: {
    financial:  100_000,    // 금융자산 1억원
    realEstate: 2_600_000,  // 부동산 시가 26억원
  },

  // ── 은퇴 후 소득 (단위: 천원/월) ───────────────────────────
  income: {
    rental:    3_000,   // 임대소득 300만원/월
    labor:         0,   // 근로소득 (기본값 0)
    financial:     0,   // 금융소득 (기본값 0)
    other:         0,
  },

  // ── 부양가족 ────────────────────────────────────────────────
  dependents: {
    spouse:   true,
    children: 2,
    parents:  2,
  },

  // ── DB 근속연수 (퇴직소득세 계산용) ───────────────────────
  yearsOfService: 30,   // 기본값 30년, 화면에서 수정 가능
}
