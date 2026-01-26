import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pocket Places - Test Tracker',
  description: 'Manual testing tracker for Pocket Places app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
