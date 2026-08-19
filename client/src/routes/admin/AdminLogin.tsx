import { useState } from 'react'
import { Navigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from '../../router'
import { api } from '../../lib/api'
import { useSession } from '../../lib/queries'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Skeleton'
import { Icon } from '../../components/ui/Icon'
import { Logo } from '../../components/public/Logo'

export function AdminLogin() {
  const { redirect } = useSearch({ from: '/admin/login' })
  const { data: session, isLoading } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: () => api.post<{ authenticated: boolean; username: string }>('/api/auth/login', { username, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
      const target = redirect && redirect.startsWith('/admin') ? redirect : '/admin/dashboard'
      router.navigate({ to: target as '/admin/dashboard' })
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Login failed'),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (session?.authenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="text-3xl" />
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Sign in to the newsroom</p>
        </div>
        <form
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            login.mutate()
          }}
        >
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <Icon name="alert" className="size-4 shrink-0" />
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
          {import.meta.env.DEV && (
            <p className="text-center text-xs text-stone-400 dark:text-stone-500">
              Dev default — username: <code>admin</code>, password: <code>admin1234</code>
            </p>
          )}
        </form>
        <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-500">
          This area is for editors only. <span className="underline underline-offset-2">Continue to the public site</span>
        </p>
      </div>
    </div>
  )
}
