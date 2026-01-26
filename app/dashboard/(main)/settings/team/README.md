# Team Management Feature

## Overview
The Team Management feature allows restaurant owners and managers to manage their team members, assign roles, and send email invitations to new team members.

## Features

### 1. **Manual Team Member Creation**
- Add team members directly by email
- Creates auth user account automatically
- Assigns role immediately
- No email invitation required

### 2. **Email Invitations (via Mailgun)**
- Send professional email invitations
- Invitation includes unique token link
- 7-day expiration period
- Track pending invitations
- Cancel invitations before acceptance

### 3. **Team Member Management**
- View all team members
- Update member roles
- Remove team members (except owner)
- View member join dates
- Role-based permissions display

### 4. **Roles**
- **Owner**: Full access, cannot be removed
- **Manager**: Can manage team, orders, and settings
- **Staff**: General staff access
- **Kitchen**: Kitchen-specific access
- **Waiter**: Waiter-specific access

## API Routes

### GET `/api/team`
Fetch all team members and pending invitations for the current tenant.

**Response:**
```json
{
  "data": {
    "members": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "role": "manager",
        "is_active": true,
        "joined_at": "2024-01-01T00:00:00Z"
      }
    ],
    "invitations": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "role": "staff",
        "status": "pending",
        "expires_at": "2024-01-08T00:00:00Z"
      }
    ]
  }
}
```

### POST `/api/team`
Send an email invitation to a new team member.

**Body:**
```json
{
  "email": "user@example.com",
  "role": "staff"
}
```

**Response:**
```json
{
  "data": {
    "invitation": { ... },
    "emailSent": true
  }
}
```

### POST `/api/team/members`
Manually create a team member (creates auth user).

**Body:**
```json
{
  "email": "user@example.com",
  "role": "staff"
}
```

### PATCH `/api/team/[id]`
Update a team member's role or status.

**Body:**
```json
{
  "role": "manager",
  "is_active": true
}
```

### DELETE `/api/team/[id]`
Remove a team member (cannot remove owner or yourself).

### DELETE `/api/team/invitations/[id]`
Cancel a pending invitation.

## Database Schema

### `profiles` table
- `id`: UUID (primary key, references auth.users)
- `full_name`: text
- `avatar_url`: text
- `phone`: text
- `location`: text
- `bio`: text
- `created_at`: timestamp
- `updated_at`: timestamp

### `tenant_users` table
- `id`: UUID (primary key)
- `tenant_id`: UUID (foreign key to tenants)
- `user_id`: UUID (foreign key to auth.users)
- `role`: tenant_role enum
- `is_active`: boolean
- `invited_by`: UUID (foreign key to auth.users)
- `joined_at`: timestamp
- `created_at`: timestamp

### `tenant_invitations` table
- `id`: UUID (primary key)
- `tenant_id`: UUID (foreign key to tenants)
- `email`: text
- `role`: tenant_role enum
- `invited_by`: UUID (foreign key to auth.users)
- `token`: text (unique, auto-generated)
- `status`: text (pending, accepted, expired, cancelled)
- `expires_at`: timestamp
- `accepted_at`: timestamp
- `created_at`: timestamp
- `updated_at`: timestamp

## Mailgun Integration

### Setup
1. Create a Mailgun account at https://www.mailgun.com
2. Verify your domain
3. Get your API key from the dashboard
4. Add environment variables to `.env.local`:

```env
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain.com
MAILGUN_FROM_EMAIL=noreply@your_domain.com
MAILGUN_API_URL=https://api.mailgun.net
```

### Email Template
The invitation email includes:
- Professional gradient header
- Inviter's name and tenant name
- Role assignment
- Call-to-action button with unique invite link
- Expiration notice (7 days)
- Fallback plain text link

### Email Sending Behavior

**When Mailgun is NOT configured:**
- Invitation is created in database
- Warning is logged to console
- API returns `emailSent: false`
- User can manually share the invitation link

**When Mailgun IS configured:**
- Email is sent FIRST before creating invitation
- If email fails (e.g., invalid API key, unauthorized):
  - Invitation is NOT created in database
  - Error is thrown to the user
  - User sees error message
- If email succeeds:
  - Invitation is created in database
  - API returns `emailSent: true`
  - User sees success message

This prevents orphaned invitations in the database when email delivery fails.

## Security

### Row Level Security (RLS)
All tables have RLS policies enabled:
- Users can only view team members for their own tenant
- Only owners and managers can invite/add/remove members
- Cannot remove the owner role
- Cannot remove yourself

### Permissions
- **Owner & Manager**: Full team management access
- **Staff, Kitchen, Waiter**: View-only access to team list

## Usage Example

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'

// Fetch team
const { data } = useQuery({
  queryKey: ['team'],
  queryFn: () => apiGet('/team'),
})

// Send invitation
const inviteMutation = useMutation({
  mutationFn: (data) => apiPost('/team', data),
})

inviteMutation.mutate({
  email: 'newmember@example.com',
  role: 'staff',
})

// Remove member
const removeMutation = useMutation({
  mutationFn: (id) => apiDelete(`/team/${id}`),
})

removeMutation.mutate(memberId)
```

## Testing

### Manual Testing Checklist
- [ ] Owner can add team members
- [ ] Manager can add team members
- [ ] Staff cannot add team members
- [ ] Email invitation is sent successfully
- [ ] Invitation appears in pending list
- [ ] Invitation can be cancelled
- [ ] Team member can be removed
- [ ] Owner cannot be removed
- [ ] User cannot remove themselves
- [ ] Role updates work correctly

### Email Testing
Without Mailgun configured, check console logs for email content.

With Mailgun configured:
1. Send test invitation
2. Check Mailgun logs
3. Verify email received
4. Test invitation link

## Order Action Tracking

Team member actions on orders are now tracked automatically:

### Tracked Fields on Orders Table
- `status_updated_by`: UUID - Who last changed the order status
- `status_updated_at`: timestamp - When the status was last changed
- `assigned_to`: UUID - Team member assigned to this order
- `cancelled_by`: UUID - Who cancelled the order
- `cancelled_at`: timestamp - When the order was cancelled
- `cancelled_reason`: text - Reason for cancellation

### Profile Information in Order Queries
All order API endpoints now include profile information:
- `status_updated_by_profile`: { full_name, avatar_url }
- `cancelled_by_profile`: { full_name, avatar_url }
- `assigned_to_profile`: { full_name, avatar_url }

This allows you to display who performed actions on orders in the UI.

## Profile Management

### GET `/api/profile`
Get the current user's profile.

### PATCH `/api/profile`
Update the current user's profile.

**Body:**
```json
{
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "phone": "+1234567890",
  "location": "New York",
  "bio": "Head chef with 10 years experience"
}
```

## Future Enhancements
- [ ] Resend invitation email
- [ ] Custom invitation message
- [ ] Bulk invite via CSV
- [ ] Team member activity logs
- [ ] Location-specific team assignments
- [ ] Role permission customization
- [ ] Order assignment workflow
- [ ] Performance metrics per team member
