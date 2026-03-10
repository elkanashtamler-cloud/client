import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  ApplicationServer,
  importVapidKeys,
  type ExportedVapidKeys,
  type PushSubscription
} from 'jsr:@negrel/webpush@0.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface ReqBody {
  shopper_user_id: string
  shopper_name: string
}

interface PushSubRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = (await req.json()) as ReqBody
    const { shopper_user_id, shopper_name } = body
    if (!shopper_user_id || !shopper_name) {
      return new Response(
        JSON.stringify({ error: 'shopper_user_id and shopper_name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jwkRaw = Deno.env.get('VAPID_KEYS_JWK')
    if (!jwkRaw) {
      return new Response(
        JSON.stringify({ error: 'VAPID_KEYS_JWK not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const vapidKeys = await importVapidKeys(JSON.parse(jwkRaw) as ExportedVapidKeys)
    const appServer = await ApplicationServer.new({
      vapidKeys,
      contactInformation: 'mailto:support@example.com'
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .neq('user_id', shopper_user_id)

    if (error || !rows?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No subscriptions or error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const message = JSON.stringify({
      title: 'רשימת קניות',
      body: `${shopper_name} is at the supermarket! Add any missing items now.`
    })

    let sent = 0
    for (const row of rows as PushSubRow[]) {
      try {
        const sub: PushSubscription = {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth }
        }
        const subscriber = appServer.subscribe(sub)
        await subscriber.pushTextMessage(message, { urgency: 'high' })
        sent++
      } catch {
        // skip failed subscription (e.g. expired)
      }
    }

    return new Response(
      JSON.stringify({ sent, total: rows.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
