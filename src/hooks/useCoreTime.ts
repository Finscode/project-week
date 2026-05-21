'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { mockStore } from '@/lib/mock-data'
import { CoreTimeRange } from '@/types'

export function useCoreTime() {
  return useQuery({
    queryKey: queryKeys.coreTime.all,
    queryFn: () => [...mockStore.coreTimeRanges].sort((a, b) => a.position - b.position),
  })
}

export function useSaveCoreTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ranges: Array<{ start_time: string; end_time: string }>) => {
      // 기존 전부 교체
      mockStore.coreTimeRanges = ranges.map((r, i) => ({
        id: crypto.randomUUID(),
        user_id: 'mock-user-123',
        start_time: r.start_time,
        end_time: r.end_time,
        position: i,
      }))
      return Promise.resolve([...mockStore.coreTimeRanges])
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.coreTime.all }),
  })
}
