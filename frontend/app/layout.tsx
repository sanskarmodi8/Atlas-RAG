import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AtlasRAG - Multi-Document Research Assistant',
  description: 'Powered by hybrid Graph-RAG retrieval',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
