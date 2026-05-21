import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/lib/query-provider'
import { AppProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'ProjectWeek',
  description: '멀티 프로젝트 운영자용 시간관리 캘린더',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full bg-white text-gray-900 antialiased">
        <QueryProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
