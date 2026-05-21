'use client'

import { useMemo, useRef, useState } from 'react'
import { format, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useDroppable } from '@dnd-kit/core'
import { useProjects } from '@/hooks/useProjects'
import { useWeekBlocks } from '@/hooks/useBlocks'
import { useCoreTime } from '@/hooks/useCoreTime'
import { useAppState } from '@/lib/store'
import { Block, Project, PROJECT_COLORS, ColorKey, CoreTimeRange } from '@/types'
import { BlockModal } from '@/components/blocks/BlockModal'
import { cn } from '@/lib/utils'

const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const HOUR_HEIGHT = 64 // px per hour

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number) {
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
}

// 코어타임 구간을 픽셀 구간으로 변환
function buildCoreSegments(ranges: CoreTimeRange[]) {
  if (ranges.length === 0) return [] // 빈 코어타임 = 전체 코어
  return ranges
    .map(r => ({
      top: minutesToPx(timeToMinutes(r.start_time)),
      bottom: minutesToPx(timeToMinutes(r.end_time)),
      startLabel: r.start_time.slice(0, 5),
      endLabel: r.end_time.slice(0, 5),
    }))
    .sort((a, b) => a.top - b.top)
}

// 코어타임 오버레이 (배경 레이어)
function CoreTimeOverlay({ ranges }: { ranges: CoreTimeRange[] }) {
  const totalHeight = HOURS.length * HOUR_HEIGHT
  const segments = buildCoreSegments(ranges)

  // 코어타임이 없으면 전체 흰 배경 (오버레이 불필요)
  if (segments.length === 0) return null

  // 비코어 구간: 회색 블록들을 absolute로 배치
  const nonCoreRects: { top: number; height: number }[] = []
  let cursor = 0
  for (const seg of segments) {
    if (seg.top > cursor) {
      nonCoreRects.push({ top: cursor, height: seg.top - cursor })
    }
    cursor = seg.bottom
  }
  if (cursor < totalHeight) {
    nonCoreRects.push({ top: cursor, height: totalHeight - cursor })
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {/* 비코어 영역: 회색 */}
      {nonCoreRects.map((rect, i) => (
        <div
          key={i}
          className="absolute left-0 right-0"
          style={{
            top: rect.top,
            height: rect.height,
            backgroundColor: 'rgba(241,239,232,0.55)',
          }}
        />
      ))}

      {/* 코어 경계선 + 시간 마커 */}
      {segments.map((seg, i) => (
        <div key={i}>
          {/* 코어 시작 선 (▾ 마커) */}
          <div
            className="absolute left-0 right-0 flex items-center"
            style={{ top: seg.top }}
          >
            <div className="absolute left-0 right-0 border-t-[1.5px] border-blue-200" />
            <span
              className="absolute left-1 text-[9px] font-semibold leading-none select-none"
              style={{ color: '#6BA7D8', top: 1 }}
            >
              ▾{seg.startLabel}
            </span>
          </div>
          {/* 코어 종료 선 (▴ 마커) */}
          <div
            className="absolute left-0 right-0 flex items-center"
            style={{ top: seg.bottom }}
          >
            <div className="absolute left-0 right-0 border-t-[1.5px] border-blue-200" />
            <span
              className="absolute left-1 text-[9px] font-semibold leading-none select-none"
              style={{ color: '#6BA7D8', top: -10 }}
            >
              ▴{seg.endLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface BlockPillProps {
  block: Block
  project: Project
  onClick: () => void
}

function BlockPill({ block, project, onClick }: BlockPillProps) {
  const color = PROJECT_COLORS[project.color as ColorKey]
  const palette = block.is_done ? color.done : color.pending

  const startMin = block.start_time ? timeToMinutes(block.start_time) : START_HOUR * 60
  const endMin = block.end_time ? timeToMinutes(block.end_time) : startMin + 60
  const top = minutesToPx(startMin)
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24)

  return (
    <div
      className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden border-l-[3px] transition-all hover:brightness-95"
      style={{
        top,
        height,
        backgroundColor: palette.bg,
        color: palette.text,
        borderLeftColor: palette.accent,
        zIndex: 10,
      }}
      onClick={onClick}
    >
      <div className="text-xs font-semibold truncate leading-snug">
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

interface DayColumnProps {
  project: Project
  blocks: Block[]
  coreRanges: CoreTimeRange[]
  date: string
  onBlockClick: (block: Block) => void
  onSlotClick: (time: string) => void
}

function DayColumn({ project, blocks, coreRanges, date, onBlockClick, onSlotClick }: DayColumnProps) {
  const colRef = useRef<HTMLDivElement>(null)

  // 드롭 존 (task → day view)
  const droppableId = `daycol-${project.id}-${date}`
  const { isOver, setNodeRef: setDropRef } = useDroppable({ id: droppableId })

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
      ref={node => { colRef.current = node; setDropRef(node) }}
      className={cn(
        'relative flex-1 min-w-0 border-r border-gray-100 col-bg transition-colors',
        isOver && 'bg-blue-50/60',
      )}
      style={{ height: HOURS.length * HOUR_HEIGHT, cursor: 'crosshair' }}
      onClick={handleClick}
    >
      {/* 코어타임 배경 오버레이 */}
      <CoreTimeOverlay ranges={coreRanges} />

      {/* 격자선 */}
      {HOURS.map(h => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-gray-100 pointer-events-none"
          style={{ top: (h - START_HOUR) * HOUR_HEIGHT, zIndex: 2 }}
        />
      ))}
      {HOURS.map(h => (
        <div
          key={`${h}-half`}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
            borderTop: '1px dashed #f0f0f0',
            zIndex: 2,
          }}
        />
      ))}

      {/* 블록들 */}
      {blocks.map(block => (
        <BlockPill key={block.id} block={block} project={project} onClick={() => onBlockClick(block)} />
      ))}
    </div>
  )
}

export function DayGrid() {
  const { currentWeekStart } = useAppState()
  const { data: projects = [] } = useProjects()
  const { data: blocks = [] } = useWeekBlocks(currentWeekStart)
  const { data: coreRanges = [] } = useCoreTime()
  const [editBlock, setEditBlock] = useState<Block | null>(null)
  const [slotModal, setSlotModal] = useState<{ date: string; time: string; projectId: string } | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart],
  )

  const displayDate = useMemo(() => {
    const todayInWeek = weekDays.find(d => format(d, 'yyyy-MM-dd') === today)
    return todayInWeek ? today : format(currentWeekStart, 'yyyy-MM-dd')
  }, [weekDays, today, currentWeekStart])

  const [selectedDate, setSelectedDate] = useState(displayDate)

  const blocksByProject = useMemo(() => {
    const map = new Map<string, Block[]>()
    projects.forEach(p => map.set(p.id, []))
    blocks
      .filter(b => b.start_date === selectedDate)
      .forEach(b => { map.get(b.project_id)?.push(b) })
    return map
  }, [blocks, projects, selectedDate])

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = minutesToPx(nowMinutes)
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes < END_HOUR * 60

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 날짜 탭 */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          <div className="w-14 flex-shrink-0" />
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === today
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  'flex-1 py-2 text-center transition-colors border-b-2',
                  isSelected ? 'border-gray-900' : 'border-transparent',
                )}
              >
                <div className={cn('text-[11px]', isToday ? 'text-blue-500 font-semibold' : 'text-gray-400')}>
                  {format(day, 'EEE', { locale: ko })}
                </div>
                <div className={cn(
                  'text-base font-bold',
                  isSelected && isToday ? 'text-blue-500' :
                  isSelected ? 'text-gray-900' :
                  isToday ? 'text-blue-400' : 'text-gray-500',
                )}>
                  {format(day, 'd')}
                </div>
              </button>
            )
          })}
        </div>

        {/* 프로젝트 헤더 */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          <div className="w-14 flex-shrink-0" />
          {projects.map(p => {
            const color = PROJECT_COLORS[p.color as ColorKey]
            return (
              <div key={p.id} className="flex-1 py-2 px-1 text-center border-r border-gray-100 last:border-0">
                <div className="inline-flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color.done.bg }} />
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">{p.name}</span>
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
                <div
                  key={h}
                  className="absolute right-2 text-[10px] text-gray-400 leading-none"
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 6 }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* 프로젝트 컬럼들 */}
            <div className="flex flex-1 relative bg-white">
              {/* 현재 시간 선 */}
              {showNowLine && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: nowTop, zIndex: 20 }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-red-400" />
                  </div>
                </div>
              )}

              {projects.map(project => (
                <DayColumn
                  key={project.id}
                  project={project}
                  blocks={blocksByProject.get(project.id) ?? []}
                  coreRanges={coreRanges}
                  date={selectedDate}
                  onBlockClick={setEditBlock}
                  onSlotClick={(time) => setSlotModal({ date: selectedDate, time, projectId: project.id })}
                />
              ))}

              {projects.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  프로젝트를 추가해보세요
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {slotModal && (
        <BlockModal
          open
          onClose={() => setSlotModal(null)}
          prefillDate={slotModal.date}
          prefillProjectId={slotModal.projectId}
          prefillStartTime={slotModal.time}
        />
      )}

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
