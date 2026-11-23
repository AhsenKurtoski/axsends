import type { MetadataRoute } from 'next'

// Il sito e' servito da una sola origine: i due URL pubblici e il launch kit.
// Nessun lastModified inventato: senza date reali e' meglio ometterle che
// dire ai crawler che tutto cambia oggi.
const BASE = 'https://axsends.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/en`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/launch`, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
