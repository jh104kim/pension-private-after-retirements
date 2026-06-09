/**
 * 연금 수령액 데이터
 * 출처: 연금수령.xlsx → 통합연금포탈_예시연금액 (1973년05월생)
 * 단위: 천원/년 (연간)
 * 인덱스: 0 = 55세 … 35 = 90세
 *
 * 검증 기준 (엑셀 소계):
 *   national:  850,759  db:      185,140  guaranteed: 496,680
 *   ※ DB: 61~80세 20년 수령 (9257×20=185,140) — 문서 "61~74세 14년" 오기
 *   nohup:     276,115  indexUp: 305,832  ourChild1:  165,608
 *   smartTop:  366,658  ourChild2: 158,028  savings:   83,207
 *   합계:    2,888,027
 */

export const AGES = Array.from({ length: 36 }, (_, i) => 55 + i)

// ─── 공적연금 ───────────────────────────────────────────────
/** 국민연금 노령연금 — 65세(i=10)부터 수령 */
export const national = [
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
   12834, 22682, 23385, 24110, 24858, 25628, 26423, 27242, 28087, 28957,
   29855, 30780, 31735, 32718, 33733, 34778, 35856, 36968, 38114, 39296,
   40514, 41770, 43065, 44400, 45776, 47195,
]

// ─── 세제적격 / 퇴직연금성 상품 ──────────────────────────────
/** DB퇴직연금 삼성증권 채권형(국고채 등 채권 운용상품 추정) — 61세(i=6)~80세(i=25), 20년 수령 */
export const db = [
       0,     0,     0,     0,     0,     0,  9257,  9257,  9257,  9257,
    9257,  9257,  9257,  9257,  9257,  9257,  9257,  9257,  9257,  9257,
    9257,  9257,  9257,  9257,  9257,  9257,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,
]

/** 연금저축골드연금보험 삼성생명 — 56세(i=1)~90세(i=35) */
export const savings = [
       0,  2377,  2377,  2377,  2377,  2377,  2377,  2377,  2377,  2377,
    2377,  2377,  2377,  2377,  2377,  2377,  2377,  2377,  2377,  2377,
    2377,  2377,  2377,  2377,  2378,  2378,  2378,  2378,  2378,  2378,
    2378,  2378,  2378,  2378,  2378,  2378,
]

/** 삼성생명 이율보증형(5년) 외 44건 — 퇴직연금 DB 운용상품으로 재분류, 55세(i=0)~74세(i=19) */
export const guaranteed = [
   24834, 24834, 24834, 24834, 24834, 24834, 24834, 24834, 24834, 24834,
   24834, 24834, 24834, 24834, 24834, 24834, 24834, 24834, 24834, 24834,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,
]

/** 個노후적립연금보험 삼성생명 — 55세(i=0)~74세(i=19) */
export const nohup = [
   13801, 13803, 13803, 13803, 13803, 13804, 13804, 13804, 13804, 13806,
   13806, 13806, 13806, 13808, 13808, 13808, 13808, 13810, 13810, 13810,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,
]

/** 인덱스Up변액연금 삼성생명 — 65세(i=10)~90세(i=35) */
export const indexUp = [
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
   11760, 11760, 11761, 11761, 11761, 11761, 11762, 11762, 11762, 11762,
   11763, 11763, 11763, 11763, 11763, 11763, 11763, 11763, 11764, 11764,
   11764, 11764, 11765, 11765, 11765, 11765,
]

/** 우리아이변액연금(1) 삼성생명 — 60세(i=5)~90세(i=35) */
export const ourChild1 = [
       0,     0,     0,     0,     0,  5340,  5341,  5341,  5341,  5341,
    5341,  5341,  5341,  5341,  5342,  5342,  5342,  5342,  5342,  5342,
    5342,  5342,  5343,  5343,  5343,  5343,  5343,  5343,  5343,  5343,
    5343,  5343,  5343,  5343,  5344,  5344,
]

/** 스마트Top변액연금 삼성생명 — 65세(i=10)~90세(i=35) */
export const smartTop = [
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
   14099, 14099, 14100, 14100, 14100, 14100, 14101, 14101, 14101, 14101,
   14102, 14102, 14102, 14102, 14103, 14103, 14103, 14103, 14104, 14104,
   14104, 14104, 14105, 14105, 14105, 14105,
]

/** 우리아이변액연금(2) 삼성생명 — 60세(i=5)~90세(i=35) */
export const ourChild2 = [
       0,     0,     0,     0,     0,  5096,  5096,  5096,  5097,  5097,
    5097,  5097,  5097,  5097,  5097,  5097,  5097,  5097,  5097,  5097,
    5098,  5098,  5098,  5098,  5098,  5098,  5098,  5098,  5099,  5099,
    5099,  5099,  5099,  5099,  5099,  5099,
]

// ─── 편의 객체 ────────────────────────────────────────────────
export const PENSION_ANNUAL = {
  national,
  db,
  savings,
  guaranteed,
  nohup,
  indexUp,
  ourChild1,
  smartTop,
  ourChild2,
}

export const DB_RETIREMENT_KEYS = ['db', 'guaranteed']
export const OWN_NONTAX_KEYS = ['nohup', 'indexUp', 'smartTop']
export const CHILD_TRANSFER_KEYS = ['ourChild1', 'ourChild2']

/** 나이별 원천 9개 상품 합산 (천원/년, 임대소득 제외, 엑셀 검증용) */
export const PENSION_TOTAL = AGES.map((_, i) =>
  Object.values(PENSION_ANNUAL).reduce((sum, arr) => sum + arr[i], 0)
)

/** 나이별 자녀 양도 예정 연금 합산 (천원/년, 우리아이 1·2) */
export const CHILD_TRANSFER_TOTAL = AGES.map((_, i) =>
  CHILD_TRANSFER_KEYS.reduce((sum, key) => sum + PENSION_ANNUAL[key][i], 0)
)

/** 나이별 본인 연금 합산 (천원/년, 우리아이 1·2 제외) */
export const MY_PENSION_TOTAL = AGES.map((_, i) =>
  PENSION_TOTAL[i] - CHILD_TRANSFER_TOTAL[i]
)

/**
 * 연금 상품 메타데이터 — 사이드바/뷰 컴포넌트에서 사용
 * lifetimeTotal: 엑셀 소계 기준 (단위: 천원)
 * balanceKey: userData.balances의 키 (없으면 null)
 */
export const PENSION_PRODUCTS = [
  // ── 세제적격 계좌 ──────────────────────────────────────────
  {
    key: 'db', name: 'DB퇴직연금', institution: '삼성증권',
    section: 'qualified',
    startAge: 61, endAge: 80,
    lifetimeTotal: 185140,
    balanceKey: 'db',
  },
  {
    key: 'guaranteed', name: '이율보증형', institution: '삼성생명',
    section: 'qualified',
    startAge: 55, endAge: 74,
    lifetimeTotal: 496680,
    balanceKey: null,
  },
  {
    key: 'irp', name: 'IRP', institution: '—',
    section: 'qualified',
    startAge: null, endAge: null,
    lifetimeTotal: null,
    balanceKey: 'irp',
  },
  {
    key: 'savings', name: '연금저축골드', institution: '삼성생명',
    section: 'qualified',
    startAge: 56, endAge: 90,
    lifetimeTotal: 83207,
    balanceKey: 'savings',
  },
  // ── 비과세 계좌 ────────────────────────────────────────────
  {
    key: 'nohup', name: '노후적립', institution: '삼성생명',
    section: 'nontax',
    startAge: 55, endAge: 74,
    lifetimeTotal: 276115,
    balanceKey: null,
  },
  {
    key: 'indexUp', name: '인덱스Up', institution: '삼성생명',
    section: 'nontax',
    startAge: 65, endAge: 90,
    lifetimeTotal: 305832,
    balanceKey: null,
  },
  {
    key: 'smartTop', name: '스마트Top', institution: '삼성생명',
    section: 'nontax',
    startAge: 65, endAge: 90,
    lifetimeTotal: 366658,
    balanceKey: null,
  },
  // ── 자녀 양도 예정 ─────────────────────────────────────────
  {
    key: 'ourChild1', name: '우리아이(1)', institution: '삼성생명',
    section: 'child',
    startAge: 60, endAge: 90,
    lifetimeTotal: 165608,
    balanceKey: null,
  },
  {
    key: 'ourChild2', name: '우리아이(2)', institution: '삼성생명',
    section: 'child',
    startAge: 60, endAge: 90,
    lifetimeTotal: 158028,
    balanceKey: null,
  },
  // ── 공적연금 ───────────────────────────────────────────────
  {
    key: 'national', name: '국민연금', institution: '국민연금공단',
    section: 'public',
    startAge: 65, endAge: 90,
    lifetimeTotal: 850759,
    balanceKey: null,
  },
]

/**
 * 차트용 나이별 데이터 배열
 * 단위: 만원/월 (내부 계산 천원/년 → ÷10 ÷12)
 * 임대소득은 Context에서 주입
 * @returns {{ age, national, db, savings, guaranteed, nohup, indexUp,
 *             ourChild1, smartTop, ourChild2, total }[]}
 */
export function getCashFlowByAge() {
  return AGES.map((age, i) => ({
    age,
    national:   Math.round(national[i]   / 10 / 12),
    db:         Math.round(db[i]         / 10 / 12),
    savings:    Math.round(savings[i]    / 10 / 12),
    guaranteed: Math.round(guaranteed[i] / 10 / 12),
    nohup:      Math.round(nohup[i]      / 10 / 12),
    indexUp:    Math.round(indexUp[i]    / 10 / 12),
    ourChild1:  Math.round(ourChild1[i]  / 10 / 12),
    smartTop:   Math.round(smartTop[i]   / 10 / 12),
    ourChild2:  Math.round(ourChild2[i]  / 10 / 12),
    dbTotal:    Math.round((db[i] + guaranteed[i]) / 10 / 12),
    ownNontax:  Math.round((nohup[i] + indexUp[i] + smartTop[i]) / 10 / 12),
    childTransfer: Math.round(CHILD_TRANSFER_TOTAL[i] / 10 / 12),
    total:      Math.round(MY_PENSION_TOTAL[i] / 10 / 12),
    excelTotal: Math.round(PENSION_TOTAL[i] / 10 / 12),
  }))
}
