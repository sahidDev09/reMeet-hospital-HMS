import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://remeet.health'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/portal',
          '/patient',
          '/appointments',
          '/patients',
          '/prescriptions',
          '/billing',
          '/pharmacy',
          '/pos',
          '/admin',
          '/analytics',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
