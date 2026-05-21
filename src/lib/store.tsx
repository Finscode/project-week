'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface AppState {
  // 현재 주 시작일 (월요일)
  currentWeekStart: Date
  setCurrentWeekStart: (date: Date) => void

  // 뷰 모드
  view: 'week' | 'day'
  setView: (view: 'week' | 'day') => void

  // 선택된 날짜 (일간 뷰)
  selectedDate: Date
  setSelectedDate: (date: Date) => void

  // 블록 모달
  blockModal: {
    open: boolean
    blockId?: string
    prefillDate?: string
    prefillProjectId?: string
    prefillStartTime?: string
  }
  openBlockModal: (opts?: { blockId?: string; date?: string; projectId?: string; startTime?: string }) => void
  closeBlockModal: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const getMonday = (d: Date) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))
  const [view, setView] = useState<'week' | 'day'>('week')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [blockModal, setBlockModal] = useState<AppState['blockModal']>({ open: false })

  const openBlockModal = useCallback((opts?: { blockId?: string; date?: string; projectId?: string; startTime?: string }) => {
    setBlockModal({
      open: true,
      blockId: opts?.blockId,
      prefillDate: opts?.date,
      prefillProjectId: opts?.projectId,
      prefillStartTime: opts?.startTime,
    })
  }, [])

  const closeBlockModal = useCallback(() => {
    setBlockModal({ open: false })
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentWeekStart,
        setCurrentWeekStart,
        view,
        setView,
        selectedDate,
        setSelectedDate,
        blockModal,
        openBlockModal,
        closeBlockModal,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
