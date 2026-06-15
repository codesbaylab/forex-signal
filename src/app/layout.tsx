import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import ProgressBarProvider from '@/components/providers/ProgressBarProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ForexSignal — Professional Trading Signals',
  description: 'Real-time forex signals powered by technical analysis. Join thousands of traders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProgressBarProvider>
          {children}
        </ProgressBarProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
