/**
 * Generate VAPID keys for Web Push (run with Deno).
 * Usage: deno run --allow-env scripts/generate-vapid-keys.ts
 *
 * Copy the output into:
 * - .env: VITE_VAPID_PUBLIC_KEY=...
 * - Supabase Edge Function secrets: VAPID_KEYS_JWK=...
 */
import {
  generateVapidKeys,
  exportApplicationServerKey,
  exportVapidKeys
} from 'jsr:@negrel/webpush@0.5'

const keys = await generateVapidKeys()
const publicKeyB64 = await exportApplicationServerKey(keys)
const jwk = await exportVapidKeys(keys)

console.log('\nAdd to your .env (Vite / Vercel):')
console.log('VITE_VAPID_PUBLIC_KEY=' + publicKeyB64)
console.log('\nAdd to Supabase Edge Function secrets (VAPID_KEYS_JWK), as a single-line JSON string:')
console.log('VAPID_KEYS_JWK=' + JSON.stringify(jwk))
console.log('')
