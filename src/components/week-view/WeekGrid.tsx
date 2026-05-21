'use client'

import { useMemo, useState } from 'react'
import { format, addDays, isToday, isSaturday, isSunday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useDroppable } from '@dnd-kit/core'
import { useProjects } from '@/hooks/useProjects'
import { useWeekBlocks } from '@/hooks/useBlocks'
import { useAppState } from '@/lib/store'
import { BlockCard } from '@/components/blocks/BlockCard'
import { BlockModal } from '@/components/blocks/BlockModal'
import { Block, Project, PROJECT_COLORS, ColorKey } from '@/types'
import { cn } from '@/lib/utils'

function DroppableCell({
  cellId,
  children,
  date,
  onAddClick,
}: {
  cellId: string
  children: React.ReactNode
  date: Date
  onAddClick: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: cellId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[64px] p-1.5 border-r border-b border-gray-100 relative group cursor-pointer',
        isOver && 'bg-blue-50 ring-1 ring-inset ring-blue-200',
        isToday(date) && 'bg-amber-50/40',
        (isSaturday(date) || isSunday(date)) && !isToday(date) && 'bg-gray-50/70',
      )}
      onClick={onAddClick}
    >
      <div className="space-y-0.5">{children}</div>
      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-gray-200/0 text-gray-400 items-center justify-center text-xs hidden group-hover:flex hover:bg-gray-200 transition-colors">
        +
      </div>
    </div>
  )
}

function ProjectRow({
  project,
  weekDays,
  blocksByDate,
  onCellClick,
  onBlockClick,
}: {
  project: Project
  weekDays: Date[]
  blocksByDate: Map<string, Block[]>
  onCellClick: (date: string, projectId: string) => void
  onBlockClick: (block: Block) => void
}) {
  const color = PROJECT_COLORS[project.color as ColorKey]

  return (
    <>
      {/* 프로젝트 이름 셀 - sticky left */}
      <div
        className="sticky left-0 z-10 flex items-center gap-2 px-3 py-2 border-r border-b border-gray-100 bg-white min-h-[64px]"
        style={{ borderLeftColor: color.done.bg, borderLeftWidth: '3px' }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color.done.bg }} />
        <span className="text-sm font-medium text-gray-800 truncate leading-snug">{project.name}</span>
      </div>

      {/* 날짜별 셀 */}
      {weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const cellBlocks = (blocksByDate.get(dateStr) ?? []).filter(b => b.project_id === project.id)

        return (
          <DroppableCell
            key={dateStr}
            cellId={`cell-${project.id}-${dateStr}`}
            date={day}
            onAddClick={() => onCellClick(dateStr, project.id)}
          >
            {cellBlocks.map(block => (
              <BlockCard
                key={block.id}
                block={block}
                project={project}
                compact
                onClick={(e) => { e?.stopPropagation(); onBlockClick(block) }}
              />
            ))}
          </DroppableCell>
        )
      })}
    </>
  )
}

export function WeekGrid() {
  const { currentWeekStart, blockModal, openBlockModal, closeBlockModal } = useAppState()
  const { data: projects = [] } = useProjects()
  const { data: blocks = [] } = useWeekBlocks(currentWeekStart)
  const [editBlock, setEditBlock] = useState<Block | null>(null)

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart],
  )

  const blocksByDate = useMemo(() => {
    const map = new Map<string, Block[]>()
    blocks.forEach(b => {
      if (!map.has(b.start_date)) map.set(b.start_date, [])
      map.get(b.start_date)!.push(b)
    })
    return map
  }, [blocks])

  const gridTemplateColumns = `200px repeat(7, minmax(130px, 1fr))`

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div style={{ display: 'grid', gridTemplateColumns }} className="min-w-max">
          {/* 헤더 행 */}
          <div className="sticky top-0 left-0 z-30 bg-white border-r border-b border-gray-200 px-3 py-3 flex items-end">
            <span className="text-xs text-gray-400 font-medium">프로젝트</span>
          </div>
          {weekDays.map(day => {
            const today = isToday(day)
            const weekend = isSaturday(day) || isSunday(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'sticky top-0 z-20 px-2 py-2.5 border-r border-b border-gray-200 text-center select-none',
                  today ? 'bg-gray-900' : weekend ? 'bg-gray-50' : 'bg-white',
                )}
              >
                <div className={cn('text-[11px] font-medium mb-0.5', today ? 'text-gray-400' : weekend ? 'text-gray-400' : 'text-gray-400')}>
                  {format(day, 'EEE', { locale: ko })}
                </div>
                <div className={cn('text-xl font-bold leading-none', today ? 'text-white' : weekend ? 'text-gray-400' : 'text-gray-800')}>
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}

          {/* 프로젝트 행들 */}
          {projects.map(project => (
            <ProjectRow
              key={project.id}
              project={project}
              weekDays={weekDays}
              blocksByDate={blocksByDate}
              onCellClick={(date, projectId) => openBlockModal({ date, projectId })}
              onBlockClick={block => setEditBlock(block)}
            />
          ))}

          {/* 빈 상태 */}
          {projects.length === 0 && (
            <div className="col-span-8 py-24 text-center text-gray-400 text-sm">
              좌측 사이드바에서 프로젝트를 추가해보세요
            </div>
          )}
        </div>
      </div>

      {/* 새 블록 모달 */}
      <BlockModal
        open={blockModal.open}
        onClose={closeBlockModal}
        prefillDate={blockModal.prefillDate}
        prefillProjectId={blockModal.prefillProjectId}
      />

      {/* 수정 모달 */}
      {editBlock && (
        <BlockModal
          open
          onClose={() => setEditBlock(null)}
          editBlock={editBlock}
        />
      )}
    </>
  )
}
