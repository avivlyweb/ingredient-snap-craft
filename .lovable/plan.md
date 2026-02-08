

# Google Sign-In with Lovable Cloud

## Overview

This plan adds Google Sign-In to the authentication flow using Lovable Cloud's managed OAuth solution. The Recovery page will require authentication before users can use the voice assistant for health logging.

---

## What Will Be Implemented

### 1. Enhanced Auth Page with Google Sign-In

**File: `src/pages/Auth.tsx`**

Add a "Continue with Google" button that uses the Lovable Cloud auth module:

```typescript
import { lovable } from "@/integrations/lovable/index";

const handleGoogleSignIn = async () => {
  setLoading(true);
  try {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) throw error;
  } catch (error: any) {
    toast.error(error.message || "Google sign-in failed");
  } finally {
    setLoading(false);
  }
};
```

**UI Changes:**
- Add a prominent "Continue with Google" button with Google icon
- Add a visual divider ("or continue with email")
- Keep existing email/password form as alternative

---

### 2. Authentication Protection for Recovery Page

**File: `src/pages/Recovery.tsx`**

Add authentication check that redirects to `/auth` if the user is not logged in and wants to use features that require authentication (voice logging):

```typescript
const [isAuthRequired, setIsAuthRequired] = useState(false);

// Show login prompt when trying to use voice assistant without auth
const handleVoiceButtonClick = () => {
  if (!user) {
    setIsAuthRequired(true);
    toast.info("Please sign in to save your health logs");
    return;
  }
  // Proceed with voice assistant
};
```

**Alternative Approach (Soft Gate):**
- Allow users to browse Recovery page without auth
- Show a gentle prompt when they try to use the voice assistant
- Add a "Sign in to save your progress" banner for unauthenticated users

---

### 3. Auth Redirect Support

**File: `src/pages/Auth.tsx`**

Add support for redirect after authentication:

```typescript
// Check for redirect parameter
const searchParams = new URLSearchParams(location.search);
const redirectTo = searchParams.get("redirect") || "/";

// After successful auth, redirect to original page
if (event === "SIGNED_IN" && session) {
  navigate(redirectTo);
}
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add Google Sign-In button using `lovable.auth.signInWithOAuth()`, add redirect support |
| `src/pages/Recovery.tsx` | Add auth banner for unauthenticated users, link to sign in |

### Dependencies

The Lovable Cloud auth module is already configured:
- `@lovable.dev/cloud-auth-js` package is installed
- `src/integrations/lovable/index.ts` exports `lovable.auth.signInWithOAuth()`
- No additional configuration needed (Google OAuth is managed by Lovable Cloud)

---

## User Flow

```text
User visits /recovery
        |
        v
Accepts medical disclaimer
        |
        v
Browses recovery features freely
        |
        v
Clicks voice assistant microphone
        |
        v
[Not logged in?]
        |
    +---+---+
    |       |
   Yes      No
    |       |
    v       v
Shows "Sign in"   Voice assistant
banner with       works normally,
Google button     logs are saved
    |
    v
User clicks "Continue with Google"
    |
    v
Google OAuth flow (managed by Lovable Cloud)
    |
    v
Redirects back to /recovery
    |
    v
Voice assistant now saves logs
```

---

## UI Design

### Auth Page Layout

```text
+----------------------------------+
|        Join Recipe Community      |
|                                   |
|   [G] Continue with Google       |  <-- Primary action
|                                   |
|   ─────── or continue with ───────|
|                                   |
|   Email: [________________]       |
|   Password: [_____________]       |
|                                   |
|   [Sign Up / Sign In]             |
|                                   |
+----------------------------------+
```

### Recovery Page Auth Banner (for unauthenticated users)

```text
+------------------------------------------+
|  [G] Sign in with Google to save your    |
|      health logs and track progress       |
+------------------------------------------+
```

---

## Why Lovable Cloud?

- **No configuration needed**: Google OAuth is managed automatically
- **Secure**: No API keys stored in code
- **Simple**: Single function call `lovable.auth.signInWithOAuth("google")`
- **Integrated**: Works seamlessly with the existing Supabase auth system

