# Authentication Feature

## Purpose
Handles user authentication including login, signup, password reset, and OAuth provider integration (Google, GitHub). Provides form components with validation and error handling using react-hook-form.

## Components

### Container Components

- **`LoginFormContainer`** - Login form with email/password authentication
  - Location: `/components/features/auth/containers/login-form.tsx`
  - Purpose: Manages login state, form validation, and submission to server action
  - Uses: react-hook-form for form management

### UI Components
*(To be added as feature expands)*

## Usage

### Login Form

```tsx
import { LoginFormContainer } from '@/components/features/auth/containers/login-form'

function LoginPage() {
  return (
    <div className="container">
      <h1>Sign In</h1>
      <LoginFormContainer />
    </div>
  )
}
```

## Props/API

### LoginFormContainer Props
```typescript
// Currently accepts no props - self-contained component
// Handles navigation and errors internally
```

### Form Data
```typescript
interface LoginFormData {
  email: string       // User's email address
  password: string    // User's password
}
```

## Dependencies

### External
- `react-hook-form` - Form state management and validation
- `next/navigation` - Router for navigation after login

### Internal
- `/app/auth/actions` - `loginUser` server action
- `/components/ui/button` - Styled button component
- `/components/ui/input` - Styled input component
- `/components/ui/label` - Styled label component

## State Management

### Local State
- `error: string` - Displays authentication errors
- `isLoading: boolean` - Shows loading state during submission

### Form State
Managed by react-hook-form:
- Form values (email, password)
- Validation errors
- Submit state

## Authentication Flow

1. User enters email and password
2. Form validates inputs (required fields)
3. On submit, form data is sent to `loginUser` server action
4. Server action validates credentials via Supabase
5. On success: User is redirected to `/dashboard`
6. On error: Error message is displayed below form

## Server Integration

Uses server action pattern:
```typescript
// Server action at /app/auth/actions.ts
loginUser(currentState, formData) -> { message?: string }
```

The server action:
- Validates credentials with Supabase
- Sets session cookies
- Redirects to dashboard on success
- Returns error message on failure

## Testing

**Location:** `./containers/login-form.test.tsx`

**Coverage:**
- ✅ Form renders with email and password fields
- ✅ Shows validation errors for empty fields
- ✅ Handles form submission
- ✅ Displays loading state during submission
- ✅ Displays authentication errors
- ✅ Disables form during loading

**To run tests:**
```bash
npm test -- login-form.test.tsx
```

## Validation Rules

- **Email:** Required
- **Password:** Required

## Error Handling

### User-Facing Errors
- Invalid credentials
- Network errors
- Server errors

Errors are displayed below the submit button in red text.

## Styling

Uses Tailwind CSS classes and shadcn/ui components:
- Consistent spacing with `gap-2` and `mt-4`
- Full width button with `w-full`
- Error messages styled with `text-sm text-red-500`

## Future Enhancements

- [ ] Add "Remember me" checkbox
- [ ] Add password visibility toggle
- [ ] Add rate limiting for failed attempts
- [ ] Add social login buttons (Google, GitHub)
- [ ] Extract reusable form field components
- [ ] Add forgot password link

## Related Features

- **Signup** - User registration (similar pattern)
- **Password Reset** - Forgot password flow
- **OAuth** - Social provider authentication

## Notes

- Server actions automatically handle redirects on success
- Form uses native HTML5 validation in addition to react-hook-form
- Loading state prevents duplicate submissions
- Component is fully client-side (`"use client"` directive)

## Last Updated
Created during refactoring session - January 2026
