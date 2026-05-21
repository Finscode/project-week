'use client'

import { useMemo, useRef, useState } from 'react'
import { format, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { useProjects } from '@/hooks/useProjects'
import { useUpdateBlock } from '@/hooks/useBlocks'
import { useWeekBlocks } from '@/hooks/useBlocks'
import { useCoreTime } from '@/hooks/useCoreTime'
import { useAppState } from '@/lib/store'
import { Block, PROJECT_COLORS, ColorKey, CoreTimeRange } from '@/types'
import { BlockModal } from '@/components/blocks/BlockModal'
import { cn } from '@/lib/utils'

const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 64

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number) {
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
}

function buildCoreSegments(ranges: CoreTimeRange[]) {
  return ranges
    .map(r => ({
      top: minutesToPx(timeToMinutes(r.start_time)),
      bottom: minutesToPx(timeToMinutes(r.end_time)),
      startLabel: r.start_time.slice(0, 5),
      endLabel: r.end_time.slice(0, 5),
    }))
    .sort((a, b) => a.top - b.top)
}

function CoreTimeOverlay({ ranges }: { ranges: CoreTimeRange[] }) {
  const totalHeight = HOURS.length * HOUR_HEIGHT
  if (ranges.length === 0) return null
  const segments = buildCoreSegments(ranges)

  const nonCoreRects: { top: number; height: number }[] = []
  let cursor = 0
  for (const seg of segments) {
    if (seg.top > cursor) nonCoreRects.push({ top: cursor, height: seg.top - cursor })
    cursor = seg.bottom
  }
  if (cursor < totalHeight) nonCoreRects.push({ top: cursor, height: totalHeight - cursor })

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {nonCoreRects.map((rect, i) => (
        <div key={i} className="absolute left-0 right-0" style={{ top: rect.top, height: rect.height, backgroundColor: 'rgba(241,239,232,0.55)' }} />
      ))}
      {segments.map((seg, i) => (
        <div key={i}>
          <div className="absolute left-0 right-0" style={{ top: seg.top }}>
            <div className="absolute left-0 right-0 border-t-[1.5px] border-blue-200" />
            <span className="absolute left-1 text-[9px] font-semibold leading-none select-none" style={{ color: '#6BA7D8', top: 1 }}>▾{seg.startLabel}</span>
          </div>
          <div className="absolute left-0 right-0" style={{ top: seg.bottom }}>
            <div className="absolute left-0 right-0 border-t-[1.5px] border-blue-200" />
            <span className="absolute left-1 text-[9px] font-semibold leading-none select-none" style={{ color: '#6BA7D8', top: -10 }}>▴{seg.endLabel}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function BlockPill({ block, onClick }: { block: Block; onClick: () => void }) {
  const { data: projects = [] } = useProjects()
  const { mutate: updateBlock } = useUpdateBlock()
  const project = projects.find(p => p.id === block.project_id)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: {
      type: 'block',
      blockId: block.id,
      startTime: block.start_time,
      endTime: block.end_time,
      title: block.title,
    },
  })

  if (!project) return null

  const color = PROJECT_COLORS[project.color as ColorKey]
  const palette = block.is_done ? color.done : color.pending

  const startMin = block.start_time ? timeToMinutes(block.start_time) : START_HOUR * 60
  const endMin = block.end_time ? timeToMinutes(block.end_time) : startMin + 60
  const top = minutesToPx(startMin)
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden border-l-[3px] hover:brightness-95 transition-all group"
      style={{
        top,
        height,
        backgroundColor: palette.bg,
        color: palette.text,
        borderLeftColor: palette.accent,
        zIndex: 10,
        opacity: isDragging ? 0 : 1,
        cursor: 'grab',
      }}
      onClick={e => { e.stopPropagation(); onClick() }}
    >
      {/* 완료 토글 버튼 */}
      <button
        className={`absolute top-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${block.is_done ? 'border-current bg-current' : 'border-current bg-transparent'}`}
        onClick={e => { e.stopPropagation(); updateBlock({ id: block.id, is_done: !block.is_done }) }}
        title={block.is_done ? '완료 취소' : '완료 표시'}
      >
        {block.is_done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div className="text-xs font-semibold truncate leading-snug pr-4">
        {block.title}{block.is_done && ' ✓'}
      </div>
      {height > 36 && block.start_time && (
        <div className="text-[10px] opacity-70 leading-none mt-0.5">
          {block.start_time.slice(0, 5)}{block.end_time ? `–${block.end_time.slice(0, 5)}` : ''}
        </div>
      )}
    </div>
  )
}

function DayColumn({
  date,
  blocks,
  coreRanges,
  isToday,
  onSlotClick,
  onBlockClick,
}: {
  date: string
  blocks: Block[]
  coreRanges: CoreTimeRange[]
  isToday: boolean
  onSlotClick: (time: string) => void
  onBlockClick: (block: Block) => void
}) {
  const colRef = useRef<HTMLDivElement>(null)
  const { isOver, setNodeRef } = useDroppable({ id: `daycol-${date}` })

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target !== colRef.current && !target.classList.contains('col-bg')) return
    const rect = colRef.current!.getBoundingClientRect()
    const y = e.clientY - rect.top
    const totalMinutes = START_HOUR * 60 + Math.floor((y / HOUR_HEIGHT) * 60)
    const snapped = Math.round(totalMinutes / 15) * 15
    const h = String(Math.floor(snapped / 60)).padStart(2, '0')
    const m = String(snapped % 60).padStart(2, '0')
    onSlotClick(`${h}:${m}`)
  }

  return (
    <div
      ref={node => { colRef.current = node; setNodeRef(node) }}
      className={cn(
        'relative flex-1 min-w-0 border-r border-gray-100 last:border-r-0 col-bg transition-colors',
        isOver && 'bg-blue-50/60',
        isToday && 'bg-amber-50/20',
      )}
      style={{ height: HOURS.length * HOUR_HEIGHT, cursor: 'crosshair' }}
      onClick={handleClick}
    >
      <CoreTimeOverlay ranges={coreRanges} />

      {HOURS.map(h => (
        <div key={h} className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none" style={{ top: (h - START_HOUR) * HOUR_HEIGHT, zIndex: 2 }} />
      ))}
      {HOURS.map(h => (
        <div key={`${h}-half`} className="absolute left-0 right-0 pointer-events-none" style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderTop: '1px dashed #f0f0f0', zIndex: 2 }} />
      ))}

      {blocks.map(block => (
        <BlockPill key={block.id} block={block} onClick={() => onBlockClick(block)} />
      ))}
    </div>
  )
}

export function DayGrid() {
  const { currentWeekStart, blockModal, openBlockModal, closeBlockModal } = useAppState()
  const { data: blocks = [] } = useWeekBlocks(currentWeekStart)
  const { data: coreRanges = [] } = useCoreTime()
  const [editBlock, setEditBlock] = useState<Block | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

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

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = minutesToPx(nowMinutes)
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes < END_HOUR * 60

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 날짜 헤더 */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          <div className="w-14 flex-shrink-0" />
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isToday = dateStr === today
            return (
              <div key={dateStr} className="flex-1 py-2 text-center">
                <div className={cn('text-[11px]', isToday ? 'text-blue-500 font-semibold' : 'text-gray-400')}>
                  {format(day, 'EEE', { locale: ko })}
                </div>
                <div className={cn('text-base font-bold', isToday ? 'text-blue-500' : 'text-gray-700')}>
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* 그리드 본문 */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
            {/* 시간 레이블 */}
            <div className="w-14 flex-shrink-0 relative bg-white">
              {HOURS.map(h => (
                <div key={h} className="absolute right-2 text-[10px] text-gray-400 leading-none" style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 6 }}>
                  {h}:00
                </div>
              ))}
            </div>

            {/* 7개 날짜 컬럼 */}
            <div className="flex flex-1 relative">
              {/* 현재 시간 선 */}
              {showNowLine && (
                <div className="absolute left-0 right-0 pointer-events-none" style={{ top: nowTop, zIndex: 20 }}>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-red-400" />
                  </div>
                </div>
              )}

              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                return (
                  <DayColumn
                    key={dateStr}
                    date={dateStr}
                    blocks={blocksByDate.get(dateStr) ?? []}
                    coreRanges={coreRanges}
                    isToday={dateStr === today}
                    onSlotClick={time => openBlockModal({ date: dateStr, startTime: time })}
                    onBlockClick={block => setEditBlock(block)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <BlockModal
        open={blockModal.open}
        onClose={closeBlockModal}
        prefillDate={blockModal.prefillDate}
        prefillProjectId={blockModal.prefillProjectId}
        prefillStartTime={blockModal.prefillStartTime}
      />

      {editBlock && (
        <BlockModal open onClose={() => setEditBlock(null)} editBlock={editBlock} />
      )}
    </>
  )
}
