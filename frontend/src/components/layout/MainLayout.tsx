import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setSidebarCollapsed((current) => !current)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none fixed right-0 top-0 h-[36rem] w-[36rem] rounded-full bg-red-600/[0.03] blur-[180px]" />
          <div className="pointer-events-none fixed bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-red-900/[0.03] blur-[160px]" />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
