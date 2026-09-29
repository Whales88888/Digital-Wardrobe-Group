import { jsonBody, request } from './http'
import type {
  Category,
  Clothing,
  ClothingInput,
  MutationResponse,
  Outfit,
  OutfitInput,
  OutfitItem,
  User,
} from './types'

export const usersApi = {
  list: () => request<User[]>('/users'),
}

export const categoriesApi = {
  list: () => request<Category[]>('/categories'),
  create: (name: string) => request<MutationResponse>('/categories', {
    method: 'POST',
    body: jsonBody({ name }),
  }),
  update: (id: number, name: string) => request<MutationResponse>(`/categories/${id}`, {
    method: 'PUT',
    body: jsonBody({ name }),
  }),
  remove: (id: number) => request<MutationResponse>(`/categories/${id}`, {
    method: 'DELETE',
  }),
}

export const clothingApi = {
  list: () => request<Clothing[]>('/clothing'),
  get: (id: number) => request<Clothing>(`/clothing/${id}`),
  create: (data: ClothingInput) => request<MutationResponse>('/clothing', {
    method: 'POST',
    body: jsonBody(data),
  }),
  update: (id: number, data: ClothingInput) => request<MutationResponse>(`/clothing/${id}`, {
    method: 'PUT',
    body: jsonBody(data),
  }),
  remove: (id: number) => request<MutationResponse>(`/clothing/${id}`, {
    method: 'DELETE',
  }),
}

export const outfitsApi = {
  list: () => request<Outfit[]>('/outfits'),
  create: (data: OutfitInput) => request<MutationResponse>('/outfits', {
    method: 'POST',
    body: jsonBody(data),
  }),
  update: (id: number, data: OutfitInput) => request<MutationResponse>(`/outfits/${id}`, {
    method: 'PUT',
    body: jsonBody(data),
  }),
  remove: (id: number) => request<MutationResponse>(`/outfits/${id}`, {
    method: 'DELETE',
  }),
}

export const outfitItemsApi = {
  list: () => request<OutfitItem[]>('/outfit-items'),
  create: (outfit_id: number, clothing_id: number) => request<MutationResponse>('/outfit-items', {
    method: 'POST',
    body: jsonBody({ outfit_id, clothing_id }),
  }),
  remove: (id: number) => request<MutationResponse>(`/outfit-items/${id}`, {
    method: 'DELETE',
  }),
}

async function deleteRecordWithLinks(links: OutfitItem[], removeRecord: () => Promise<MutationResponse>): Promise<void> {
  const removed: OutfitItem[] = []
  try {
    for (const link of links) {
      const result = await outfitItemsApi.remove(link.outfit_item_id)
      if (result.affectedRows !== 1) throw new Error('An outfit link changed before deletion. Refresh and try again.')
      removed.push(link)
    }

    const result = await removeRecord()
    if (result.affectedRows !== 1) throw new Error('The record no longer exists. Refresh and try again.')
  } catch (error) {
    let restoreFailed = false
    for (const link of removed.reverse()) {
      try {
        await outfitItemsApi.create(link.outfit_id, link.clothing_id)
      } catch {
        restoreFailed = true
      }
    }
    if (restoreFailed) {
      throw new Error('The delete did not complete and some outfit links could not be restored. Refresh and verify the outfit relationships.', { cause: error })
    }
    throw error
  }
}

export function deleteClothingWithOutfitItems(clothingId: number, links: OutfitItem[]): Promise<void> {
  return deleteRecordWithLinks(links, () => clothingApi.remove(clothingId))
}

export function deleteOutfitWithItems(outfitId: number, links: OutfitItem[]): Promise<void> {
  return deleteRecordWithLinks(links, () => outfitsApi.remove(outfitId))
}