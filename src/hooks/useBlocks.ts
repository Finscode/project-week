'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { getRecurringDatesInRange } from '@/lib/recurrence'
import { Block, RecurrenceRule } from '@/types'
import { format, addDays } from 'date-fns'

// Supabase returns time as HH:MM:SS — normalize to HH:MM
function normalizeBlock(row: Record<string, unknown>): Block {
  return {
    ...row,
    start_time: row.start_time ? String(row.start_time).slice(0, 5) : null,
    end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
  } as Block
}

export function useWeekBlocks(weekStart: Date) {
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  return useQuery({
    queryKey: queryKeys.blocks.byWeek(weekStartStr),
    queryFn: async () => {
      // 1. Blocks visible in this week
      const { data: weekRows, error: e1 } = await supabase
        .from('blocks')
        .select('*')
        .gte('start_date', weekStartStr)
        .lte('start_date', weekEndStr)
      if (e1) throw e1

      // 2. Recurrence rules
      const { data: rules, error: e2 } = await supabase
        .from('recurrence_rules')
        .select('*')
      if (e2) throw e2

      const weekBlocks = (weekRows ?? []).map(normalizeBlock)
      if (!rules?.length) return weekBlocks

      // 3. All explicit recurring blocks (for origin date + skip list)
      const { data: allRecurring, error: e3 } = await supabase
        .from('blocks')
        .select('*')
        .not('recurrence_id', 'is', null)
        .order('start_date', { ascending: true })
      if (e3) throw e3

      const virtual: Block[] = []
      for (const rule of rules as RecurrenceRule[]) {
        const ruleBlocks = (allRecurring ?? []).filter(b => b.recurrence_id === rule.id)
        if (!ruleBlocks.length) continue
        const template = normalizeBlock(ruleBlocks[0])
        const originDate = template.start_date
        const explicitDates = new Set(ruleBlocks.map(b => String(b.start_date)))

        const dates = getRecurringDatesInRange(originDate, rule, weekStartStr, weekEndStr)
        for (const date of dates) {
          if (!explicitDates.has(date)) {
            virtual.push({ ...template, id: `virtual-${template.id}-${date}`, start_date: date, end_date: date, is_done: false })
          }
        }
      }

      return [...weekBlocks, ...virtual]
    },
  })
}

export function useCreateBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Block, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase.from('blocks').insert(data).select().single()
      if (error) throw error
      return normalizeBlock(result)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}

export function useCreateRecurringBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ block, rule }: {
      block: Omit<Block, 'id' | 'created_at' | 'updated_at'>
      rule: {
        frequency: RecurrenceRule['frequency']
        days_of_week: number[] | null
        end_type: RecurrenceRule['end_type']
        end_date: string | null
        end_count: number | null
      }
    }) => {
      const { data: ruleRecord, error: e1 } = await supabase
        .from('recurrence_rules')
        .insert({ project_id: block.project_id, ...rule })
        .select()
        .single()
      if (e1) throw e1

      const { data: result, error: e2 } = await supabase
        .from('blocks')
        .insert({ ...block, recurrence_id: ruleRecord.id })
        .select()
        .single()
      if (e2) throw e2
      return normalizeBlock(result)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}

export function useUpdateBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Block> & { id: string }) => {
      if (id.startsWith('virtual-')) return
      const { error } = await supabase
        .from('blocks')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.blocks.all })
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
    mutationFn: async (id: string) => {
      if (id.startsWith('virtual-')) return
      const { error } = await supabase.from('blocks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.blocks.all }),
  })
}
