import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing URL', event: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    const html = await response.text()

    const getName = (h: string) => {
      const m = h.match(/<meta property="og:title" content="([^"]+)"/)
      return m ? m[1] : null
    }
    const getDesc = (h: string) => {
      const m = h.match(/<meta property="og:description" content="([^"]+)"/)
      return m ? m[1] : null
    }
    const getImage = (h: string) => {
      const m = h.match(/<meta property="og:image" content="([^"]+)"/)
      return m ? m[1] : null
    }

    const event = {
      name: getName(html) || 'Partiful Event',
      description: getDesc(html),
      image_url: getImage(html),
    }

    return new Response(
      JSON.stringify({ event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, event: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
