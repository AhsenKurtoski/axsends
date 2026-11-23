import type { MetadataRoute } from 'next'

// Le pagine pubbliche sono indicizzabili; la dashboard, il login e le API no.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app', '/app/', '/login', '/api/'],
      },
    ],
    sitemap: 'https://axsends.vercel.app/sitemap.xml',
  }
}
