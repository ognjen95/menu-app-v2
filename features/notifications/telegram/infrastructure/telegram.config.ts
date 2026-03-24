/**
 * Telegram Infrastructure - Configuration
 * Environment variable loading and validation
 */

import type { TelegramConfig } from '../types'

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org'

/**
 * Load Telegram configuration from environment variables
 */
export function loadTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || ''
  const chatId = process.env.TELEGRAM_CHAT_ID || ''
  const apiUrl = process.env.TELEGRAM_API_URL || TELEGRAM_API_BASE_URL

  return {
    botToken,
    chatId,
    apiUrl,
  }
}

/**
 * Check if Telegram is properly configured
 */
export function isTelegramConfigured(config: TelegramConfig): boolean {
  return Boolean(config.botToken && config.chatId)
}

/**
 * Get the full Telegram API URL for sending messages
 */
export function getTelegramApiUrl(config: TelegramConfig): string {
  return `${config.apiUrl}/bot${config.botToken}/sendMessage`
}
