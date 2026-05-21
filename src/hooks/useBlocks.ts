'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { mockStore, RecurrenceBlockInput } from '@/lib/mock-data'
import { Block } from '@/types'
import { format, addDays } from 'date-fns'

export function useWeekBlocks(weekStart: Date) {
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  return useQuery({
    queryKey: queryKeys.blocks.byWeek(weekStartStr),
    queryFn: () => mockStore.getBlocksByWeek(weekStartStr, weekEndStr),
  })
}

export function useCreateBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Block, 'id' | 'created_at' | 'updated_at'>) =>
      Promise.resolve(mockStore.createBlock(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}

export function useCreateRecurringBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecurrenceBlockInput) =>
      Promise.resolve(mockStore.createRecurringBlock(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}

export function useUpdateBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Block> & { id: string }) =>
      Promise.resolve(mockStore.updateBlock(id, data)),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.blocks.all })
      // optimistic update: 모든 블록 캐시에서 해당 블록 업데이트
      const previousData: Record<string, Block[]> = {}
      qc.getQueriesData<Block[]>({ queryKey: queryKeys.blocks.all }).forEach(([key, blocks]) => {
        if (blocks) {
          previousData[JSON.stringify(key)] = blocks
          qc.setQueryData(key as readonly string[], blocks.map(b => b.id === id ? { ...b, ...data } : b))
        }
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([key, blocks]) => {
          qc.setQueryData(JSON.parse(key), blocks)
        })
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}

export function useDeleteBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      mockStore.deleteBlock(id)
      return Promise.resolve()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}
