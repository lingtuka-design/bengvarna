import { Outlet } from '@tanstack/react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
