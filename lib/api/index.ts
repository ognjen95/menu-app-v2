// API utilities for client-side data fetching

const API_BASE = '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new ApiError(response.status, response.statusText, error.error || 'An error occurred')
  }
  return response.json()
}

export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value)
      }
    })
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  return handleResponse<T>(response)
}

export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiPatch<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  return handleResponse<T>(response)
}
