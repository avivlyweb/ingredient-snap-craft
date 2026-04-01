

# Comprehensive App QA Audit Report

## Agent 1: Flow & Navigation QA

### Issues Found

1. **Broken Profile Route** (BUG)
   - `Navigation.tsx` line 109 links to `/profile/${profile?.username}` but there is NO `/profile/:username` route in `App.tsx`. Clicking "Profile" in the dropdown navigates to the 404 page.
   - **Fix**: Either create a `ProfilePage` component and add the route, or remove the Profile menu item.

2. **Recovery Page — No Auth Guard for Voice Logging**
   - Voice assistant tries to log health data but silently fails if user isn't signed in (only a `console.warn`). The user sees no feedback that their logs weren't saved.
   - **Fix**: Show a toast or inline message when voice logging fails due to missing auth.

3. **Cognitive Light Mode — Double VoiceButton Rendering**
   - `CognitiveLightModeUI.tsx` renders its own `<VoiceButton>` (line 153), AND `Recovery.tsx` renders another `<VoiceButton>` (line 814). When Cognitive Light Mode is active, Recovery.tsx returns early (line 346), so only one shows — this is actually OK. No bug here.

---

## Agent 2: Edge Functions & Backend QA

### Issues Found

4. **generate-recipe & extract-ingredients still use Lovable AI Gateway** (CRITICAL BUG)
   - `generate-recipe/index.ts` (line 31-33, 152) uses `LOVABLE_API_KEY` and `ai.gateway.lovable.dev`
   - `extract-ingredients/index.ts` uses `LOVABLE_API_KEY` and `ai.gateway.lovable.dev`
   - `generate-recipe-image/index.ts` (line 16, 32) uses `LOVABLE_API_KEY` and `ai.gateway.lovable.dev`
   - User reported "AI balance ran out" — these 3 functions will ALL fail with 402 errors.
   - A plan was approved to switch to `OPENAI_API_KEY` but **was never implemented**.
   - **Fix**: Switch all 3 functions from `LOVABLE_API_KEY`/`ai.gateway.lovable.dev` to `OPENAI_API_KEY`/`api.openai.com`.

5. **ClinicianDashboard queries have no `user_id` filter** (BUG)
   - `ClinicianDashboard.tsx` line 107-134: queries to `food_logs`, `activity_logs`, `symptom_logs` do NOT filter by `user_id`. While RLS policies enforce user-level access, this means:
     - If RLS is working: data is correctly filtered (OK)
     - Weekly trend queries also lack user filter but are protected by RLS
   - Not a security bug (RLS handles it), but relying solely on RLS without explicit filters is fragile.

6. **`generate-recipe-image` uses `google/gemini-2.5-flash-image`** — this model returns images in a non-standard `images` array format. If the Lovable gateway changes or the model isn't available, image generation silently fails.

---

## Agent 3: UI/UX QA

### Issues Found

7. **VoiceAssistant side-effect in render** (CODE QUALITY / POTENTIAL BUG)
   - `VoiceAssistant.tsx` lines 90-92: `if (!isSpeaking && currentAIResponse) { handleAIResponseComplete(); }` runs during render, which is a React anti-pattern. This can cause infinite re-renders or inconsistent state.
   - **Fix**: Move this logic into a `useEffect` that watches `isSpeaking` and `currentAIResponse`.

8. **Index page Badge has invisible character** (MINOR UI BUG)
   - `Index.tsx` line 255-256: `<Badge>​2025\n </Badge>` contains a zero-width space character (​) before "2025". This may cause odd spacing or rendering.
   - **Fix**: Clean the badge content to just `2025`.

9. **NotFound page uses hardcoded gray styles** instead of theme-aware classes (`bg-gray-100`, `text-gray-600`, `text-blue-500`). Looks inconsistent with the rest of the app's design system.

10. **Recovery page voice assistant prompt says English** — Suggestions in `VoiceAssistant.tsx` line 178 say "Say something like: I had eggs for breakfast" which is English, but the assistant persona is Dutch-only. Should be Dutch examples.

---

## Agent 4: Content & Data Integrity QA

### Issues Found

11. **Recipe generation does not pass `recoveryGoals`** (BUG)
   - `Recovery.tsx` line 221-227 sends `recoveryGoals` to `generate-recipe`, but the edge function (line 30) only destructures `{ ingredients, contextType }` — `recoveryGoals` is ignored. The AI prompt doesn't use the patient's actual weight/protein target.
   - **Fix**: Accept and use `recoveryGoals` in the edge function to calculate the exact 1.5g/kg target.

12. **Missing `created_at` in recipe display** — The recipe display on the Recovery page doesn't show when the recipe was generated. Minor but useful for clinical context.

---

## Summary of All Issues by Severity

| # | Severity | Issue |
|---|----------|-------|
| 4 | CRITICAL | 3 edge functions still use exhausted Lovable AI gateway |
| 1 | HIGH | Profile route missing — clicking Profile goes to 404 |
| 11 | HIGH | Recovery goals not passed to recipe generation prompt |
| 7 | MEDIUM | Side-effect during render in VoiceAssistant |
| 2 | MEDIUM | No user feedback when voice logs fail without auth |
| 10 | MEDIUM | English example prompts in Dutch-only assistant |
| 8 | LOW | Zero-width character in badge text |
| 9 | LOW | NotFound page uses non-theme styles |

---

## Recommended Fix Order

1. **Switch 3 edge functions to OPENAI_API_KEY** — Without this, recipe generation, ingredient extraction, and image generation are all broken.
2. **Add `/profile` route or remove broken link** — Prevents user confusion.
3. **Fix VoiceAssistant render side-effect** — Prevents potential infinite render loops.
4. **Pass recoveryGoals to generate-recipe function** — Ensures clinical accuracy.
5. **Dutch-ify voice assistant example prompts** — Consistency with persona.
6. **Clean up minor UI issues** (badge, NotFound styling).

