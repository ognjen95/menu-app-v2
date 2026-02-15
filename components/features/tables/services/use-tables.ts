import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import type { Table, QrCode, TableFormData, QrStyle } from '../domains/types'
import type { Location } from '@/lib/types'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
    select: (data) => data?.data?.locations || [],
  })
}

export function useTables(locationId: string | null) {
  return useQuery({
    queryKey: ['tables', locationId],
    queryFn: () => apiGet<{ data: { tables: Table[] } }>('/tables', { location_id: locationId! }),
    enabled: !!locationId,
    select: (data) => data?.data?.tables || [],
  })
}

export function useQrCodes(locationId: string | null) {
  return useQuery({
    queryKey: ['qr-codes', locationId],
    queryFn: () => apiGet<{ data: { qr_codes: QrCode[] } }>('/qr-codes', { location_id: locationId! }),
    enabled: !!locationId,
    select: (data) => data?.data?.qr_codes || [],
  })
}

export function useCreateTable(locationId: string | null, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: TableFormData) => apiPost<{ table: Table }>('/tables', {
      location_id: locationId,
      name: data.name,
      capacity: parseInt(data.capacity) || 4,
      zone: data.zone || undefined,
      status: 'available',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', locationId] })
      onSuccess?.()
    },
  })
}

export function useDeleteTable(locationId: string | null) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', locationId] })
    },
  })
}

export function useGenerateQrCode(locationId: string | null) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (tableId: string) => apiPost<{ qr_code: QrCode }>('/qr-codes', {
      location_id: locationId,
      table_id: tableId,
      type: 'table',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', locationId] })
    },
  })
}

export function useUpdateQrStyle(locationId: string | null, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, style }: { id: string; style: QrStyle }) =>
      apiPut<{ qr_code: QrCode }>(`/qr-codes/${id}`, { style }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', locationId] })
      onSuccess?.()
    },
  })
}

export function useDeleteQrCode(locationId: string | null) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/qr-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', locationId] })
    },
  })
}
