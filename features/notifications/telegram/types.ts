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

export interface TelegramErrorPayload {
  message: string
  stack?: string
  digest?: string
  url: string
  userAgent: string
  timestamp: Date
  environment: 'production' | 'development'
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
  notifyError(payload: TelegramErrorPayload): Promise<TelegramSendResult>
}
