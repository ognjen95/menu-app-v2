/**
 * Telegram Infrastructure - API Adapter
 * HTTP client wrapper for Telegram Bot API
 */

import type { TelegramConfig, TelegramMessage, TelegramSendResult, ITelegramAdapter } from '../types'
import { getTelegramApiUrl, isTelegramConfigured } from './telegram.config'

export class TelegramAdapter implements ITelegramAdapter {
  private config: TelegramConfig

  constructor(config: TelegramConfig) {
    this.config = config
  }

  /**
   * Send a message via Telegram Bot API
   */
  async sendMessage(message: TelegramMessage): Promise<TelegramSendResult> {
    if (!isTelegramConfigured(this.config)) {
      console.warn('[Telegram] Bot not configured. Skipping notification.')
      return {
        success: false,
        error: 'Telegram bot not configured',
      }
    }

    const url = getTelegramApiUrl(this.config)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: message.chatId,
          text: message.text,
          parse_mode: message.parseMode || 'HTML',
          disable_web_page_preview: message.disableWebPagePreview ?? true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[Telegram] API error:', data)
        return {
          success: false,
          error: data.description || `HTTP ${response.status}`,
        }
      }

      if (data.ok) {
        console.log('[Telegram] Message sent successfully. Message ID:', data.result?.message_id)
        return {
          success: true,
          messageId: data.result?.message_id,
        }
      }

      return {
        success: false,
        error: data.description || 'Unknown error',
      }
    } catch (error) {
      console.error('[Telegram] Failed to send message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }
}
