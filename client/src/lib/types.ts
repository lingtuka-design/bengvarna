export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  color: string
  sort_order: number
  is_active: boolean
  article_count?: number
}

export interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  content?: string
  cover_image_url: string
  social_image_url: string
  category_id: number | null
  category_name?: string | null
  category_slug?: string | null
  author: string
  status: ArticleStatus
  seo_title: string
  seo_description: string
  published_at: string | null
  created_at: string
  updated_at: string
  featured_position: number | null
}

export interface ArticleList {
  items: Article[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ArticleInput {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string
  social_image_url: string
  category_id: number | null
  author: string
  status: ArticleStatus
  seo_title: string
  seo_description: string
  published_at?: string | null
}

export interface FeaturedData {
  primary: Article | null
  secondary: Article[]
}

export interface MediaItem {
  id: number
  object_key: string
  original_name: string
  content_type: string
  size: number
  alt_text: string
  url: string
  created_at?: string
}

export interface MediaList {
  items: MediaItem[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface SiteSettings {
  site_name: string
  site_description: string
  logo_url: string
  default_social_image: string
  default_seo_title: string
  default_seo_description: string
}

export interface SessionInfo {
  authenticated: boolean
  username?: string
}

export interface Stats {
  total_articles: number
  published: number
  drafts: number
  archived: number
  categories: number
  featured: number
  media: number
  recent: Article[]
}

export interface Bootstrap {
  settings: SiteSettings
  categories: Category[]
}
