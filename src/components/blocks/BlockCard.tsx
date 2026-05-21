'use client'

import { Block, Project, PROJECT_COLORS, ColorKey } from '@/types'
import { cn } from '@/lib/utils'
import { useUpdateBlock, useDeleteBlock } from '@/hooks/useBlocks'
import { useState, useRef, useEffect } from 'react'

interface BlockCardProps {
  block: Block
  project: Project
  onClick?: (e?: React.MouseEvent) => void
  compact?: boolean
}

export function BlockCard({ block, project, onClick, compact = false }: BlockCardProps) {
  const { mutate: updateBlock } = useUpdateBlock()
  const { mutate: deleteBlock } = useDeleteBlock()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const color = PROJECT_COLORS[project.color as ColorKey]
  const palette = block.is_done ? color.done : color.pending

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateBlock({ id: block.id, is_done: !block.is_done })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    deleteBlock(block.id)
  }

  return (
    <div
      className={cn(
        'relative group rounded-lg cursor-pointer select-none transition-all duration-150',
        'border-l-[3px]',
        compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
      )}
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        borderLeftColor: palette.accent,
      }}
      onClick={onClick}
    >
      {/* 완료 토글 버튼 */}
      <button
        className={cn(
          'absolute top-1.5 right-6 w-4 h-4 rounded-full border-2 flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          block.is_done ? 'border-current bg-current' : 'border-current bg-transparent',
        )}
        onClick={handleToggleDone}
        title={block.is_done ? '완료 취소' : '완료 표시'}
      >
        {block.is_done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* 더보기 메뉴 버튼 */}
      <div ref={menuRef} className="absolute top-1 right-1">
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="2" r="1" /><circle cx="6" cy="6" r="1" /><circle cx="6" cy="10" r="1" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 w-32">
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={(e) => { e.stopPropagation(); onClick?.(); setMenuOpen(false) }}
            >수정</button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >삭제</button>
          </div>
        )}
      </div>

      {/* 제목 */}
      <div className="font-medium leading-snug pr-6 truncate">
        {block.recurrence_id && <span className="mr-1 opacity-60 text-[10px]">🔁</span>}
        {block.title}
        {block.is_done && <span className="ml-1">✓</span>}
      </div>

      {/* 시간 표시 — 주간 뷰(compact)에서도 시간이 있으면 노출 */}
      {block.start_time && (
        <div className="text-[10px] mt-0.5 opacity-60 leading-none">
          {block.start_time.slice(0, 5)}{block.end_time ? `–${block.end_time.slice(0, 5)}` : ''}
        </div>
      )}
    </div>
  )
}
