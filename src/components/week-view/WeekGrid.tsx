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
import { Block, PROJECT_COLORS, ColorKey } from '@/types'
import { cn } from '@/lib/utils'

function DayColumn({
  day,
  blocks,
  onAddClick,
  onBlockClick,
}: {
  day: Date
  blocks: Block[]
  onAddClick: () => void
  onBlockClick: (block: Block) => void
}) {
  const dateStr = format(day, 'yyyy-MM-dd')
  const { isOver, setNodeRef } = useDroppable({ id: `cell-${dateStr}` })
  const today = isToday(day)
  const weekend = isSaturday(day) || isSunday(day)

  const { data: projects = [] } = useProjects()
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects])

  return (
    <div className="flex flex-col border-r border-gray-100 last:border-r-0">
      {/* 날짜 헤더 */}
      <div
        className={cn(
          'sticky top-0 z-20 px-2 py-2.5 border-b border-gray-200 text-center select-none flex-shrink-0',
          today ? 'bg-gray-900' : weekend ? 'bg-gray-50' : 'bg-white',
        )}
      >
        <div className="text-[11px] font-medium mb-0.5 text-gray-400">
          {format(day, 'EEE', { locale: ko })}
        </div>
        <div className={cn('text-xl font-bold leading-none', today ? 'text-white' : weekend ? 'text-gray-400' : 'text-gray-800')}>
          {format(day, 'd')}
        </div>
      </div>

      {/* 블록 영역 */}
      <div
        ref={setNodeRef}
        onClick={onAddClick}
        className={cn(
          'flex-1 min-h-[120px] p-1.5 space-y-0.5 relative group cursor-pointer transition-colors',
          isOver && 'bg-blue-50 ring-1 ring-inset ring-blue-200',
          today && 'bg-amber-50/30',
          weekend && !today && 'bg-gray-50/60',
        )}
      >
        {blocks.map(block => {
          const project = projectMap[block.project_id]
          if (!project) return null
          return (
            <BlockCard
              key={block.id}
              block={block}
              project={project}
              compact
              onClick={e => { e?.stopPropagation(); onBlockClick(block) }}
            />
          )
        })}
        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full text-gray-400 items-center justify-center text-xs hidden group-hover:flex hover:bg-gray-200 transition-colors">
          +
        </div>
      </div>
    </div>
  )
}

export function WeekGrid() {
  const { currentWeekStart, blockModal, openBlockModal, closeBlockModal } = useAppState()
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

  return (
    <>
      <div className="flex-1 overflow-auto">
        <div className="grid min-h-full" style={{ gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))' }}>
          {weekDays.map(day => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              blocks={blocksByDate.get(format(day, 'yyyy-MM-dd')) ?? []}
              onAddClick={() => openBlockModal({ date: format(day, 'yyyy-MM-dd') })}
              onBlockClick={block => setEditBlock(block)}
            />
          ))}
        </div>
      </div>

      <BlockModal
        open={blockModal.open}
        onClose={closeBlockModal}
        prefillDate={blockModal.prefillDate}
        prefillProjectId={blockModal.prefillProjectId}
      />

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
