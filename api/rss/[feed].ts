import type { VercelRequest, VercelResponse } from '@vercel/node'

const RSS_URLS: Record<string, string> = {
  mortgagenews: 'https://www.mortgagenewsdaily.com/mortgage-rates-feed',
  housingwire: 'https://www.housingwire.com/feed/',
  calculatedrisk: 'https://www.calculatedriskblog.com/feeds/posts/default?alt=rss',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { feed } = req.query
  const feedKey = Array.isArray(feed) ? feed[0] : feed

  if (!feedKey || !RSS_URLS[feedKey]) {
    return res.status(400).json({ error: 'Invalid feed' })
  }

  try {
    const response = await fetch(RSS_URLS[feedKey])
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const xml = await response.text()

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).send(xml)
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${feedKey}:`, error)
    return res.status(500).json({ error: 'Failed to fetch feed' })
  }
}
