/**
 * Telegram Domain - Business Rules
 * Pure functions for message formatting and validation
 */

import type { TelegramNotificationPayload, TelegramErrorPayload } from '../types'

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

/**
 * Format an error notification message
 */
export function formatErrorMessage(payload: TelegramErrorPayload): string {
  const timestamp = payload.timestamp.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'UTC',
  })

  // Truncate stack trace if too long (Telegram has 4096 char limit)
  const maxStackLength = 2000
  let stack = payload.stack || 'No stack trace available'
  if (stack.length > maxStackLength) {
    stack = stack.substring(0, maxStackLength) + '\n... (truncated)'
  }

  return `
🚨 <b>Application Error</b>

<b>Message:</b>
<code>${escapeHtml(payload.message)}</code>

📍 <b>URL:</b> ${escapeHtml(payload.url)}
🌐 <b>Environment:</b> ${payload.environment}
🕐 <b>Time:</b> ${timestamp} UTC
${payload.digest ? `🔖 <b>Digest:</b> <code>${escapeHtml(payload.digest)}</code>` : ''}

📱 <b>User Agent:</b>
<code>${escapeHtml(truncateUserAgent(payload.userAgent))}</code>

📋 <b>Stack Trace:</b>
<pre>${escapeHtml(stack)}</pre>
`.trim()
}

/**
 * Truncate user agent string for readability
 */
function truncateUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown'
  if (userAgent.length > 200) {
    return userAgent.substring(0, 200) + '...'
  }
  return userAgent
}
