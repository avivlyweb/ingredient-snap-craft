

# Switch AI Functions from Lovable Gateway to Your Own API Keys

## Problem
Three edge functions use the Lovable AI gateway (`ai.gateway.lovable.dev`) which has run out of balance. You already have `OPENAI_API_KEY` and `GROQ_API_KEY` secrets configured.

## Solution
Migrate all three functions to use your OpenAI API key directly (calling `api.openai.com` instead of the Lovable gateway). The voice assistant already uses OpenAI directly and is unaffected.

---

## Changes

### 1. `supabase/functions/generate-recipe/index.ts`
- Replace `LOVABLE_API_KEY` with `OPENAI_API_KEY`
- Change URL from `ai.gateway.lovable.dev/v1/chat/completions` to `api.openai.com/v1/chat/completions`
- Update model from `google/gemini-2.5-flash` to `gpt-4o` (or `gpt-4o-mini` for cost savings)

### 2. `supabase/functions/extract-ingredients/index.ts`
- Same swap: `OPENAI_API_KEY` + `api.openai.com`
- Model: `gpt-4o` (needed for image analysis/vision)

### 3. `supabase/functions/generate-recipe-image/index.ts`
- Switch to OpenAI's DALL-E 3 API (`api.openai.com/v1/images/generations`) since image generation needs a different endpoint
- Use `OPENAI_API_KEY`

### No other files change
- Voice assistant (`openai-realtime-session`) already uses `OPENAI_API_KEY` directly
- No frontend changes needed

---

## Technical Notes
- OpenAI's `gpt-4o` supports vision (image analysis) for ingredient extraction
- DALL-E 3 is used for recipe image generation (different endpoint than chat completions)
- All three functions keep the same error handling (402/429 responses)
- The `GROQ_API_KEY` can be used as a fallback option later if needed

