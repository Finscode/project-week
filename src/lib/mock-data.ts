import { Project, Task, Block, CoreTimeRange, RecurrenceRule } from '@/types'

export const MOCK_USER_ID = 'mock-user-123'

export const mockProjects: Project[] = [
  { id: 'p1', user_id: MOCK_USER_ID, name: '토플', color: 'pink', position: 0, is_archived: false, created_at: new Date().toISOString() },
  { id: 'p2', user_id: MOCK_USER_ID, name: 'PM 학습', color: 'amber', position: 1, is_archived: false, created_at: new Date().toISOString() },
  { id: 'p3', user_id: MOCK_USER_ID, name: '학원앱', color: 'green', position: 2, is_archived: false, created_at: new Date().toISOString() },
  { id: 'p4', user_id: MOCK_USER_ID, name: '교사앱', color: 'blue', position: 3, is_archived: false, created_at: new Date().toISOString() },
  { id: 'p5', user_id: MOCK_USER_ID, name: '운동', color: 'orange', position: 4, is_archived: false, created_at: new Date().toISOString() },
]

export const mockTasks: Task[] = [
  { id: 't1', project_id: 'p1', title: '스피킹 연습', position: 0, is_archived: false, created_at: new Date().toISOString() },
  { id: 't2', project_id: 'p1', title: '리딩 문제풀기', position: 1, is_archived: false, created_at: new Date().toISOString() },
  { id: 't3', project_id: 'p2', title: '케이스 스터디', position: 0, is_archived: false, created_at: new Date().toISOString() },
  { id: 't4', project_id: 'p3', title: '경쟁사 조사', position: 0, is_archived: false, created_at: new Date().toISOString() },
  { id: 't5', project_id: 'p3', title: '포지셔닝 정리', position: 1, is_archived: false, created_at: new Date().toISOString() },
  { id: 't6', project_id: 'p5', title: '헬스', position: 0, is_archived: false, created_at: new Date().toISOString() },
]

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateStr(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return localDateStr(d)
}

// JS getDay() → ISO weekday (1=월 … 7=일)
function isoWeekday(d: Date) {
  return d.getDay() === 0 ? 7 : d.getDay()
}

function getMondayOf(d: Date) {
  const copy = new Date(d)
  const day = copy.getDay() === 0 ? 7 : copy.getDay()
  copy.setDate(copy.getDate() - (day - 1))
  copy.setHours(0, 0, 0, 0)
  return copy
}

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 반복 규칙에 맞는 날짜들을 rangeStart~rangeEnd 안에서 생성 (origin 제외) */
export function getRecurringDatesInRange(
  originDate: string,
  rule: RecurrenceRule,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const origin = parseDate(originDate)
  const start = parseDate(rangeStart)
  const end = parseDate(rangeEnd)
  const results: string[] = []

  const push = (d: Date) => {
    const s = localDateStr(d)
    if (s > originDate && s >= rangeStart && s <= rangeEnd) {
      if (rule.end_type === 'on_date' && rule.end_date && s > rule.end_date) return
      results.push(s)
    }
  }

  const iterate = (from: Date, stepFn: (d: Date) => void) => {
    const cur = new Date(Math.max(from.getTime(), start.getTime()))
    while (cur <= end) {
      push(new Date(cur))
      stepFn(cur)
    }
  }

  if (rule.frequency === 'daily') {
    iterate(origin, d => d.setDate(d.getDate() + 1))
  } else if (rule.frequency === 'weekly' || rule.frequency === 'biweekly') {
    const step = rule.frequency === 'biweekly' ? 2 : 1
    const targetDays = rule.days_of_week?.length ? rule.days_of_week : [isoWeekday(origin)]
    const originMonday = getMondayOf(origin)

    const cur = new Date(start)
    while (cur <= end) {
      const day = isoWeekday(cur)
      if (targetDays.includes(day)) {
        if (rule.frequency === 'biweekly') {
          const curMonday = getMondayOf(cur)
          const weekDiff = Math.round((curMonday.getTime() - originMonday.getTime()) / (7 * 86400000))
          if (weekDiff % step === 0) push(new Date(cur))
        } else {
          push(new Date(cur))
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
  } else if (rule.frequency === 'monthly') {
    const targetDay = origin.getDate()
    const cur = new Date(start)
    while (cur <= end) {
      if (cur.getDate() === targetDay) push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
  }

  return results
}

export const mockBlocks: Block[] = [
  {
    id: 'b1', project_id: 'p1', task_id: 't1',
    start_date: localDateStr(), end_date: localDateStr(),
    start_time: '14:00', end_time: '15:30',
    title: '스피킹 연습', memo: null, is_done: true,
    recurrence_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'b2', project_id: 'p2', task_id: null,
    start_date: getDateStr(1), end_date: getDateStr(1),
    start_time: null, end_time: null,
    title: '케이스 스터디', memo: null, is_done: false,
    recurrence_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: 'b3', project_id: 'p5', task_id: 't6',
    start_date: localDateStr(), end_date: localDateStr(),
    start_time: '06:30', end_time: '07:30',
    title: '헬스', memo: null, is_done: false,
    recurrence_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
]

export const mockCoreTimeRanges: CoreTimeRange[] = [
  { id: 'ct1', user_id: MOCK_USER_ID, start_time: '14:00', end_time: '17:00', position: 0 },
  { id: 'ct2', user_id: MOCK_USER_ID, start_time: '20:30', end_time: '22:00', position: 1 },
]

export interface RecurrenceBlockInput {
  block: Omit<Block, 'id' | 'created_at' | 'updated_at'>
  rule: {
    frequency: RecurrenceRule['frequency']
    days_of_week: number[] | null
    end_type: RecurrenceRule['end_type']
    end_date: string | null
    end_count: number | null
  }
}

class MockStore {
  projects: Project[] = [...mockProjects]
  tasks: Task[] = [...mockTasks]
  blocks: Block[] = [...mockBlocks]
  coreTimeRanges: CoreTimeRange[] = [...mockCoreTimeRanges]
  recurrenceRules: RecurrenceRule[] = []
  // ruleId → originDate
  private recurrenceOrigins = new Map<string, string>()

  getProjects() { return this.projects.filter(p => !p.is_archived) }

  getTasks(projectId?: string) {
    const tasks = this.tasks.filter(t => !t.is_archived)
    return projectId ? tasks.filter(t => t.project_id === projectId) : tasks
  }

  getBlocksByWeek(weekStart: string, weekEnd: string): Block[] {
    const regular = this.blocks.filter(b => b.start_date >= weekStart && b.start_date <= weekEnd)

    const virtual: Block[] = []
    for (const rule of this.recurrenceRules) {
      const originDate = this.recurrenceOrigins.get(rule.id)
      if (!originDate) continue
      const template = this.blocks.find(b => b.recurrence_id === rule.id)
      if (!template) continue

      // 이미 명시적으로 존재하는 날짜는 건너뜀 (개별 수정 대응)
      const explicitDates = new Set(
        this.blocks.filter(b => b.recurrence_id === rule.id).map(b => b.start_date),
      )

      const dates = getRecurringDatesInRange(originDate, rule, weekStart, weekEnd)
      for (const date of dates) {
        if (!explicitDates.has(date)) {
          virtual.push({
            ...template,
            id: `virtual-${template.id}-${date}`,
            start_date: date,
            end_date: date,
            is_done: false,
          })
        }
      }
    }

    return [...regular, ...virtual]
  }

  createProject(data: Omit<Project, 'id' | 'user_id' | 'created_at'>) {
    const project: Project = { ...data, id: crypto.randomUUID(), user_id: MOCK_USER_ID, created_at: new Date().toISOString() }
    this.projects.push(project)
    return project
  }

  createTask(data: Omit<Task, 'id' | 'created_at'>) {
    const task: Task = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    this.tasks.push(task)
    return task
  }

  createBlock(data: Omit<Block, 'id' | 'created_at' | 'updated_at'>) {
    const block: Block = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    this.blocks.push(block)
    return block
  }

  createRecurringBlock({ block, rule }: RecurrenceBlockInput) {
    const ruleRecord: RecurrenceRule = {
      id: crypto.randomUUID(),
      project_id: block.project_id,
      frequency: rule.frequency,
      days_of_week: rule.days_of_week,
      end_type: rule.end_type,
      end_date: rule.end_date,
      end_count: rule.end_count,
      created_at: new Date().toISOString(),
    }
    this.recurrenceRules.push(ruleRecord)
    this.recurrenceOrigins.set(ruleRecord.id, block.start_date)
    return this.createBlock({ ...block, recurrence_id: ruleRecord.id })
  }

  updateBlock(id: string, data: Partial<Block>) {
    const idx = this.blocks.findIndex(b => b.id === id)
    if (idx === -1) return null
    this.blocks[idx] = { ...this.blocks[idx], ...data, updated_at: new Date().toISOString() }
    return this.blocks[idx]
  }

  deleteBlock(id: string) {
    this.blocks = this.blocks.filter(b => b.id !== id)
  }

  updateProject(id: string, data: Partial<Project>) {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) return null
    this.projects[idx] = { ...this.projects[idx], ...data }
    return this.projects[idx]
  }

  deleteTask(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id)
    this.blocks = this.blocks.map(b => b.task_id === id ? { ...b, task_id: null } : b)
  }
}

export const mockStore = new MockStore()
