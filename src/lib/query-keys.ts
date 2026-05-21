export const queryKeys = {
  projects: {
    all: ['projects'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    byProject: (projectId: string) => ['tasks', projectId] as const,
  },
  blocks: {
    all: ['blocks'] as const,
    byWeek: (weekStart: string) => ['blocks', 'week', weekStart] as const,
    byDay: (date: string) => ['blocks', 'day', date] as const,
  },
  coreTime: {
    all: ['coreTime'] as const,
  },
} as const
