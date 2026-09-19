import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { BottomTabBar } from './BottomTabBar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-darkbg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomTabBar />
    </div>
  )
}
