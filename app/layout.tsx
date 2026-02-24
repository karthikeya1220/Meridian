import './globals.css'
import React from 'react'
import ClientShell from '../components/ClientShell'

export const metadata = {
  title: 'Xartup VC Intelligence',
  description: 'Thesis-driven VC intelligence scaffold'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ClientShell is a client component that provides header, sidebar and providers */}
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  )
}
