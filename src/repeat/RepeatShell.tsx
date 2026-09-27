import { Outlet } from 'react-router-dom'
import { SiteHeader } from '@repeat/components/SiteHeader'

export function RepeatShell() {
  return (
    <div className="repeat-app min-h-full">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
