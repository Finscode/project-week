'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { CoreTimeRange } from '@/types'

const USER_ID = 'default-user'

export function useCoreTime() {
  return useQuery({
    queryKey: queryKeys.coreTime.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('core_time_ranges')
        .select('*')
        .eq('user_id', USER_ID)
        .order('position')
      if (error) throw error
      return (data ?? []).map(r => ({
        ...r,
        start_time: String(r.start_time).slice(0, 5),
        end_time: String(r.end_time).slice(0, 5),
      })) as CoreTimeRange[]
    },
  })
}

export function useSaveCoreTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ranges: Array<{ start_time: string; end_time: string }>) => {
      const { error: delError } = await supabase
        .from('core_time_ranges')
        .delete()
        .eq('user_id', USER_ID)
      if (delError) throw delError

      if (ranges.length === 0) return []

      const rows = ranges.map((r, i) => ({
        user_id: USER_ID,
        start_time: r.start_time,
        end_time: r.end_time,
        position: i,
      }))
      const { data, error } = await supabase.from('core_time_ranges').insert(rows).select()
      if (error) throw error
      return data as CoreTimeRange[]
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coreTime.all }),
  })
}
