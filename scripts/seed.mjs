import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qrnwlsjqockoseerncjh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybndsc2pxb2Nrb3NlZXJuY2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTQ4MDMsImV4cCI6MjA5NDkzMDgwM30.MktQLfpE_9GC_Yek0qZisyVbLs-oXQScgNvqFZDYqmE'
)

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

async function seed() {
  // 기존 데이터 삭제
  await supabase.from('blocks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('core_time_ranges').delete().eq('user_id', 'default-user')

  // 프로젝트
  const { data: projects, error: pErr } = await supabase
    .from('projects')
    .insert([
      { name: '토플', color: 'pink', position: 0 },
      { name: 'PM 학습', color: 'amber', position: 1 },
      { name: '학원앱', color: 'green', position: 2 },
      { name: '교사앱', color: 'blue', position: 3 },
      { name: '운동', color: 'orange', position: 4 },
    ])
    .select()
  if (pErr) { console.error('projects error:', pErr); process.exit(1) }
  console.log('✓ projects:', projects.map(p => p.name))

  const p = Object.fromEntries(projects.map(p => [p.name, p.id]))

  // 할일
  const { data: tasks, error: tErr } = await supabase
    .from('tasks')
    .insert([
      { project_id: p['토플'], title: '스피킹 연습', position: 0 },
      { project_id: p['토플'], title: '리딩 문제풀기', position: 1 },
      { project_id: p['PM 학습'], title: '케이스 스터디', position: 0 },
      { project_id: p['학원앱'], title: '경쟁사 조사', position: 0 },
      { project_id: p['학원앱'], title: '포지셔닝 정리', position: 1 },
      { project_id: p['운동'], title: '헬스', position: 0 },
    ])
    .select()
  if (tErr) { console.error('tasks error:', tErr); process.exit(1) }
  console.log('✓ tasks:', tasks.map(t => t.title))

  const t = Object.fromEntries(tasks.map(t => [t.title, t.id]))

  // 블록
  const { error: bErr } = await supabase.from('blocks').insert([
    { project_id: p['토플'], task_id: t['스피킹 연습'], title: '스피킹 연습', start_date: today(), end_date: today(), start_time: '14:00', end_time: '15:30', is_done: true },
    { project_id: p['PM 학습'], task_id: t['케이스 스터디'], title: '케이스 스터디', start_date: today(1), end_date: today(1), start_time: null, end_time: null, is_done: false },
    { project_id: p['운동'], task_id: t['헬스'], title: '헬스', start_date: today(), end_date: today(), start_time: '06:30', end_time: '07:30', is_done: false },
  ])
  if (bErr) { console.error('blocks error:', bErr); process.exit(1) }
  console.log('✓ blocks')

  // 코어타임
  const { error: cErr } = await supabase.from('core_time_ranges').insert([
    { user_id: 'default-user', start_time: '14:00', end_time: '17:00', position: 0 },
    { user_id: 'default-user', start_time: '20:30', end_time: '22:00', position: 1 },
  ])
  if (cErr) { console.error('core_time error:', cErr); process.exit(1) }
  console.log('✓ core_time_ranges')

  console.log('\n🎉 완료! 앱을 새로고침하세요.')
}

seed()
