import { jsonBody, request } from './http'
import type {
  Category,
  CategoryUsage,
  Clothing,
  ClothingInput,
  ClothingListFilters,
  PaginatedResult,
  AuthResponse,
  Outfit,
  OutfitInput,
  OutfitItem,
  OutfitPlan,
  WearLog,
  WardrobeDashboard,
  WardrobeRecommendation,
  User,
  AdminUserPage,
} from './types'

export const authApi = {
  session: () => request<AuthResponse>('/auth/session'),
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: jsonBody({ email, password }),
  }),
  register: (name: string, email: string, password: string) => request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: jsonBody({ name, email, password }),
  }),
  logout: () => request<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  }),
  changePassword: (current_password: string, new_password: string) => request<{ success: boolean }>('/auth/change-password', {
    method: 'POST',
    body: jsonBody({ current_password, new_password }),
  }),
  forgotPassword: (email: string) => request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: jsonBody({ email }),
  }),
  resetPassword: (token: string, password: string) => request<{ success: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: jsonBody({ token, password }),
  }),
}

export const userApi = {
  updateProfile: (data: { name?: string; email?: string }) => request<User>('/user/me', {
    method: 'PATCH',
    body: jsonBody(data),
  }),
}

export const adminUsersApi = {
  list: (page: number, page_size = 20) =>
    request<AdminUserPage>(`/user/admin?page=${page}&page_size=${page_size}`),
  changeRole: (id: number, role: 'user' | 'admin') =>
    request(`/user/admin/${id}/role`, {
      method: 'PATCH',
      body: jsonBody({ role }),
    }),
  remove: (id: number) => request<void>(`/user/admin/${id}`, { method: 'DELETE' }),
}

export const categoriesApi = {
  list: () => request<Category[]>('/category'),
  page: (page: number, page_size = 12) =>
    request<PaginatedResult<Category>>(`/category/page?page=${page}&page_size=${page_size}`),
  usage: () => request<CategoryUsage[]>('/category/usage'),
  create: (name: string) => request<Category>('/category', {
    method: 'POST',
    body: jsonBody({ name }),
  }),
  update: (id: number, name: string) => request<Category>(`/category/${id}`, {
    method: 'PATCH',
    body: jsonBody({ name }),
  }),
  remove: (id: number) => request<void>(`/category/${id}`, {
    method: 'DELETE',
  }),
}

export const clothingApi = {
  list: (filters: ClothingListFilters = {}) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) query.set(key, String(value))
    }
    const suffix = query.size ? `?${query.toString()}` : ''
    return request<PaginatedResult<Clothing>>(`/clothing${suffix}`)
  },
  uploadImage: (image: File) => {
    const body = new FormData()
    body.set('image', image)
    return request<{ image_url: string }>('/clothing/images', {
      method: 'POST',
      body,
    })
  },
  get: (id: number) => request<Clothing>(`/clothing/${id}`),
  create: (data: ClothingInput) => request<Clothing>('/clothing', {
    method: 'POST',
    body: jsonBody(data),
  }),
  update: (id: number, data: ClothingInput) => request<Clothing>(`/clothing/${id}`, {
    method: 'PATCH',
    body: jsonBody(data),
  }),
  remove: (id: number) => request<void>(`/clothing/${id}`, {
    method: 'DELETE',
  }),
}

export const outfitsApi = {
  list: () => request<Outfit[]>('/outfit'),
  page: (page: number, page_size = 12) =>
    request<PaginatedResult<Outfit>>(`/outfit/page?page=${page}&page_size=${page_size}`),
  get: (id: number) => request<Outfit>(`/outfit/${id}`),
  create: (data: OutfitInput) => request<Outfit>('/outfit', {
    method: 'POST',
    body: jsonBody(data),
  }),
  update: (id: number, data: OutfitInput) => request<Outfit>(`/outfit/${id}`, {
    method: 'PATCH',
    body: jsonBody(data),
  }),
  remove: (id: number) => request<void>(`/outfit/${id}`, {
    method: 'DELETE',
  }),
}

export const outfitItemsApi = {
  list: () => request<OutfitItem[]>('/outfit-item'),
  get: (id: number) => request<OutfitItem>(`/outfit-item/${id}`),
  create: (outfit_id: number, clothing_id: number) => request<OutfitItem>('/outfit-item', {
    method: 'POST',
    body: jsonBody({ outfit_id, clothing_id }),
  }),
  update: (id: number, data: { outfit_id?: number; clothing_id?: number }) => request<OutfitItem>(`/outfit-item/${id}`, {
    method: 'PATCH',
    body: jsonBody(data),
  }),
  remove: (id: number) => request<void>(`/outfit-item/${id}`, {
    method: 'DELETE',
  }),
}

export const activityApi = {
  dashboard: () => request<WardrobeDashboard>('/activity/dashboard'),
  recommendations: () => request<WardrobeRecommendation>('/activity/recommendations'),
  logs: () => request<WearLog[]>('/activity/logs'),
  createLog: (data: { worn_on: string; clothing_ids: number[]; outfit_id: number | null; note: string | null }) =>
    request<WearLog>('/activity/logs', { method: 'POST', body: jsonBody(data) }),
  removeLog: (id: number) => request<void>(`/activity/logs/${id}`, { method: 'DELETE' }),
  plans: (filters: { from: string; to: string }) => {
    const query = new URLSearchParams()
    if (filters.from) query.set('from', filters.from)
    if (filters.to) query.set('to', filters.to)
    return request<OutfitPlan[]>(`/activity/plans${query.size ? `?${query}` : ''}`)
  },
  createPlan: (data: { outfit_id: number; planned_for: string; occasion: string | null; note: string | null }) =>
    request<OutfitPlan>('/activity/plans', { method: 'POST', body: jsonBody(data) }),
  updatePlan: (id: number, data: { outfit_id: number; planned_for: string; occasion: string | null; note: string | null }) =>
    request<OutfitPlan>(`/activity/plans/${id}`, { method: 'PATCH', body: jsonBody(data) }),
  removePlan: (id: number) => request<void>(`/activity/plans/${id}`, { method: 'DELETE' }),
  updateLog: (id: number, data: { worn_on: string; clothing_ids: number[]; outfit_id: number | null; note: string | null }) =>
    request<WearLog>(`/activity/logs/${id}`, { method: 'PATCH', body: jsonBody(data) }),
  updateCare: (id: number, data: { care_instructions?: string | null; last_washed_at?: string | null; wash_after_wears?: number }) =>
    request<Clothing>(`/activity/clothing/${id}/care`, { method: 'PATCH', body: jsonBody(data) }),
}

export async function listAllClothing(pageSize = 100): Promise<Clothing[]> {
  const firstPage = await clothingApi.list({ page: 1, page_size: pageSize })
  if (firstPage.total_pages <= 1) return firstPage.items
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.total_pages - 1 }, (_, index) =>
      clothingApi.list({ page: index + 2, page_size: pageSize }),
    ),
  )
  return [firstPage, ...remainingPages].flatMap((page) => page.items)
}
