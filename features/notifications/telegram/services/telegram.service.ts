/**
 * Telegram Application - Notification Service
 * Orchestrates domain rules and infrastructure adapter
 */

import type {
  TelegramNotificationPayload,
  TelegramErrorPayload,
  TelegramSendResult,
  ITelegramAdapter,
  ITelegramNotificationService,
  TelegramConfig,
} from '../types'
import { formatNewTenantMessage, formatErrorMessage, validatePayload } from '../domain/telegram.rules'

export class TelegramNotificationService implements ITelegramNotificationService {
  private adapter: ITelegramAdapter
  private chatId: string

  constructor(adapter: ITelegramAdapter, config: TelegramConfig) {
    this.adapter = adapter
    this.chatId = config.chatId
  }

  /**
   * Send notification when a new tenant is created
   */
  async notifyNewTenant(payload: TelegramNotificationPayload): Promise<TelegramSendResult> {
    // Validate payload
    const validation = validatePayload(payload)
    if (!validation.valid) {
      console.warn('[Telegram] Invalid payload:', validation.errors)
      return {
        success: false,
        error: `Invalid payload: ${validation.errors.join(', ')}`,
      }
    }

    // Format the message
    const messageText = formatNewTenantMessage(payload)

    // Send via adapter
    const result = await this.adapter.sendMessage({
      chatId: this.chatId,
      text: messageText,
      parseMode: 'HTML',
      disableWebPagePreview: false,
    })

    if (!result.success) {
      console.error('[Telegram] Failed to notify new tenant:', result.error)
    }

    return result
  }

  /**
   * Send notification when an application error occurs
   */
  async notifyError(payload: TelegramErrorPayload): Promise<TelegramSendResult> {
    // Format the error message
    const messageText = formatErrorMessage(payload)

    // Send via adapter
    const result = await this.adapter.sendMessage({
      chatId: this.chatId,
      text: messageText,
      parseMode: 'HTML',
      disableWebPagePreview: true,
    })

    if (!result.success) {
      console.error('[Telegram] Failed to notify error:', result.error)
    }

    return result
  }
}
