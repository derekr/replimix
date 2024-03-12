import { Outlet } from '@remix-run/react'

export default function AppLayout() {
  return (
    <div>
      App Layout
      <Outlet />
    </div>
  )
}
