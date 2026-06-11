import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Banswara Badri Ashara 1448 — Broadcast',
  description: 'Private video broadcast portal for Banswara Badri Ashara 1448',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
