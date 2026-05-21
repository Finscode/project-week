'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { Project, ColorKey } from '@/types'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('position')
      if (error) throw error
      return data as Project[]
    },
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; color: ColorKey }) => {
      const { data: projects } = await supabase.from('projects').select('position').order('position', { ascending: false }).limit(1)
      const position = projects?.[0]?.position != null ? projects[0].position + 1 : 0
      const { data: result, error } = await supabase
        .from('projects')
        .insert({ ...data, position, is_archived: false })
        .select()
        .single()
      if (error) throw error
      return result as Project
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const { error } = await supabase.from('projects').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  })
}
