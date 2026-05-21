'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types'

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_archived', false)
        .order('position')
      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { project_id: string; title: string }) => {
      const { data: result, error } = await supabase
        .from('tasks')
        .insert({ ...data, position: 0, is_archived: false })
        .select()
        .single()
      if (error) throw error
      return result as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('tasks').update({ title }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all })
      qc.invalidateQueries({ queryKey: queryKeys.blocks.all })
    },
  })
}
