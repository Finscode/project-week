'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useCoreTime, useSaveCoreTime } from '@/hooks/useCoreTime'

interface TimeRange {
  start_time: string
  end_time: string
}

interface CoreTimeModalProps {
  open: boolean
  onClose: () => void
}

export function CoreTimeModal({ open, onClose }: CoreTimeModalProps) {
  const { data: saved = [] } = useCoreTime()
  const { mutate: save, isPending } = useSaveCoreTime()

  const [ranges, setRanges] = useState<TimeRange[]>([
    { start_time: '14:00', end_time: '17:00' },
  ])

  useEffect(() => {
    if (!open) return
    if (saved.length > 0) {
      setRanges(saved.map(r => ({ start_time: r.start_time, end_time: r.end_time })))
    } else {
      setRanges([{ start_time: '14:00', end_time: '17:00' }])
    }
  }, [open, saved])

  const updateRange = (i: number, field: keyof TimeRange, value: string) => {
    setRanges(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const addRange = () => {
    setRanges(rs => [...rs, { start_time: '20:00', end_time: '22:00' }])
  }

  const removeRange = (i: number) => {
    setRanges(rs => rs.filter((_, idx) => idx !== i))
  }

  const handleSave = () => {
    const valid = ranges.filter(r => r.start_time && r.end_time && r.start_time < r.end_time)
    save(valid, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onClose={onClose} title="코어타임 설정" size="sm">
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          집중하는 시간대를 설정하면 일간 뷰에서 해당 구간이 강조됩니다.
          비어있으면 전 시간이 코어타임으로 처리됩니다.
        </p>

        {ranges.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <input
              type="time"
              value={r.start_time}
              onChange={e => updateRange(i, 'start_time', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="time"
              value={r.end_time}
              onChange={e => updateRange(i, 'end_time', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => removeRange(i)}
              disabled={ranges.length === 1}
              className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6h8" />
              </svg>
            </button>
          </div>
        ))}

        {ranges.some((r, i) => i > 0 && r.start_time < ranges[i - 1].end_time) && (
          <p className="text-xs text-red-500">구간이 겹치지 않도록 설정해주세요.</p>
        )}

        <button
          onClick={addRange}
          className="w-full py-1.5 text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + 구간 추가
        </button>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
