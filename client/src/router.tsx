import { lazy, Suspense } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, Navigate } from '@tanstack/react-router'
import { PublicLayout } from './components/public/Layout'
import { AdminLayout } from './components/admin/AdminLayout'
import { NotFoundPage } from './routes/NotFoundPage'
import { PageSkeleton, FullScreenLoader } from './components/ui/Skeleton'

function parsePage(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
}

function lazyPage(loader: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(loader)
  return function Page() {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Component />
      </Suspense>
    )
  }
}

function lazyAdminPage(loader: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(loader)
  return function Page() {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Component />
      </Suspense>
    )
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
})

const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: PublicLayout,
})

const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/',
  component: lazyPage(() => import('./routes/HomePage').then((m) => ({ default: m.HomePage }))),
})

const newsRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/news',
  validateSearch: (s: Record<string, unknown>) => ({ page: parsePage(s.page) }),
  component: lazyPage(() => import('./routes/NewsPage').then((m) => ({ default: m.NewsPage }))),
})

const categoryRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/category/$slug',
  validateSearch: (s: Record<string, unknown>) => ({ page: parsePage(s.page) }),
  component: lazyPage(() => import('./routes/CategoryPage').then((m) => ({ default: m.CategoryPage }))),
})

const articleRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/article/$slug',
  component: lazyPage(() => import('./routes/ArticlePage').then((m) => ({ default: m.ArticlePage }))),
})

const searchRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/search',
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === 'string' ? s.q : '',
    page: parsePage(s.page),
  }),
  component: lazyPage(() => import('./routes/SearchPage').then((m) => ({ default: m.SearchPage }))),
})

const aboutRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: '/about',
  component: lazyPage(() => import('./routes/AboutPage').then((m) => ({ default: m.AboutPage }))),
})

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
})

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: () => <Navigate to="/admin/dashboard" replace />,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/dashboard',
  component: lazyAdminPage(() => import('./routes/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))),
})

const adminArticlesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/articles',
  component: lazyAdminPage(() => import('./routes/admin/AdminArticles').then((m) => ({ default: m.AdminArticles }))),
})

const adminArticleNewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/articles/new',
  component: lazyAdminPage(() => import('./routes/admin/AdminArticleEdit').then((m) => ({ default: m.AdminArticleEdit }))),
})

const adminArticleEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/articles/$id/edit',
  component: lazyAdminPage(() => import('./routes/admin/AdminArticleEdit').then((m) => ({ default: m.AdminArticleEdit }))),
})

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/categories',
  component: lazyAdminPage(() => import('./routes/admin/AdminCategories').then((m) => ({ default: m.AdminCategories }))),
})

const adminMediaRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/media',
  component: lazyAdminPage(() => import('./routes/admin/AdminMedia').then((m) => ({ default: m.AdminMedia }))),
})

const adminFeaturedRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/featured',
  component: lazyAdminPage(() => import('./routes/admin/AdminFeatured').then((m) => ({ default: m.AdminFeatured }))),
})

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/settings',
  component: lazyAdminPage(() => import('./routes/admin/AdminSettings').then((m) => ({ default: m.AdminSettings }))),
})

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  component: lazyPage(() => import('./routes/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))),
})

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([homeRoute, newsRoute, categoryRoute, articleRoute, searchRoute, aboutRoute]),
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminArticlesRoute,
    adminArticleNewRoute,
    adminArticleEditRoute,
    adminCategoriesRoute,
    adminMediaRoute,
    adminFeaturedRoute,
    adminSettingsRoute,
  ]),
  adminLoginRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
