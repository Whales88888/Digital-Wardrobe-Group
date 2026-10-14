export interface User {
  user_id: number
  name: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthResponse {
  user: User
}

export interface Category {
  category_id: number
  name: string
}

export interface CategoryUsage {
  category_id: number
  count: number
}

export interface Clothing {
  clothing_id: number
  user_id: number
  category_id: number
  name: string
  color: string | null
  size: string | null
  image_url: string | null
  season: ClothingSeason | null
  clothing_type: ClothingType | null
  care_instructions: string | null
  last_washed_at: string | null
  wash_after_wears: number
}

export const clothingSeasons = ['spring', 'summer', 'autumn', 'winter', 'all-season'] as const
export type ClothingSeason = (typeof clothingSeasons)[number]

export const clothingTypes = ['top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessory'] as const
export type ClothingType = (typeof clothingTypes)[number]

export interface ClothingInput {
  category_id: number
  name: string
  color: string | null
  size: string | null
  image_url: string | null
  season: ClothingSeason | null
  clothing_type: ClothingType | null
  care_instructions: string | null
  last_washed_at: string | null
  wash_after_wears: number
}

export interface ClothingListFilters {
  page?: number
  page_size?: number
  category_id?: number
  season?: ClothingSeason
  clothing_type?: ClothingType
  search?: string
  sort?: 'name' | 'color'
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type AdminUser = User;

export type AdminUserPage = PaginatedResult<AdminUser>;

export interface Outfit {
  outfit_id: number
  user_id: number
  name: string
  description: string | null
}

export interface OutfitInput {
  name: string
  description: string | null
}

export interface OutfitItem {
  outfit_item_id: number
  outfit_id: number
  clothing_id: number
}

export interface WearLog {
  wear_log_id: number
  worn_on: string
  note: string | null
  outfit_id: number | null
  outfit_name: string | null
  clothing_names: string
  clothing_ids: string
}

export interface OutfitPlan {
  outfit_plan_id: number
  outfit_id: number
  planned_for: string
  occasion: string | null
  note: string | null
  outfit_name: string
}

export interface WardrobeRecommendation {
  season: ClothingSeason
  recommendations: {
    items: Pick<Clothing, 'clothing_id' | 'name' | 'color' | 'clothing_type'>[]
    reason: string
  }[]
}

export interface WardrobeDashboard {
  total_clothing: number
  unworn_count: number
  unworn_percent: number
  categories: { category_id: number; name: string; count: number }[]
  seasons: { season: string; count: number }[]
  most_worn: { clothing_id: number; name: string; wear_count: number } | null
  least_worn: { clothing_id: number; name: string; wear_count: number } | null
  recent_logs: WearLog[]
  upcoming_plans: { outfit_plan_id: number; planned_for: string; occasion: string | null; outfit_name: string }[]
  care_due: { clothing_id: number; name: string; wash_after_wears: number; wears_since_wash: number }[]
  current_season: ClothingSeason
}
