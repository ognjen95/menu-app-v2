# Telegram Notification System

## Purpose

Sends Telegram notifications when new tenants are created in Klopay. Built with domain-driven design and clean architecture principles.

## Architecture

```
/features/notifications/telegram/
├── index.ts                           # Main entry point & factory
├── types.ts                           # Domain types & interfaces
├── domain/
│   └── telegram.rules.ts              # Business rules (formatting, validation)
├── infrastructure/
│   ├── telegram.config.ts             # Configuration management
│   └── telegram.adapter.ts            # Telegram API HTTP adapter
└── services/
    └── telegram.service.ts            # Application service (orchestration)
```

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Chat ID

1. Add your bot to a group or start a direct chat with it
2. Send a message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find your chat ID in the response (negative number for groups)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Usage

### Basic Usage

```typescript
import { notifyNewTenantCreated } from '@/features/notifications/telegram'

// In your route handler
await notifyNewTenantCreated({
  tenantId: tenant.id,
  tenantName: tenant.name,
  tenantSlug: tenant.slug,
  tenantType: tenant.type,
  userEmail: user.email,
  country: tenant.country,
  createdAt: new Date(),
})
```

### Check if Telegram is Configured

```typescript
import { isTelegramEnabled } from '@/features/notifications/telegram'

if (isTelegramEnabled()) {
  // Telegram is configured and ready
}
```

### Advanced: Using the Service Directly

```typescript
import { getTelegramNotificationService } from '@/features/notifications/telegram'

const telegramService = getTelegramNotificationService()
const result = await telegramService.notifyNewTenant(payload)

if (result.success) {
  console.log('Message sent! ID:', result.messageId)
} else {
  console.error('Failed:', result.error)
}
```

## Message Format

When a new tenant is created, the bot sends a formatted message:

```
🎉 New Business Created!

🍽️ Business: Restaurant Name
📝 Slug: restaurant-slug
🏷️ Type: restaurant
🌍 Country: RS
👤 Owner: owner@example.com
🕐 Created: Mar 24, 2026, 8:00 PM UTC

🔗 View Menu
```

## Error Handling

The notification system is designed to fail gracefully:
- If Telegram is not configured, it logs a warning and returns
- If sending fails, it logs the error but doesn't throw
- Tenant creation is never blocked by notification failures

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Chat/group ID for notifications |
| `TELEGRAM_API_URL` | No | Custom API URL (default: api.telegram.org) |

## Dependencies

- No external packages required (uses native `fetch`)
- TypeScript for type safety

## Testing

```bash
# Run tests
npm test -- telegram

# Manual test
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<CHAT_ID>", "text": "Test message"}'
```

## Troubleshooting

### Bot not sending messages?

1. Check if `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
2. Verify the bot has been added to the chat/group
3. For groups, ensure the bot has permission to send messages
4. Check server logs for `[Telegram]` prefixed messages

### Getting "403 Forbidden"?

- The bot may have been blocked or removed from the chat
- Re-add the bot to the chat/group

### Getting "400 Bad Request"?

- Invalid chat ID format
- Chat ID might have changed (groups can change IDs when converted to supergroups)

## Related Features

- **Email Notifications**: `/lib/mailgun.ts`
- **Tenant Creation**: `/app/api/tenant/create/route.ts`
