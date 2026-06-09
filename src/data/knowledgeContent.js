/**
 * 학습·지식 탭 콘텐츠
 * ⚠️ 교육용 일반 정보 — 실제 적용 전 반드시 공식기관(국민연금공단·국세청·건보공단) 확인.
 * 출처(웹 조사 2026-06): 국민연금공단 nps.or.kr, 국세청 nts.go.kr,
 *   KB의 생각, 미래에셋 투자와연금센터, 금융감독원 통합연금포털 등
 *
 * importance: '필수' | '권장' | '참고'
 */

// ── 1. 개인 맞춤 팁 / 체크리스트 ───────────────────────────────
export const KNOWLEDGE_TIPS = [
  {
    id: 'nps-credit',
    icon: '🎖️',
    title: '군복무 크레딧 — 가입기간 추가 인정',
    importance: '참고',
    timing: '노령연금 청구 시(65세, 2038)',
    why: '병역 의무 이행자에게 국민연금 가입기간을 추가로 인정해 노령연금액을 늘려주는 제도. 2008.1.1 이후 입대·6개월 이상 복무 시 6개월 인정(2026.1.1 이후 복무 완료분은 실제 복무기간 최대 12개월로 확대).',
    how: '사전신청 불가 — 노령연금 청구 시 함께 신청. 군인·공무원연금 등 타 공적연금 가입이력이 있으면 제외.',
    caveat: '⚠️ 본인(1973년생) 군복무 시기가 보통 2008.1.1 이전이면 군복무 크레딧 대상이 아닐 가능성이 큼. 본인 입대시기·복무이력으로 대상 여부를 먼저 확인하세요.',
    sources: [
      { label: '국민연금공단 크레딧 제도', url: 'https://www.nps.or.kr/jsppage/mobile/in/HG_4A0001_07.jsp' },
    ],
  },
  {
    id: 'nps-chunap',
    icon: '⏪',
    title: '국민연금 추후납부(추납)로 가입기간 늘리기',
    importance: '권장',
    timing: '지금~60세 이전 검토(현재 53세)',
    why: '과거 실직·사업중단 등으로 못 낸 납부예외 기간을 나중에 납부하면 가입기간이 늘어 노령연금액이 증가. 최대 119개월(10년 미만)까지 신청 가능.',
    how: '과거 1개월 이상 납부 이력 필요. 반환일시금을 받았다면 먼저 반납해야 추납 가능. 임의가입/소득신고 상태에서 신청.',
    caveat: '한 번에 목돈이 필요하므로, 추납 금액 대비 늘어나는 연금액(회수기간)을 따져보고 결정하세요.',
    sources: [
      { label: '국민연금공단 추후납부', url: 'https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0047M0.do' },
    ],
  },
  {
    id: 'nps-continue',
    icon: '➕',
    title: '임의계속가입 (60~65세)',
    importance: '참고',
    timing: '60세 도달 시(2033)',
    why: '60세에 의무가입이 끝나도 65세까지 본인 신청으로 계속 납부하면 가입기간이 연장돼 연금액이 늘어남.',
    how: '60세 이후 국민연금공단에 임의계속가입 신청.',
    caveat: '소득·건강·기대수명 등을 함께 고려해 가입기간 연장의 실익을 판단하세요.',
    sources: [
      { label: '국민연금공단 임의계속가입', url: 'https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0032M0.do' },
    ],
  },
  {
    id: 'nps-defer',
    icon: '⏳',
    title: '국민연금 연기연금 (최대 5년)',
    importance: '권장',
    timing: '65세 수급 개시 시점(2038)',
    why: '수급을 늦추면 1년당 7.2%(월 0.6%), 최대 5년 36%까지 증액. 앱의 "지연 수령" 시나리오와 직접 연결되는 전략.',
    how: '65세 수급 개시 전 연기 신청. 부분연기(일부 비율)도 가능.',
    caveat: '연기 시 건강보험료·기대수명·세금 영향을 종합 비교(앱 절세 시나리오 탭 참고).',
    sources: [
      { label: '국민연금공단', url: 'https://www.nps.or.kr' },
    ],
  },
  {
    id: 'pension-credit',
    icon: '💳',
    title: '연금저축·IRP 세액공제 (합산 연 900만원)',
    importance: '필수',
    timing: '매년 연말 전 · 은퇴(2030) 전까지',
    why: '연금저축 연 600만 + IRP 포함 합산 900만까지 세액공제. 총급여 5,500만 이하 16.5%, 초과 13.2%. 노후자금 적립과 절세를 동시에.',
    how: '연금저축 600만 채운 뒤 IRP에 300만 추가가 일반적인 방법.',
    caveat: '세액공제는 "납입" 시 혜택, "수령" 시 연금소득세. 은퇴 후 근로소득이 0이면 공제 실익이 줄어드니 소득 있는 은퇴 전에 활용하세요.',
    sources: [
      { label: '국세청 연금계좌 세액공제', url: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875' },
    ],
  },
  {
    id: 'isa-transfer',
    icon: '🔄',
    title: 'ISA 만기 → 연금계좌 전환 (추가 300만 공제)',
    importance: '권장',
    timing: 'ISA 만기 후 60일 이내',
    why: 'ISA 만기자금을 연금계좌(IRP·연금저축)로 옮기면 전환금액의 10%(최대 300만)에 추가 세액공제. 기존 900만 + 300만 = 최대 1,200만까지 공제 대상 확대.',
    how: '만기일로부터 60일 이내에 연금계좌로 이전 신청(연 납입한도와 무관하게 이전 가능).',
    caveat: '⏰ 60일 기한을 넘기면 추가 공제 불가. 만기 일정 미리 관리.',
    sources: [
      { label: '미래에셋 ISA 연금전환 안내', url: 'https://magazine.securities.miraeasset.com/contents.php?category=pension&idx=1542' },
    ],
  },
  {
    id: 'health-dependent',
    icon: '🏥',
    title: '건강보험 피부양자 자격 / 지역가입자 대비',
    importance: '필수',
    timing: '은퇴 시점(2030)',
    why: '임대소득 연 3,600만 + 부동산 26억 → 피부양자 탈락 확정, 지역가입자 보험료 발생(앱 건강보험 탭에서 추정).',
    how: '배우자가 직장가입자라면 그 피부양자 등재 가능성 검토, 자산·소득 명의 분산, 임대 경비율 활용 등으로 점수 관리.',
    caveat: '자격·보험료 확정값은 국민건강보험공단 직접 확인 필요.',
    sources: [
      { label: '국민건강보험공단', url: 'https://www.nhis.or.kr' },
    ],
  },
  {
    id: 'private-1500',
    icon: '📉',
    title: '사적연금 1,500만원 분리과세 한도 관리',
    importance: '권장',
    timing: '연금 수령기 매년',
    why: '연금저축+IRP 등 사적연금 연 수령액이 1,500만 이하면 저율 분리과세(3.3~5.5%). 초과 시 종합과세 또는 16.5% 분리과세 중 선택해야 해 세부담이 커질 수 있음.',
    how: '인출 시점을 분산해 연 수령액을 1,500만 이하로 유지(앱 절세 시나리오의 "분산 수령"과 연계).',
    caveat: '2024년부터 1,200만 → 1,500만으로 상향됨. 본인 연금저축·IRP 합산액을 매년 점검.',
    sources: [
      { label: '국세청 홈택스', url: 'https://www.hometax.go.kr' },
    ],
  },
]

// ── 2. 학습 로드맵 (수준별) ───────────────────────────────────
export const KNOWLEDGE_CURRICULUM = [
  {
    level: '입문',
    color: 'emerald',
    desc: '연금의 큰 그림과 기본 용어',
    topics: [
      { id: 'c-3layer', title: '3층 연금 구조 (국민·퇴직·개인연금)', note: '공적연금 + 퇴직연금(DB/DC/IRP) + 개인연금(연금저축)의 역할 구분' },
      { id: 'c-tax-basic', title: '연금 종류별 과세 차이', note: '공적연금(연금소득공제), 세제적격(분리/종합), 비과세(10년+ 요건) 기초' },
      { id: 'c-units', title: '금액 단위 읽기 (천원/만원/억)', note: '앱 데이터는 천원/년 기준 — 만원/월로 환산하는 감각 익히기' },
    ],
  },
  {
    level: '중급',
    color: 'blue',
    desc: '세금·건보료 구조 이해',
    topics: [
      { id: 'c-sep-vs-comp', title: '분리과세 vs 종합과세', note: '사적연금 1,500만, 임대·금융소득 2,000만 등 분기점과 세율 비교' },
      { id: 'c-pension-deduct', title: '연금소득공제 / 누진세율', note: '공적연금 공제 후 6~45% 누진 적용 원리' },
      { id: 'c-health', title: '건강보험료 산정 (소득·재산점수)', note: '지역가입자 점수 체계와 피부양자 탈락 기준' },
    ],
  },
  {
    level: '고급',
    color: 'violet',
    desc: '인출·자산 전략',
    topics: [
      { id: 'c-order', title: '인출 순서 전략', note: '비과세 → 세제적격 → 공적연금 순서로 과세 최소화' },
      { id: 'c-retire-tax', title: '퇴직소득세 vs 연금소득세', note: '일시금 vs 연금 수령 시 세부담 차이(연금 수령 시 30~40% 감면)' },
      { id: 'c-capital', title: '양도·상속·증여세', note: '부동산 매각·자녀 이전 시 과세. 인플레이션 실질가치도 함께 고려' },
    ],
  },
]

// ── 3. 추천 학습 자료 (외부 링크) ─────────────────────────────
export const KNOWLEDGE_RESOURCES = [
  {
    group: '공식기관 (1차 확인처)',
    items: [
      { label: '금융감독원 통합연금포털 — 내 연금 한눈에 조회', url: 'https://100lifeplan.fss.or.kr' },
      { label: '국민연금공단', url: 'https://www.nps.or.kr' },
      { label: '국세청 홈택스 (연금·종합소득세)', url: 'https://www.hometax.go.kr' },
      { label: '국세청 — 연금계좌 세액공제 안내', url: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875' },
      { label: '국민건강보험공단', url: 'https://www.nhis.or.kr' },
    ],
  },
  {
    group: '교육·해설 (개념 학습)',
    items: [
      { label: '미래에셋 투자와연금센터', url: 'https://investpension.miraeasset.com' },
      { label: 'KB의 생각 — 연금/노후', url: 'https://kbthink.com' },
      { label: '국민연금 온에어', url: 'https://www.npsonair.kr' },
    ],
  },
]
