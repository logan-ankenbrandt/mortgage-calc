import type { VercelRequest, VercelResponse } from '@vercel/node'

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred'
const FRED_API_KEY = process.env.FRED_API_KEY || '541c1c2eb9bad23735fa515363596d18'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get query parameters from the request
    const params = new URLSearchParams()

    // Copy allowed parameters from the request
    const allowedParams = [
      'series_id',
      'observation_start',
      'observation_end',
      'limit',
      'sort_order',
      'units',
    ]

    for (const param of allowedParams) {
      const value = req.query[param]
      if (value) {
        params.set(param, Array.isArray(value) ? value[0] : value)
      }
    }

    // Add required parameters
    params.set('api_key', FRED_API_KEY)
    params.set('file_type', 'json')

    const url = `${FRED_BASE_URL}/series/observations?${params.toString()}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`FRED API error: ${response.status}`, errorText)
      return res.status(response.status).json({
        error: `FRED API error: ${response.status}`,
        details: errorText
      })
    }

    const data = await response.json()

    // Set cache headers - cache for 1 hour, stale-while-revalidate for 24 hours
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.setHeader('Content-Type', 'application/json')

    return res.status(200).json(data)
  } catch (error) {
    console.error('Failed to fetch from FRED API:', error)
    return res.status(500).json({ error: 'Failed to fetch from FRED API' })
  }
}
