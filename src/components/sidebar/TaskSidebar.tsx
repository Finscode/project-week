'use client'

import { useState, useRef, useEffect } from 'react'
import { useProjects, useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { Project, Task, PROJECT_COLORS, ColorKey, COLOR_OPTIONS } from '@/types'
import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DraggableTaskItemProps {
  task: Task
  project: Project
}

function DraggableTaskItem({ task, project }: DraggableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', taskId: task.id, projectId: task.project_id, title: task.title },
  })
  const { mutate: updateTask } = useUpdateTask()
  const { mutate: deleteTask } = useDeleteTask()

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const color = PROJECT_COLORS[project.color as ColorKey]

  useEffect(() => {
    if (editing) {
      setEditValue(task.title)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing, task.title])

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.title) {
      updateTask({ id: task.id, title: trimmed })
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-3 py-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={commitEdit}
          className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
    )
  }

  return (
    <div
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors group select-none"
    >
      {/* 드래그 핸들 */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing flex items-center gap-2 flex-1 min-w-0"
      >
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.pending.accent }} />
        <span className="text-xs text-gray-700 truncate flex-1">{task.title}</span>
      </div>

      {/* 수정/삭제 버튼 — hover 시 노출 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setEditing(true) }}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200"
          title="이름 변경"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M7 1.5l1.5 1.5-5 5L2 9l.5-1.5 5-5z" />
          </svg>
        </button>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            if (confirm(`"${task.title}" 할 일을 삭제할까요?`)) deleteTask(task.id)
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
          title="삭제"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M2 2l6 6M8 2l-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ProjectSection({ project, tasks }: { project: Project; tasks: Task[] }) {
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(project.name)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { mutate: createTask } = useCreateTask()
  const { mutate: updateProject } = useUpdateProject()
  const color = PROJECT_COLORS[project.color as ColorKey]

  useEffect(() => {
    if (editingName) {
      setNameValue(project.name)
      setTimeout(() => nameInputRef.current?.select(), 0)
    }
  }, [editingName, project.name])

  const commitNameEdit = () => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== project.name) {
      updateProject({ id: project.id, name: trimmed })
    }
    setEditingName(false)
  }

  const handleAdd = () => {
    if (!newTitle.trim()) return
    createTask({ project_id: project.id, title: newTitle.trim() })
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      {editingName ? (
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.done.bg }} />
          <input
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitNameEdit()
              if (e.key === 'Escape') setEditingName(false)
            }}
            onBlur={commitNameEdit}
            className="flex-1 text-sm border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
          <button
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => setExpanded(v => !v)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.done.bg }} />
            <span className="text-sm font-medium text-gray-800 flex-1 text-left truncate">{project.name}</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); setEditingName(true) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex-shrink-0"
            title="이름 변경"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M7 1.5l1.5 1.5-5 5L2 9l.5-1.5 5-5z" />
            </svg>
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0"
          >
            <svg
              className={cn('w-3 h-3 text-gray-400 transition-transform', expanded && 'rotate-90')}
              viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            >
              <path d="M4 2l4 4-4 4" />
            </svg>
          </button>
        </div>
      )}

      {expanded && (
        <div className="pb-2">
          {tasks.length === 0 && !adding && (
            <p className="text-xs text-gray-400 px-3 py-1">할 일이 없어요</p>
          )}
          {tasks.map(t => <DraggableTaskItem key={t.id} task={t} project={project} />)}
          {adding ? (
            <div className="px-3 py-1 flex gap-1.5">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
                }}
                placeholder="할 일 이름"
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button onClick={handleAdd} className="text-xs bg-gray-900 text-white px-2 py-1 rounded">추가</button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
            >
              + 할 일 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AddProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<ColorKey>('blue')
  const { mutate: createProject, isPending } = useCreateProject()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createProject({ name: name.trim(), color }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 mb-4 sm:mb-0" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">새 프로젝트</h3>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="프로젝트 이름"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setColor(opt.key)}
                className={cn('w-8 h-8 rounded-full border-2 transition-all', color === opt.key ? 'border-gray-900 scale-110' : 'border-transparent')}
                style={{ backgroundColor: PROJECT_COLORS[opt.key].done.bg }}
                title={opt.label}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
            <button type="submit" disabled={isPending} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function TaskSidebar() {
  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks()
  const [addingProject, setAddingProject] = useState(false)

  return (
    <>
      <aside className="w-[200px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">프로젝트</span>
          <button
            onClick={() => setAddingProject(true)}
            className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs transition-colors"
            title="프로젝트 추가"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          {projects.map(p => (
            <ProjectSection key={p.id} project={p} tasks={tasks.filter(t => t.project_id === p.id)} />
          ))}
          {projects.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-4 text-center">프로젝트를 추가하세요</p>
          )}
        </div>
      </aside>
      {addingProject && <AddProjectModal onClose={() => setAddingProject(false)} />}
    </>
  )
}
