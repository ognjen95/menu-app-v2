'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import type { 
  Menu, 
  Category, 
  MenuItem, 
  ItemVariant, 
  OptionGroup, 
  ItemOption,
  Allergen,
  MenuWithCategories,
  MenuItemWithRelations,
  CategoryWithItems
} from '@/lib/types'

// Query keys
export const menuKeys = {
  all: ['menu'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: (locationId?: string) => [...menuKeys.lists(), { locationId }] as const,
  detail: (id: string) => [...menuKeys.all, 'detail', id] as const,
  categories: (menuId: string) => [...menuKeys.all, 'categories', menuId] as const,
  items: (categoryId: string) => [...menuKeys.all, 'items', categoryId] as const,
  item: (id: string) => [...menuKeys.all, 'item', id] as const,
  allergens: () => [...menuKeys.all, 'allergens'] as const,
  full: (menuId: string) => [...menuKeys.all, 'full', menuId] as const,
}

// Types for API responses
type MenusResponse = { data: {menus: Menu[] } }
type MenuResponse = { menu: Menu }
type CategoriesResponse = { data: {categories: Category[] } }
type CategoryResponse = { category: Category }
type ItemsResponse = { data: {items: MenuItem[] } }
type ItemResponse = { item: MenuItemWithRelations }
type AllergensResponse = { data: {allergens: Allergen[] } }
type FullMenuResponse = { menu: MenuWithCategories }

// Menu hooks
export function useMenus(locationId?: string) {
  return useQuery({
    queryKey: menuKeys.list(locationId),
    queryFn: () => apiGet<MenusResponse>('/menu', locationId ? { location_id: locationId } : undefined),
  })
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: () => apiGet<MenuResponse>(`/menu/${id}`),
    enabled: !!id,
  })
}

export function useFullMenu(menuId: string) {
  return useQuery({
    queryKey: menuKeys.full(menuId),
    queryFn: () => apiGet<FullMenuResponse>(`/menu/${menuId}/full`),
    enabled: !!menuId,
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Menu>) => apiPost<MenuResponse>('/menu', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Menu> & { id: string }) =>
      apiPut<MenuResponse>(`/menu/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(variables.id) })
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiDelete<{ success: boolean }>(`/menu/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() })
    },
  })
}

// Category hooks
export function useCategories(menuId: string) {
  return useQuery({
    queryKey: menuKeys.categories(menuId),
    queryFn: () => apiGet<CategoriesResponse>(`/menu/${menuId}/categories`),
    enabled: !!menuId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ menuId, ...data }: Partial<Category> & { menuId: string }) =>
      apiPost<CategoryResponse>(`/menu/${menuId}/categories`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories(variables.menuId) })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, menuId, ...data }: Partial<Category> & { id: string; menuId: string }) =>
      apiPut<CategoryResponse>(`/menu/categories/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories(variables.menuId) })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, menuId }: { id: string; menuId: string }) =>
      apiDelete<{ success: boolean }>(`/menu/categories/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories(variables.menuId) })
    },
  })
}

// Item hooks
export function useMenuItems(categoryId: string) {
  return useQuery({
    queryKey: menuKeys.items(categoryId),
    queryFn: () => apiGet<ItemsResponse>(`/menu/categories/${categoryId}/items`),
    enabled: !!categoryId,
  })
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: menuKeys.item(id),
    queryFn: () => apiGet<ItemResponse>(`/menu/items/${id}`),
    enabled: !!id,
  })
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, ...data }: Partial<MenuItem> & { categoryId: string }) =>
      apiPost<ItemResponse>(`/menu/categories/${categoryId}/items`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.items(variables.categoryId) })
    },
  })
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, categoryId, ...data }: Partial<MenuItem> & { id: string; categoryId: string }) =>
      apiPut<ItemResponse>(`/menu/items/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.items(variables.categoryId) })
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.id) })
    },
  })
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      apiDelete<{ success: boolean }>(`/menu/items/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.items(variables.categoryId) })
    },
  })
}

// Allergens hook (global data)
export function useAllergens() {
  return useQuery({
    queryKey: menuKeys.allergens(),
    queryFn: () => apiGet<AllergensResponse>('/menu/allergens'),
    staleTime: 30 * 60 * 1000, // 30 minutes - allergens rarely change
  })
}

// Variant hooks
export function useCreateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, ...data }: Partial<ItemVariant> & { itemId: string }) =>
      apiPost<{ variant: ItemVariant }>(`/menu/items/${itemId}/variants`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.itemId) })
    },
  })
}

export function useUpdateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, itemId, ...data }: Partial<ItemVariant> & { id: string; itemId: string }) =>
      apiPut<{ variant: ItemVariant }>(`/menu/variants/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.itemId) })
    },
  })
}

export function useDeleteVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      apiDelete<{ success: boolean }>(`/menu/variants/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.itemId) })
    },
  })
}

// Option group hooks
export function useCreateOptionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, ...data }: Partial<OptionGroup> & { itemId: string }) =>
      apiPost<{ group: OptionGroup }>(`/menu/items/${itemId}/option-groups`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.itemId) })
    },
  })
}

export function useUpdateOptionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, itemId, ...data }: Partial<OptionGroup> & { id: string; itemId: string }) =>
      apiPut<{ group: OptionGroup }>(`/menu/option-groups/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.itemId) })
    },
  })
}

// Option hooks
export function useCreateOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, itemId, ...data }: Partial<ItemOption> & { groupId: string; itemId: string }) =>
      apiPost<{ option: ItemOption }>(`/menu/option-groups/${groupId}/options`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.item(variables.itemId) })
    },
  })
}
