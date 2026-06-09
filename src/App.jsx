import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PensionProvider } from '@/context/PensionContext'
import CashFlowDashboard from '@/screens/CashFlowDashboard'
import PensionInput      from '@/screens/PensionInput'
import TaxScenario       from '@/screens/TaxScenario'
import HealthInsurance   from '@/screens/HealthInsurance'
import IncomeInput       from '@/screens/IncomeInput'
import ChatPanel         from '@/components/ChatPanel'
import PensionSidebar    from '@/components/PensionSidebar'
import KnowledgeHub      from '@/screens/KnowledgeHub'

export default function App() {
  return (
    <PensionProvider>
      {/* h-screen overflow-hidden → No Scroll 유지 */}
      <div className="h-screen overflow-hidden flex flex-row bg-background">

        {/* 좌측 사이드바 — 연금 포트폴리오 요약 */}
        <PensionSidebar />

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* 헤더 — 56px */}
          <header className="h-14 shrink-0 border-b flex items-center justify-between px-8">
            <span className="font-semibold text-base">🏦 은퇴 연금 분석</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>1973년생 · 2030년 은퇴 예정</span>
              <span className="border rounded px-2 py-0.5">2026.06 기준</span>
            </div>
          </header>

          {/* 탭 — 44px + 콘텐츠 */}
          <Tabs defaultValue="cashflow" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="h-11 shrink-0 w-full justify-start rounded-none border-b bg-background px-8 gap-1">
              <TabsTrigger value="pension"  className="text-sm">연금 현황</TabsTrigger>
              <TabsTrigger value="income"   className="text-sm">은퇴 소득</TabsTrigger>
              <TabsTrigger value="cashflow" className="text-sm">현금흐름</TabsTrigger>
              <TabsTrigger value="health"   className="text-sm">건강보험</TabsTrigger>
              <TabsTrigger value="tax"      className="text-sm">절세 시나리오</TabsTrigger>
              <TabsTrigger value="knowledge" className="text-sm">학습·지식</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="pension"  className="h-full m-0"><PensionInput /></TabsContent>
              <TabsContent value="income"   className="h-full m-0"><IncomeInput /></TabsContent>
              <TabsContent value="cashflow" className="h-full m-0"><CashFlowDashboard /></TabsContent>
              <TabsContent value="health"   className="h-full m-0"><HealthInsurance /></TabsContent>
              <TabsContent value="tax"      className="h-full m-0"><TaxScenario /></TabsContent>
              <TabsContent value="knowledge" className="h-full m-0"><KnowledgeHub /></TabsContent>
            </div>
          </Tabs>

          <ChatPanel />
        </div>

      </div>
    </PensionProvider>
  )
}
