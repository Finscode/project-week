'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { mockStore } from '@/lib/mock-data'
import { Project, ColorKey } from '@/types'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => mockStore.getProjects(),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color: ColorKey }) =>
      Promise.resolve(mockStore.createProject({ ...data, position: mockStore.projects.length, is_archived: false })),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      Promise.resolve(mockStore.updateProject(id, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  })
}
