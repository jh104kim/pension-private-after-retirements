# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

---

## 프로젝트 개요

1973년생 사용자(2030년 57세 은퇴 예정)의 은퇴 후 연금 수령 전략을 분석하는 **개인용 웹앱 MVP**.  
국민연금·퇴직연금·변액연금 등 9개 상품의 월 수령액을 시각화하고, 세금·건강보험료 시뮬레이션 및 절세 시나리오를 제공한다.

---

## 개발 명령어

```bash
# 개발 서버 (http://localhost:5173)
npm run dev

# 프로덕션 빌드 → dist/
npm run build

# 빌드 결과 로컬 미리보기 (http://localhost:4173)
npm run preview
```

> **Vite + React** 기반. 테스트 프레임워크는 MVP 범위에 포함되지 않음.

---

## 아키텍처 핵심

### 데이터 흐름

```
연금수령.xlsx (원천)
    ↓ 하드코딩 변환
src/data/pensionData.js     ← 9개 상품 × 36개 나이(55~90세) 배열, 단위: 천원/년
src/data/userData.js        ← 사용자 기본값 (잔액·자산·소득 입력 초기값)
    ↓
src/context/PensionContext  ← 전역 상태. 화면 1·2 입력값 + 파생 계산 결과 보관
    ↓
src/utils/
  taxCalc.js               ← 연금소득세·종합소득세 계산 (국세청 2024 기준)
  healthInsCalc.js         ← 지역가입자 건보료·피부양자 판정 (건보공단 2024 기준)
  scenarioCalc.js          ← 4개 절세 시나리오 비교
    ↓
src/screens/ (5개 탭 화면)
```

### 단위 규칙 — 반드시 준수

| 위치 | 단위 | 변환 |
|------|------|------|
| `pensionData.js` 배열 | **천원/년** | 월 수령액 = 값 ÷ 12 |
| `userData.js` 잔액·자산 | **천원** | 화면 표시 시 만원·억원 변환 |
| `userData.js` 소득 | **천원/월** | |
| 화면 표시 | **만원** | `formatters.js` 경유 |

### 5개 탭 화면 — 구현 우선순위 순

| 순위 | 파일 | 핵심 역할 |
|------|------|------|
| 1 | `CashFlowDashboard.jsx` | 55~90세 누적 막대 차트 (메인 시각화) |
| 2 | `PensionInput.jsx` | 9개 연금 상품 목록 + 도넛 차트 |
| 3 | `TaxScenario.jsx` | 4개 시나리오 그룹 바 + 라인 비교 |
| 4 | `HealthInsurance.jsx` | Slider 연동 건보료 실시간 계산 |
| 5 | `IncomeInput.jsx` | 소득 입력 + 리스크 체크리스트 |

---

## 핵심 설계 제약 — 변경 금지

1. **No Scroll**: `body { overflow: hidden; height: 100vh; }` — 모든 화면은 단일 뷰포트(1440×900)에 완결. 스크롤 추가 금지.
2. **shadcn/ui 전용**: 커스텀 CSS 최소화. UI 컴포넌트는 `src/components/ui/` 아래 shadcn 방식으로만 추가.
3. **Recharts 전용**: 차트 라이브러리 혼용 금지.
4. **세금·건보료는 추정값 표시**: 계산 결과 UI에 반드시 "추정" 또는 리스크 레이블 병기.

---

## 도메인 지식 요약

### 연금 세제 구분

| 구분 | 해당 상품 | 수령 시 과세 |
|------|------|------|
| 공적연금 | 국민연금 | 연금소득공제 후 종합소득세 |
| 세제적격 | DB퇴직연금·IRP·연금저축 | 분리과세 3.3~5.5% (연 1,200만 이하) |
| 세제비적격 | 변액연금 4종·이율보증형·노후적립 | 10년 이상 유지 시 **비과세** |

### 건강보험 핵심 리스크

- 임대소득 3,600만원/년 → 피부양자 탈락 확정 (기준: 2,000만원 초과)
- 부동산 26억 → 재산세 과표 약 10.8억 → 지역가입자 재산보험료 발생
- **2030년 은퇴 시점부터 지역가입자 전환** (실제 계산 기준 월 약 29~30만원, 공단 확인 필요)

### 사적연금 1,200만원 분기점

연금저축(연 237만) + IRP 인출액 합산이 **1,200만원 초과 시 종합과세 전환**.  
시나리오 계산 시 이 한도를 항상 체크해야 함.

---

## 차트 색상 시스템 (변경 금지)

```js
// tailwind.config.js chart 색상과 동기화
국민연금:    '#3B82F6'   // blue-500
DB퇴직연금:  '#10B981'   // emerald-500
IRP:         '#8B5CF6'   // violet-500
연금저축:    '#F59E0B'   // amber-500
세제비적격:  '#94A3B8'   // slate-400
임대소득:    '#06B6D4'   // cyan-500
세금/건보료: '#F87171'   // red-400 (차감)
```

---

## 참조 문서 (docs/)

| 파일 | 용도 | 구현 시 참조 시점 |
|------|------|------|
| `00-prd.md` | MVP 구현 완료 범위·화면별 기능·계산 로직 요약·제외 범위 | 기능 범위 확인 시 항상 |
| `01-domain-def.md` | 연금 상품 목록, 세금 공식, 건보료 기준 원본 | 항상 |
| `02-시나리오.md` | 8개 수령 시나리오 비교, 절세 전략 근거 | TaxScenario 구현 전 |
| `03-wireframe.md` | 화면별 레이아웃·컴포넌트·차트 스펙 (ASCII) | 각 화면 구현 전 |
| `04-tech-stack.md` | 의존성 목록, 초기화 명령어, 유틸 함수 시그니처 | 프로젝트 초기화 시 |
| `05-calc-logic.md` | taxCalc·healthInsCalc·scenarioCalc 상세 계산 공식 | 유틸 함수 구현 전 |
| `06-component-guide.md` | shadcn/ui 컴포넌트 JSX 패턴, 화면별 배치 규칙 | 각 화면 구현 시 |
| `07-data-spec.md` | pensionData.js 배열 원본값 + 변환 규칙 + userData 기본값 | 데이터 레이어 구현 전 |

### 개발 착수 순서

```
1. npm 초기화 (04-tech-stack.md §초기화 명령어)
2. src/data/ 구현 → 07-data-spec.md §2·§6 그대로 복사
3. src/utils/ 구현 → 05-calc-logic.md §1~§4 공식 적용
4. src/context/PensionContext 구현
5. 화면 구현 (우선순위 순) → 06-component-guide.md JSX 패턴 참조
```

계산 로직 구현 전 반드시 `01-domain-def.md` §5(세금)·§6(건보료) + `05-calc-logic.md` 확인.  
화면 구현 전 반드시 `03-wireframe.md` 레이아웃 + `06-component-guide.md` JSX 패턴 확인.
