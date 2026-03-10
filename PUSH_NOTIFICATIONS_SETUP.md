# Web Push Notifications – Step-by-Step Setup

This guide adds **lock-screen push notifications** when someone turns on "Supermarket Mode": other users get: *"[Name] is at the supermarket! Add any missing items now."*

We use **VAPID keys + Supabase Edge Functions** (no third-party service, free).

**Requirements:** App must be served over **HTTPS** (e.g. Vercel). The first time a user logs in, the browser may ask for notification permission.

---

## 1. Create the `push_subscriptions` table in Supabase

In the [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, run:

```sql
-- Stores each device's push subscription so we can send notifications.
-- RLS: users can insert/delete their own rows; service role can read all.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 2. Generate VAPID keys (one-time)

You need a **public** key for the browser and a **private** (or full key pair) for the Edge Function.

**Option A – Using Node (if you have Node):**

```bash
npx web-push generate-vapid-keys
```

You get two lines: **public key** and **private key**. Keep both.

**Option B – One-time script in the project (recommended, run with Deno):**

```bash
deno run --allow-env scripts/generate-vapid-keys.ts
```

This prints:
- `VITE_VAPID_PUBLIC_KEY` — add to your app env (e.g. `.env` or Vercel).
- `VAPID_KEYS_JWK` — add to Supabase Edge Function secrets (see step 4).

---

## 3. Configure environment variables

**In the Vite app (e.g. `.env` or Vercel):**

- `VITE_VAPID_PUBLIC_KEY` = the **public** VAPID key (base64 string from step 2).

**In Supabase → Project Settings → Edge Functions → Secrets:**

- `VAPID_KEYS_JWK` = JSON object for the key pair (see step 2 / script).  
  If you used `web-push generate-vapid-keys`, you must convert to JWK or use a script that outputs JWK; the Edge Function expects JWK.

Use the same key pair for both: same public key in the client, same key pair (as JWK) in the Edge Function.

---

## 4. Deploy the Edge Function

From the **client** folder (where the `supabase` folder lives):

```bash
cd client
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set VAPID_KEYS_JWK='{"publicKey":{...},"privateKey":{...}}'
supabase functions deploy notify-supermarket
```

Use the exact `VAPID_KEYS_JWK` value from step 2 (one-line JSON). The function is invoked by the client when a user turns on Supermarket Mode; it sends a web push to all other users’ subscriptions.

---

## 5. Enable notifications in the app

1. Deploy the client (Vite app) with `VITE_VAPID_PUBLIC_KEY` set.
2. Open the app in the browser (or install the PWA).
3. Log in. When you turn on "Supermarket Mode" for the first time (or when the app prompts), allow notifications.
4. The app will subscribe the device and save it to `push_subscriptions`.

When **another** user turns on Supermarket Mode, you will get a push on your device (including lock screen) with: *"[Name] is at the supermarket! Add any missing items now."*

---

## Flow summary

1. **Subscribe:** User allows notifications → browser creates a push subscription → app sends it to Supabase (`push_subscriptions`).
2. **Trigger:** User A turns on Supermarket Mode → app updates `app_state` and calls Edge Function `notify-supermarket` with `shopper_user_id` and `shopper_name`.
3. **Send:** Edge Function loads all rows from `push_subscriptions` where `user_id != shopper_user_id`, then sends a Web Push to each subscription with the message above.

No third-party push service is required; only Supabase and the browser’s Push API are used.
