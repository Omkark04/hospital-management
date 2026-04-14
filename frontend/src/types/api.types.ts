/**
 * Global TypeScript types for API responses.
 */

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  current_page: number
  results: T[]
}

export interface ApiError {
  success: false
  error: {
    code: number
    message: string
    details: Record<string, string[]>
  }
}

export interface ApiSuccess<T> {
  success: true
  data: T
}
