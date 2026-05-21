'use client'

import { useState } from 'react'
import { useAppState } from '@/lib/store'
import { addDays, addWeeks, subWeeks, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CoreTimeModal } from '@/components/settings/CoreTimeModal'

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export function TopBar({ onNewBlock }: { onNewBlock?: () => void }) {
  const { currentWeekStart, setCurrentWeekStart, view, setView } = useAppState()
  const [coreTimeOpen, setCoreTimeOpen] = useState(false)

  const weekEnd = addDays(currentWeekStart, 6)
  const weekLabel = `${format(currentWeekStart, 'M월 d일', { locale: ko })} – ${format(weekEnd, 'M월 d일', { locale: ko })}`

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        {/* 로고 */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <rect x="1" y="1" width="5" height="5" rx="1" />
              <rect x="8" y="1" width="5" height="5" rx="1" />
              <rect x="1" y="8" width="5" height="5" rx="1" />
              <rect x="8" y="8" width="5" height="5" rx="1" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">ProjectWeek</span>
        </div>

        {/* 오늘 버튼 */}
        <button
          onClick={() => setCurrentWeekStart(getMonday(new Date()))}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
        >
          오늘
        </button>

        {/* 주 네비게이션 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="이전 주"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 11L5 7l4-4" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center select-none">{weekLabel}</span>
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="다음 주"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </button>
        </div>

        {/* 뷰 토글 */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('week')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all',
              view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            프로젝트
          </button>
          <button
            onClick={() => setView('day')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all',
              view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            주간
          </button>
        </div>

        <div className="flex-1" />

        {/* 코어타임 설정 */}
        <button
          onClick={() => setCoreTimeOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          title="코어타임 설정"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="7" cy="7" r="2.5" />
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M10 10l1.1 1.1M10 4l1.1-1.1M2.9 11.1l1.1-1.1" />
          </svg>
          코어타임
        </button>

        {/* 새 블록 버튼 */}
        <button
          onClick={onNewBlock}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 1v10M1 6h10" />
          </svg>
          새 블록
        </button>
      </header>

      <CoreTimeModal open={coreTimeOpen} onClose={() => setCoreTimeOpen(false)} />
    </>
  )
}
