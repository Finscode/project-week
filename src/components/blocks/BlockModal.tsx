'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useCreateBlock, useCreateRecurringBlock, useUpdateBlock } from '@/hooks/useBlocks'
import { useProjects } from '@/hooks/useProjects'
import { Block, ColorKey, PROJECT_COLORS, RecurrenceRule } from '@/types'
import { cn } from '@/lib/utils'

const FREQ_OPTIONS: { value: RecurrenceRule['frequency']; label: string }[] = [
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'biweekly', label: '격주' },
  { value: 'monthly', label: '매월' },
]

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
// ISO weekday: 1=월 … 7=일

interface RecurrenceForm {
  enabled: boolean
  frequency: RecurrenceRule['frequency']
  daysOfWeek: number[] // ISO weekdays
  endType: RecurrenceRule['end_type']
  endDate: string
  endCount: string
}

interface BlockModalProps {
  open: boolean
  onClose: () => void
  editBlock?: Block
  prefillDate?: string
  prefillProjectId?: string
  prefillStartTime?: string
}

export function BlockModal({ open, onClose, editBlock, prefillDate, prefillProjectId, prefillStartTime }: BlockModalProps) {
  const { data: projects = [] } = useProjects()
  const { mutate: createBlock, isPending: creating } = useCreateBlock()
  const { mutate: createRecurring, isPending: creatingRecurring } = useCreateRecurringBlock()
  const { mutate: updateBlock, isPending: updating } = useUpdateBlock()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [form, setForm] = useState({
    title: '',
    project_id: '',
    start_date: todayStr,
    end_date: todayStr,
    start_time: '',
    end_time: '',
    memo: '',
  })

  const [recurrence, setRecurrence] = useState<RecurrenceForm>({
    enabled: false,
    frequency: 'weekly',
    daysOfWeek: [],
    endType: 'never',
    endDate: '',
    endCount: '',
  })

  useEffect(() => {
    if (!open) return
    if (editBlock) {
      setForm({
        title: editBlock.title,
        project_id: editBlock.project_id,
        start_date: editBlock.start_date,
        end_date: editBlock.end_date,
        start_time: editBlock.start_time ?? '',
        end_time: editBlock.end_time ?? '',
        memo: editBlock.memo ?? '',
      })
      setRecurrence(r => ({ ...r, enabled: false }))
    } else {
      setForm({
        title: '',
        project_id: prefillProjectId ?? (projects[0]?.id ?? ''),
        start_date: prefillDate ?? todayStr,
        end_date: prefillDate ?? todayStr,
        start_time: prefillStartTime ?? '',
        end_time: '',
        memo: '',
      })
      setRecurrence({ enabled: false, frequency: 'weekly', daysOfWeek: [], endType: 'never', endDate: '', endCount: '' })
    }
  }, [open, editBlock, prefillDate, prefillProjectId, projects, todayStr, prefillStartTime])

  const toggleDay = (day: number) => {
    setRecurrence(r => ({
      ...r,
      daysOfWeek: r.daysOfWeek.includes(day) ? r.daysOfWeek.filter(d => d !== day) : [...r.daysOfWeek, day],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.project_id) return

    const blockData = {
      project_id: form.project_id,
      task_id: editBlock?.task_id ?? null,
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      title: form.title.trim(),
      memo: form.memo || null,
      is_done: editBlock?.is_done ?? false,
      recurrence_id: null as null,
    }

    if (editBlock) {
      updateBlock({ id: editBlock.id, ...blockData }, { onSuccess: onClose })
      return
    }

    if (recurrence.enabled) {
      const showDays = recurrence.frequency === 'weekly' || recurrence.frequency === 'biweekly'
      createRecurring({
        block: blockData,
        rule: {
          frequency: recurrence.frequency,
          days_of_week: showDays && recurrence.daysOfWeek.length > 0 ? recurrence.daysOfWeek : null,
          end_type: recurrence.endType,
          end_date: recurrence.endType === 'on_date' ? recurrence.endDate || null : null,
          end_count: recurrence.endType === 'count' ? (parseInt(recurrence.endCount) || null) : null,
        },
      }, { onSuccess: onClose })
    } else {
      createBlock(blockData, { onSuccess: onClose })
    }
  }

  const isPending = creating || creatingRecurring || updating
  const showDays = recurrence.frequency === 'weekly' || recurrence.frequency === 'biweekly'

  return (
    <Modal open={open} onClose={onClose} title={editBlock ? '블록 수정' : '새 블록'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="블록 제목 (30자)"
            maxLength={30}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            required
          />
        </div>

        {/* 프로젝트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 *</label>
          <div className="flex flex-wrap gap-2">
            {projects.map(p => {
              const palette = PROJECT_COLORS[p.color as ColorKey]
              const selected = form.project_id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cn('px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all', selected ? 'border-current' : 'border-transparent opacity-60')}
                  style={{
                    backgroundColor: selected ? palette.pending.bg : '#f5f5f5',
                    color: selected ? palette.pending.text : '#666',
                    borderColor: selected ? palette.pending.accent : 'transparent',
                  }}
                  onClick={() => setForm(f => ({ ...f, project_id: p.id }))}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input type="date" value={form.start_date}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value, end_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input type="date" value={form.end_date} min={form.start_date}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 시간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
            <input type="time" value={form.start_time}
              onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
            <input type="time" value={form.end_time}
              onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 반복 설정 (생성 시에만) */}
        {!editBlock && (
          <div className="border border-gray-100 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recurrence.enabled}
                onChange={e => setRecurrence(r => ({ ...r, enabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">🔁 반복</span>
            </label>

            {recurrence.enabled && (
              <div className="space-y-3 pt-1">
                {/* 주기 */}
                <div className="flex gap-1.5">
                  {FREQ_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRecurrence(r => ({ ...r, frequency: opt.value }))}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all',
                        recurrence.frequency === opt.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* 요일 선택 (매주/격주) */}
                {showDays && (
                  <div className="flex gap-1">
                    {DAY_LABELS.map((label, i) => {
                      const iso = i + 1 // 1=월 … 7=일
                      const active = recurrence.daysOfWeek.includes(iso)
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => toggleDay(iso)}
                          className={cn(
                            'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all',
                            active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
                            (iso === 6 || iso === 7) && !active && 'text-red-400',
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* 종료 조건 */}
                <div className="flex gap-1.5 items-center">
                  {(['never', 'on_date', 'count'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRecurrence(r => ({ ...r, endType: t }))}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-lg border transition-all',
                        recurrence.endType === t
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                      )}
                    >
                      {t === 'never' ? '끝없이' : t === 'on_date' ? '날짜까지' : 'N회'}
                    </button>
                  ))}
                  {recurrence.endType === 'on_date' && (
                    <input type="date" value={recurrence.endDate}
                      onChange={e => setRecurrence(r => ({ ...r, endDate: e.target.value }))}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  )}
                  {recurrence.endType === 'count' && (
                    <div className="flex items-center gap-1">
                      <input type="number" min="1" max="100" value={recurrence.endCount}
                        onChange={e => setRecurrence(r => ({ ...r, endCount: e.target.value }))}
                        placeholder="횟수"
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <span className="text-xs text-gray-500">회</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button type="submit" disabled={isPending}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isPending ? '저장 중...' : editBlock ? '수정' : recurrence.enabled ? '반복 만들기' : '만들기'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
