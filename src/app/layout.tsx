import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'みんなでクイズ！',
  description: 'リアルタイムクイズゲーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
