/**
 * Telegram Domain - Business Rules
 * Pure functions for message formatting and validation
 */

import type { TelegramNotificationPayload } from '../types'

/**
 * Format a new tenant notification message
 */
export function formatNewTenantMessage(payload: TelegramNotificationPayload): string {
  const timestamp = payload.createdAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })

  const emoji = getTenantTypeEmoji(payload.tenantType)

  return `
🎉 <b>New Business Created!</b>

${emoji} <b>Business:</b> ${escapeHtml(payload.tenantName)}
📝 <b>Slug:</b> ${escapeHtml(payload.tenantSlug)}
🏷️ <b>Type:</b> ${escapeHtml(payload.tenantType)}
🌍 <b>Country:</b> ${escapeHtml(payload.country)}
👤 <b>Owner:</b> ${escapeHtml(payload.userEmail)}
🕐 <b>Created:</b> ${timestamp} UTC

🔗 <a href="https://klopay.app/m/${escapeHtml(payload.tenantSlug)}">View Menu</a>
`.trim()
}

/**
 * Get emoji based on tenant type
 */
export function getTenantTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    bar: '🍺',
    bakery: '🥐',
    pizzeria: '🍕',
    hotel: '🏨',
    food_truck: '🚚',
    default: '🏪',
  }

  return emojiMap[type.toLowerCase()] || emojiMap.default
}

/**
 * Escape HTML special characters for Telegram HTML mode
 */
export function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Validate notification payload
 */
export function validatePayload(payload: TelegramNotificationPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!payload.tenantId) errors.push('tenantId is required')
  if (!payload.tenantName) errors.push('tenantName is required')
  if (!payload.tenantSlug) errors.push('tenantSlug is required')
  if (!payload.userEmail) errors.push('userEmail is required')

  return {
    valid: errors.length === 0,
    errors,
  }
}
