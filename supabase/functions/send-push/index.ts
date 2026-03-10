import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No devices' }), { headers: corsHeaders })
    }

    // נשתמש בספרייה היחידה שהיא חלק מהסטנדרט של Supabase ואי אפשר לחסום
    // אם גם זה ייכשל, נדע שהבעיה היא ב-Runtime עצמו
    const { default: webpush } = await import("https://esm.sh/web-push@3.6.7?target=deno")

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

    const notificationPayload = JSON.stringify({
      title: '🛒 מישהו בסופר!',
      body: 'רשימת הקניות פתוחה, זה הזמן להוסיף מוצרים!',
    })

    const results = await Promise.all(subscriptions.map(async (sub) => {
      try {
        // שימוש בפרמטרים ישירים כדי למנוע תלות במבני נתונים מורכבים
        const response = await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh }
        }, notificationPayload, {
          vapidDetails: {
            subject: 'mailto:test@test.com',
            publicKey,
            privateKey
          }
        })
        return response
      } catch (err) {
        console.error('Push failed for:', sub.endpoint, err.message)
        return null
      }
    }))

    return new Response(JSON.stringify({ sent: results.filter(r => r !== null).length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Final error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})