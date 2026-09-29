export interface User {
  user_id: number
  name: string
  email: string
}

export interface Category {
  category_id: number
  name: string
}

export interface Clothing {
  clothing_id: number
  user_id: number
  category_id: number
  name: string
  color: string | null
  size: string | null
  image_url: string | null
}

export interface ClothingInput {
  user_id: number
  category_id: number
  name: string
  color: string | null
  size: string | null
  image_url: string | null
}

export interface Outfit {
  outfit_id: number
  user_id: number
  name: string
  description: string | null
}

export interface OutfitInput {
  user_id: number
  name: string
  description: string | null
}

export interface OutfitItem {
  outfit_item_id: number
  outfit_id: number
  clothing_id: number
}

export interface MutationResponse {
  message: string
  affectedRows?: number
  user_id?: number
  category_id?: number
  clothing_id?: number
  outfit_id?: number
  outfit_item_id?: number
}