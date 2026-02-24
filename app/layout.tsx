import './globals.css'
import React from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export const metadata = {
  title: 'Xartup VC Intelligence',
  description: 'Thesis-driven VC intelligence scaffold'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar persists across routes by being placed here in layout */}
          <Sidebar />

          <div className="flex-1 flex flex-col">
            <Header />
            <main className="p-6">
              <div className="container">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
