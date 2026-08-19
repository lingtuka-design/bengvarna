import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, qs } from './api'
import type {
  Article,
  ArticleList,
  Bootstrap,
  Category,
  FeaturedData,
  MediaList,
  SessionInfo,
  SiteSettings,
  Stats,
} from './types'

export interface ArticleQueryParams {
  page?: number
  perPage?: number
  category?: string
  q?: string
  status?: string
  all?: boolean
  featured?: boolean
}

export function useBootstrap() {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: () => api.get<Bootstrap>('/api/bootstrap'),
  })
}

export function useCategories(all = false) {
  return useQuery({
    queryKey: ['categories', all],
    queryFn: () => api.get<Category[]>(`/api/categories${qs({ all: all ? 1 : undefined })}`),
  })
}

export function useFeatured() {
  return useQuery({
    queryKey: ['featured'],
    queryFn: () => api.get<FeaturedData>('/api/featured'),
  })
}

export function useArticles(params: ArticleQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => api.get<ArticleList>(`/api/articles${qs(params as Record<string, string | number | boolean | undefined>)}`),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.get<Article>(`/api/articles/${encodeURIComponent(slug ?? '')}`),
    enabled: Boolean(slug),
    retry: false,
  })
}

export function useAdminArticle(id: number | undefined) {
  return useQuery({
    queryKey: ['adminArticle', id],
    queryFn: () => api.get<Article>(`/api/admin/articles/${id}`),
    enabled: Boolean(id),
  })
}

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => api.get<SessionInfo>('/api/auth/session'),
    retry: false,
    refetchOnWindowFocus: true,
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/api/stats'),
  })
}

export function useMedia(page = 1) {
  return useQuery({
    queryKey: ['media', page],
    queryFn: () => api.get<MediaList>(`/api/media${qs({ page, perPage: 24 })}`),
    placeholderData: keepPreviousData,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<SiteSettings>('/api/settings'),
  })
}
