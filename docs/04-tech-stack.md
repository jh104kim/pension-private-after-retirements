# 기술 스택 및 개발 환경

> 연금 분석 웹앱 MVP — 개발 착수 기준 문서  
> 기준일: 2026-06-08 | 환경: Windows 11 + Node.js v24

---

## 1. 기술 스택 전체 구성

```
┌────────────────────────────────────────────────────────┐
│                     사용자 브라우저                       │
└────────────────────┬───────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│                   React 18 (SPA)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │  shadcn/ui   │ │   Recharts   │ │  Tailwind CSS   │ │
│  │  (UI 컴포넌트) │ │  (차트 렌더링) │ │  (스타일링)      │ │
│  └──────────────┘ └──────────────┘ └─────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐                     │
│  │  React       │ │   numeral.js │                     │
│  │  Context API │ │  (숫자 포맷)  │                     │
│  └──────────────┘ └──────────────┘                     │
└────────────────────┬───────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────┐
│                  Vite (빌드·개발서버)                    │
│          번들링 / HMR / 정적 파일 서빙                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. 기술 선택 근거

| 기술 | 버전 | 선택 이유 |
|------|------|------|
| **React** | 18.x | 5개 탭 화면 컴포넌트 관리, 상태 공유 용이 |
| **Vite** | 6.x | 빠른 HMR, Windows 완벽 지원, 설정 최소화 |
| **Tailwind CSS** | 3.x | 별도 CSS 파일 없이 빠른 레이아웃·스타일 구성 |
| **shadcn/ui** | latest | Tailwind 기반 프로덕션급 컴포넌트, 복사 방식(번들 경량) |
| **Recharts** | 2.x | React 전용, 누적 막대·라인·파이 차트 모두 지원 |
| **numeral.js** | 2.x | 원화 단위(억/만원) 포맷 처리 |
| **React Context** | 내장 | Redux 불필요, MVP 규모 전역 상태 관리 충분 |

---

## 3. 주요 의존성 목록

### dependencies (런타임)

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "recharts": "^2.12.7",
  "numeral": "^2.0.6",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.2",
  "class-variance-authority": "^0.7.0",
  "lucide-react": "^0.447.0",
  "@radix-ui/react-tabs": "^1.1.1",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-tooltip": "^1.1.2",
  "@radix-ui/react-select": "^2.1.1",
  "@radix-ui/react-slider": "^1.2.1",
  "@radix-ui/react-switch": "^1.1.1",
  "@radix-ui/react-badge": "latest",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-toggle-group": "^1.1.0"
}
```

### devDependencies (개발)

```json
{
  "vite": "^6.0.0",
  "@vitejs/plugin-react": "^4.3.2",
  "tailwindcss": "^3.4.14",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47"
}
```

---

## 4. 프로젝트 폴더 구조

```
pension/
│
├── docs/                          ← 기획 문서
│   ├── 01-domain-def.md
│   ├── 02-시나리오.md
│   ├── 03-wireframe.md
│   └── 04-tech-stack.md           ← 현재 파일
│
├── src/
│   ├── main.jsx                   ← 앱 진입점
│   ├── App.jsx                    ← 탭 라우터 + 전역 레이아웃
│   ├── index.css                  ← Tailwind 기본 + shadcn/ui CSS 변수
│   │
│   ├── data/
│   │   ├── pensionData.js         ← 엑셀 연금 수령액 배열 (55~90세)
│   │   └── userData.js            ← 사용자 기본값 (잔액·자산·소득)
│   │
│   ├── utils/
│   │   ├── taxCalc.js             ← 연금소득세·종합소득세 계산
│   │   ├── healthInsCalc.js       ← 건보료·피부양자 판정 계산
│   │   ├── scenarioCalc.js        ← 절세 시나리오 비교 계산
│   │   └── formatters.js          ← 만원/억 단위 포맷 (numeral)
│   │
│   ├── context/
│   │   └── PensionContext.jsx     ← 전역 상태 (소득 입력값 공유)
│   │
│   ├── components/
│   │   └── ui/                   ← shadcn/ui 복사 컴포넌트
│   │       ├── badge.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── input.jsx
│   │       ├── label.jsx
│   │       ├── select.jsx
│   │       ├── separator.jsx
│   │       ├── slider.jsx
│   │       ├── switch.jsx
│   │       ├── table.jsx
│   │       ├── tabs.jsx
│   │       ├── toggle-group.jsx
│   │       └── tooltip.jsx
│   │
│   └── screens/
│       ├── PensionInput.jsx       ← 화면 1: 연금 현황
│       ├── IncomeInput.jsx        ← 화면 2: 은퇴 소득
│       ├── CashFlowDashboard.jsx  ← 화면 3: 월 현금흐름 ⭐
│       ├── HealthInsurance.jsx    ← 화면 4: 건강보험
│       └── TaxScenario.jsx        ← 화면 5: 절세 시나리오
│
├── public/
│   └── favicon.ico
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── jsconfig.json                  ← 경로 alias 설정
└── 연금수령.xlsx
```

---

## 5. 핵심 설정 파일

### vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 차트 색상 (도메인 정의서 기준)
        chart: {
          national:  '#3B82F6',  // 국민연금
          db:        '#10B981',  // DB 퇴직연금
          irp:       '#8B5CF6',  // IRP
          savings:   '#F59E0B',  // 연금저축
          nontax:    '#94A3B8',  // 세제비적격
          rental:    '#06B6D4',  // 임대소득
          deduct:    '#F87171',  // 세금/건보료
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow: hidden;          /* ← No Scroll 핵심 */
  height: 100vh;
}

#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

### jsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 6. 데이터 레이어 구조

### src/data/pensionData.js (핵심 원천 데이터)

```js
// 단위: 천원/년 | 출처: 통합연금포탈 연금수령.xlsx
// 인덱스 0 = 55세, 인덱스 35 = 90세

export const AGES = Array.from({ length: 36 }, (_, i) => 55 + i)

export const PENSION_ANNUAL = {
  national:    [0,0,0,0,0,0,0,0,0,0,12834,22682,23385,24110,24858,25628,26423,27242,28087,28957,29855,30780,31735,32718,33733,34778,35856,36968,38114,39296,40514,41770,43065,44400,45776,47195],
  db:          [0,0,0,0,0,0,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,9257,0,0,0,0,0,0,0,0,0,0],
  guaranteed:  [24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,24834,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  nohup:       [13801,13803,13803,13803,13803,13804,13804,13804,13804,13806,13806,13806,13806,13808,13808,13808,13808,13810,13810,13810,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  indexUp:     [0,0,0,0,0,0,0,0,0,0,11760,11760,11761,11761,11761,11761,11762,11762,11762,11762,11763,11763,11763,11763,11763,11763,11763,11763,11764,11764,11764,11764,11765,11765,11765,11765],
  ourChild1:   [0,0,0,0,0,5340,5341,5341,5341,5341,5341,5341,5341,5341,5342,5342,5342,5342,5342,5342,5342,5342,5343,5343,5343,5343,5343,5343,5343,5343,5343,5343,5343,5343,5344,5344],
  smartTop:    [0,0,0,0,0,0,0,0,0,0,14099,14099,14100,14100,14100,14100,14101,14101,14101,14101,14102,14102,14102,14102,14103,14103,14103,14103,14104,14104,14104,14104,14105,14105,14105,14105],
  ourChild2:   [0,0,0,0,0,5096,5096,5096,5097,5097,5097,5097,5097,5097,5097,5097,5097,5097,5097,5097,5098,5098,5098,5098,5098,5098,5098,5098,5099,5099,5099,5099,5099,5099,5099,5099],
  savings:     [0,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2377,2378,2378,2378,2378,2378,2378,2378,2378,2378,2378,2378,2378],
}

// 연간 합계 (월 수령액 = total / 12)
export const PENSION_TOTAL = AGES.map((_, i) =>
  Object.values(PENSION_ANNUAL).reduce((sum, arr) => sum + arr[i], 0)
)

// 앱 파생 합계
// - PENSION_TOTAL: 원천 엑셀 9개 상품 전체 합계
// - MY_PENSION_TOTAL: 우리아이 1·2 제외 본인 연금 합계
// - CHILD_TRANSFER_TOTAL: 우리아이 1·2 자녀 양도 예정 별도 표기
```

### src/data/userData.js (사용자 기본값)

```js
export const USER_DEFAULTS = {
  // 기본 정보
  birthYear:      1973,
  birthMonth:     5,
  retirementYear: 2030,
  currentYear:    2026,

  // 연금 계좌 잔액 (천원)
  balances: {
    db:      390000,   // DB 퇴직연금 3.9억
    irp:      60000,   // IRP 6천만
    savings:  60000,   // 연금저축 6천만
  },

  // 자산 (천원)
  assets: {
    financial:  100000,   // 금융자산 1억
    realEstate: 2600000,  // 부동산 26억
  },

  // 은퇴 후 소득 (천원/월)
  income: {
    rental:    3000,   // 임대소득 300만원
    labor:        0,   // 근로소득 미정
    financial:    0,   // 금융소득 미정
    other:        0,
  },

  // 부양가족
  dependents: {
    spouse:   true,
    children: 2,
    parents:  2,
  },
}
```

---

## 7. 주요 계산 유틸리티 시그니처

### taxCalc.js

```js
/**
 * 사적연금 소득세 (세제적격: 연금저축·IRP)
 * @param {number} annualAmount  연간 수령액 (천원)
 * @param {number} age           수령 나이
 * @returns {number}             연간 세금 (천원)
 */
export function privatePensionTax(annualAmount, age) { ... }

/**
 * 국민연금 연금소득공제 계산
 * @param {number} annualPension  연간 국민연금 수령액 (천원)
 * @returns {number}              공제액 (천원)
 */
export function pensionIncomeDeduction(annualPension) { ... }

/**
 * 종합소득세 계산 (2024년 기준)
 * @param {number} taxableIncome  과세표준 (천원)
 * @returns {number}              산출세액 (천원, 지방세 포함)
 */
export function comprehensiveIncomeTax(taxableIncome) { ... }

/**
 * 연령별 세후 월 수령액
 * @param {number} age
 * @param {object} incomeInput  임대·금융·기타 소득
 * @returns {object}            { gross, tax, insurance, net }
 */
export function netMonthlyIncome(age, incomeInput) { ... }
```

### healthInsCalc.js

```js
/**
 * 지역가입자 건강보험료 추정
 * @param {number} annualIncome    연간 과세소득 (천원)
 * @param {number} realEstateValue 부동산 시가 (천원)
 * @returns {object}               { income, asset, total, ltc } (월, 천원)
 */
export function localSubscriberPremium(annualIncome, realEstateValue) { ... }

/**
 * 피부양자 자격 판정
 * @param {number} annualIncome    연간 소득 합계 (천원)
 * @param {number} realEstateValue 부동산 시가 (천원)
 * @returns {object}               { eligible, reasons[] }
 */
export function dependentEligibility(annualIncome, realEstateValue) { ... }
```

---

## 8. 전역 상태 구조 (Context)

```js
// PensionContext.jsx
const PensionContext = createContext({
  // 사용자 입력 (화면 1·2에서 수정)
  income: { rental: 3000, labor: 0, financial: 0, other: 0 },
  balances: { db: 390000, irp: 60000, savings: 60000 },
  assets: { realEstate: 2600000, financial: 100000 },

  // 파생 계산 결과 (Context에서 자동 계산)
  cashFlowByAge: [],      // 화면 3용: [{ age, gross, net, ... }]
  healthByAge:   [],      // 화면 4용: [{ age, premium, ... }]
  scenarios:     {},      // 화면 5용: { current, spread, delayed, optimal }

  // Setter
  setIncome:   () => {},
  setBalances: () => {},
  setAssets:   () => {},
})
```

---

## 9. 개발 환경 초기화 명령어

```bash
# 1. Vite + React 프로젝트 초기화
npm create vite@latest . -- --template react

# 2. 기본 의존성 설치
npm install

# 3. Tailwind CSS 설치
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p

# 4. shadcn/ui 초기화
npx shadcn@latest init

# 5. shadcn/ui 컴포넌트 추가
npx shadcn@latest add card tabs badge button input label
npx shadcn@latest add select slider switch separator table tooltip toggle-group

# 6. Recharts + 유틸리티
npm install recharts numeral clsx tailwind-merge lucide-react

# 7. 개발 서버 실행 (Vite only)
npm run dev
# → http://localhost:5173

# 8. 챗봇 포함 로컬 실행 (Cloudflare Pages Functions)
npm run build
npm run dev:pages
# → http://localhost:8788
```

---

## 10. 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build
# → dist/ 폴더 생성

# Cloudflare Pages Functions 포함 로컬 실행
npm run dev:pages
# → http://localhost:8788

# 빌드 미리보기
npm run preview
# → http://localhost:4173
```

### Cloudflare Pages 배포 기준

| 항목 | 값 |
|------|------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Functions directory | `functions` |
| 로컬 Pages dev | `npm run dev:pages` → `http://localhost:8788` |

### AI 챗봇 환경변수

| 변수 | 용도 | 노출 |
|------|------|------|
| `CLOUDFLARE_ACCOUNT_ID` | Workers AI Account ID | 서버 환경변수 |
| `CLOUDFLARE_API_TOKEN` | Workers AI 호출 토큰 | 서버 환경변수 |
| `CLOUDFLARE_AI_MODEL` | 기본 모델 (`@cf/meta/llama-3.1-8b-instruct`) | 서버 환경변수 |

> `VITE_` 접두사로 토큰을 프론트엔드에 노출하지 않는다. 프론트는 `/api/chat`만 호출하고, `functions/api/chat.js`가 Cloudflare Workers AI REST API를 프록시한다.

### 정적 배포 옵션

| 방법 | 명령 | 비고 |
|------|------|------|
| Cloudflare Pages | `npm run build` + Pages 배포 | Functions와 AI 챗봇 사용 가능 |
| 로컬 파일 | `dist/index.html` 직접 열기 | 별도 서버 불필요 |
| GitHub Pages | `gh-pages` 패키지 사용 | 무료 |
| Vercel | `vercel deploy` | 자동 CI/CD |
| Netlify | 드래그앤드롭 | dist 폴더 업로드 |

---

## 11. 개발 착수 체크리스트

- [ ] `npm create vite@latest . -- --template react`
- [ ] Tailwind + shadcn/ui 초기화 완료
- [ ] `src/data/pensionData.js` 엑셀 데이터 입력
- [ ] `src/data/userData.js` 사용자 기본값 입력
- [ ] `src/context/PensionContext.jsx` 전역 상태 구성
- [ ] `src/utils/taxCalc.js` 세금 계산 함수 구현
- [ ] `src/utils/healthInsCalc.js` 건보료 계산 함수 구현
- [ ] **화면 3 (CashFlowDashboard)** 1순위 개발
- [ ] **화면 1 (PensionInput)** 2순위 개발
- [ ] 나머지 화면 순차 개발

---

*기준: 2026-06-08 | Node.js v24.16.0 | npm 11.13.0*
