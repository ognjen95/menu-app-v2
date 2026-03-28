/**
 * Telegram Notification System - Main Entry Point
 * Provides factory function for creating the notification service
 */

import { TelegramAdapter } from './infrastructure/telegram.adapter'
import { TelegramNotificationService } from './services/telegram.service'
import { loadTelegramConfig, isTelegramConfigured } from './infrastructure/telegram.config'
import type { ITelegramNotificationService, TelegramNotificationPayload, TelegramErrorPayload, TelegramSendResult } from './types'

// Re-export types
export type { TelegramNotificationPayload, TelegramErrorPayload, TelegramSendResult, ITelegramNotificationService }

// Singleton instance
let serviceInstance: ITelegramNotificationService | null = null

/**
 * Get or create the Telegram notification service instance
 */
export function getTelegramNotificationService(): ITelegramNotificationService {
  if (!serviceInstance) {
    const config = loadTelegramConfig()
    const adapter = new TelegramAdapter(config)
    serviceInstance = new TelegramNotificationService(adapter, config)
  }
  return serviceInstance
}

/**
 * Check if Telegram notifications are configured
 */
export function isTelegramEnabled(): boolean {
  const config = loadTelegramConfig()
  return isTelegramConfigured(config)
}

/**
 * Convenience function to notify about a new tenant
 * Use this directly in route handlers
 */
export async function notifyNewTenantCreated(payload: TelegramNotificationPayload): Promise<TelegramSendResult> {
  const service = getTelegramNotificationService()
  return service.notifyNewTenant(payload)
}

/**
 * Convenience function to notify about application errors
 * Use this directly in route handlers or error boundaries
 */
export async function notifyApplicationError(payload: TelegramErrorPayload): Promise<TelegramSendResult> {
  const service = getTelegramNotificationService()
  return service.notifyError(payload)
}
