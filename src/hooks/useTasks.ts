'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { mockStore } from '@/lib/mock-data'
import { Task } from '@/types'

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => mockStore.getTasks(),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { project_id: string; title: string }) =>
      Promise.resolve(mockStore.createTask({ ...data, position: 0, is_archived: false })),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => {
      const idx = mockStore.tasks.findIndex(t => t.id === id)
      if (idx !== -1) mockStore.tasks[idx] = { ...mockStore.tasks[idx], title }
      return Promise.resolve()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      mockStore.deleteTask(id)
      return Promise.resolve()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all })
      qc.invalidateQueries({ queryKey: queryKeys.blocks.all })
    },
  })
}
