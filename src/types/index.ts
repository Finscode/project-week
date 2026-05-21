export interface Project {
  id: string
  user_id: string
  name: string
  color: string // 색상 키: 'pink' | 'amber' | 'green' | 'blue' | 'orange'
  position: number
  is_archived: boolean
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  position: number
  is_archived: boolean
  created_at: string
}

export interface Block {
  id: string
  project_id: string
  task_id: string | null
  start_date: string // 'YYYY-MM-DD'
  end_date: string
  start_time: string | null // 'HH:MM'
  end_time: string | null
  title: string
  memo: string | null
  is_done: boolean
  recurrence_id: string | null
  created_at: string
  updated_at: string
}

export interface RecurrenceRule {
  id: string
  project_id: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  days_of_week: number[] | null
  end_type: 'never' | 'on_date' | 'count'
  end_date: string | null
  end_count: number | null
  created_at: string
}

export interface CoreTimeRange {
  id: string
  user_id: string
  start_time: string
  end_time: string
  position: number
}

// PRD 색상 시스템
export const PROJECT_COLORS = {
  pink: {
    pending: { bg: '#FBEAF0', text: '#72243E', accent: '#ED93B1' },
    done: { bg: '#D4537E', text: '#FFFFFF', accent: '#993556' },
  },
  amber: {
    pending: { bg: '#FAEEDA', text: '#633806', accent: '#EF9F27' },
    done: { bg: '#BA7517', text: '#FFFFFF', accent: '#854F0B' },
  },
  green: {
    pending: { bg: '#EAF3DE', text: '#27500A', accent: '#97C459' },
    done: { bg: '#639922', text: '#FFFFFF', accent: '#3B6D11' },
  },
  blue: {
    pending: { bg: '#E6F1FB', text: '#0C447C', accent: '#85B7EB' },
    done: { bg: '#378ADD', text: '#FFFFFF', accent: '#185FA5' },
  },
  orange: {
    pending: { bg: '#FFEDD5', text: '#9A3412', accent: '#FB923C' },
    done: { bg: '#F97316', text: '#FFFFFF', accent: '#EA580C' },
  },
} as const

export type ColorKey = keyof typeof PROJECT_COLORS

export const COLOR_OPTIONS: { key: ColorKey; label: string; emoji: string }[] = [
  { key: 'pink', label: '핑크', emoji: '🟣' },
  { key: 'amber', label: '노랑', emoji: '🟡' },
  { key: 'green', label: '초록', emoji: '🟢' },
  { key: 'blue', label: '파랑', emoji: '🔵' },
  { key: 'orange', label: '주황', emoji: '🟠' },
]
