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

    if (!url || !url.includes('partiful.com')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Partiful URL', event: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Could not access event', event: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await response.text()

    const getMeta = (h: string, property: string) => {
      const patterns = [
        new RegExp(`<meta property="${property}" content="([^"]*)"`, 'i'),
        new RegExp(`<meta content="([^"]*)" property="${property}"`, 'i'),
        new RegExp(`<meta name="${property}" content="([^"]*)"`, 'i'),
      ]
      for (const pattern of patterns) {
        const match = h.match(pattern)
        if (match?.[1]) {
          return match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
        }
      }
      return null
    }

    const getJsonLd = (h: string) => {
      const match = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
      if (match?.[1]) {
        try { return JSON.parse(match[1]) } catch { return null }
      }
      return null
    }

    const jsonLd = getJsonLd(html)

    const event: Record<string, any> = {
      name: null,
      date: null,
      location: null,
      description: null,
      image_url: null,
      host: null,
    }

    if (jsonLd) {
      event.name = jsonLd.name || null
      event.description = jsonLd.description || null
      event.image_url = jsonLd.image || null

      if (jsonLd.startDate) {
        const d = new Date(jsonLd.startDate)
        event.date = d.toISOString().split('T')[0]
        event.date_formatted = d.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
        })
      }

      if (jsonLd.location?.name) {
        event.location = jsonLd.location.name
      } else if (jsonLd.location?.address) {
        event.location = typeof jsonLd.location.address === 'string'
          ? jsonLd.location.address
          : jsonLd.location.address.streetAddress || null
      }

      if (jsonLd.organizer?.name) {
        event.host = jsonLd.organizer.name
      }
    }

    if (!event.name) event.name = getMeta(html, 'og:title') || getMeta(html, 'twitter:title')
    if (!event.description) event.description = getMeta(html, 'og:description') || getMeta(html, 'twitter:description')
    if (!event.image_url) event.image_url = getMeta(html, 'og:image') || getMeta(html, 'twitter:image')

    if (event.description) {
      event.description = event.description.replace(/See the invitation.*/i, '').replace(/RSVP.*/i, '').trim()
      if (event.description.length > 300) event.description = event.description.substring(0, 297) + '...'
    }

    if (!event.name) {
      return new Response(
        JSON.stringify({ error: 'Event may be private or URL is incorrect', event: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, event: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
