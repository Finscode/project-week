'use client'

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState } from 'react'
import { useCreateBlock, useUpdateBlock } from '@/hooks/useBlocks'
import { useTasks } from '@/hooks/useTasks'

interface DragData {
  type: 'task' | 'block'
  taskId?: string
  blockId?: string
  projectId?: string
  title?: string
  startTime?: string | null
  endTime?: string | null
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTimeStr(minutes: number) {
  const clamped = Math.min(Math.max(minutes, 0), 23 * 60)
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

const START_HOUR = 6
const HOUR_HEIGHT = 64

function pxToTimeStr(offsetY: number): string {
  const totalMinutes = START_HOUR * 60 + Math.max(0, Math.floor((offsetY / HOUR_HEIGHT) * 60))
  const snapped = Math.round(totalMinutes / 15) * 15
  const clamped = Math.min(snapped, 22 * 60) // 최대 22:00
  const h = String(Math.floor(clamped / 60)).padStart(2, '0')
  const m = String(clamped % 60).padStart(2, '0')
  return `${h}:${m}`
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const end = Math.min(h * 60 + m + 60, 23 * 60)
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
}

export function AppDndProvider({ children }: { children: React.ReactNode }) {
  const [activeData, setActiveData] = useState<DragData | null>(null)
  const { mutate: createBlock } = useCreateBlock()
  const { mutate: updateBlock } = useUpdateBlock()
  const { data: tasks = [] } = useTasks()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (e: DragStartEvent) => {
    setActiveData(e.active.data.current as DragData)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveData(null)
    const { active, over } = e
    if (!over) return

    const overId = String(over.id)
    const data = active.data.current as DragData

    // ── 블록 이동 (주간 뷰 내 드래그) ──
    if (data.type === 'block' && data.blockId && overId.startsWith('daycol-')) {
      const dropDate = overId.replace('daycol-', '')
      const activeTop = e.active.rect.current.translated?.top ?? 0
      const overTop = over.rect.top
      const offsetY = activeTop - overTop

      const newStartMin = START_HOUR * 60 + Math.round(Math.max(0, Math.floor((offsetY / HOUR_HEIGHT) * 60)) / 15) * 15
      const newStartTime = minutesToTimeStr(newStartMin)

      let newEndTime: string | null = null
      if (data.startTime && data.endTime) {
        const duration = timeToMinutes(data.endTime) - timeToMinutes(data.startTime)
        newEndTime = minutesToTimeStr(newStartMin + duration)
      } else if (data.startTime) {
        newEndTime = minutesToTimeStr(newStartMin + 60)
      }

      updateBlock({ id: data.blockId, start_date: dropDate, end_date: dropDate, start_time: newStartTime, end_time: newEndTime })
      return
    }

    if (data.type !== 'task' || !data.taskId) return

    const task = tasks.find(t => t.id === data.taskId)
    if (!task) return

    // ── 주간 뷰 셀: "cell-{projectId}-{yyyy-MM-dd}" ──
    if (overId.startsWith('cell-')) {
      const parts = overId.replace('cell-', '').split('-')
      const dropDate = parts.slice(-3).join('-')
      createBlock({
        project_id: task.project_id,
        task_id: task.id,
        start_date: dropDate,
        end_date: dropDate,
        start_time: null,
        end_time: null,
        title: task.title,
        memo: null,
        is_done: false,
        recurrence_id: null,
      })
      return
    }

    // ── 주간 뷰 컬럼: "daycol-{yyyy-MM-dd}" ──
    if (overId.startsWith('daycol-')) {
      const dropDate = overId.replace('daycol-', '')

      // 드래그된 아이템의 현재 위치에서 컬럼 상단까지의 Y 오프셋으로 시간 계산
      const activeTop = e.active.rect.current.translated?.top ?? 0
      const overTop = over.rect.top
      const offsetY = activeTop - overTop

      const startTime = pxToTimeStr(offsetY)
      const endTime = addOneHour(startTime)

      createBlock({
        project_id: task.project_id,
        task_id: task.id,
        start_date: dropDate,
        end_date: dropDate,
        start_time: startTime,
        end_time: endTime,
        title: task.title,
        memo: null,
        is_done: false,
        recurrence_id: null,
      })
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay dropAnimation={null}>
        {activeData ? (
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-xl text-gray-700 opacity-90 pointer-events-none">
            {activeData.title ?? '블록'}
            {activeData.type === 'block' && activeData.startTime && (
              <div className="text-[10px] text-gray-400 mt-0.5">{activeData.startTime.slice(0,5)}</div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
