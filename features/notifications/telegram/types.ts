/**
 * Telegram Notification System - Domain Types
 */

export interface TelegramConfig {
  botToken: string
  chatId: string
  apiUrl: string
}

export interface TelegramNotificationPayload {
  tenantId: string
  tenantName: string
  tenantSlug: string
  tenantType: string
  userEmail: string
  country: string
  createdAt: Date
}

export interface TelegramMessage {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableWebPagePreview?: boolean
}

export interface TelegramSendResult {
  success: boolean
  messageId?: number
  error?: string
}

export interface ITelegramAdapter {
  sendMessage(message: TelegramMessage): Promise<TelegramSendResult>
}

export interface ITelegramNotificationService {
  notifyNewTenant(payload: TelegramNotificationPayload): Promise<TelegramSendResult>
}
