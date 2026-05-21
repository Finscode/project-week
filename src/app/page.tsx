'use client'

import { TopBar } from '@/components/layout/TopBar'
import { TaskSidebar } from '@/components/sidebar/TaskSidebar'
import { WeekGrid } from '@/components/week-view/WeekGrid'
import { DayGrid } from '@/components/day-view/DayGrid'
import { AppDndProvider } from '@/components/dnd/DndProvider'
import { useAppState } from '@/lib/store'

function AppContent() {
  const { view, openBlockModal } = useAppState()

  return (
    <div className="flex flex-col h-full">
      <TopBar onNewBlock={() => openBlockModal()} />
      <div className="flex flex-1 overflow-hidden">
        <AppDndProvider>
          <TaskSidebar />
          {view === 'week' ? <WeekGrid /> : <DayGrid />}
        </AppDndProvider>
      </div>
    </div>
  )
}

export default function Home() {
  return <AppContent />
}
