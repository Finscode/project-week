import { RecurrenceRule } from '@/types'

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
