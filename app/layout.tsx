import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#2BB2A9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'VayaZed Bus Booking - Intercity Travel Made Easy',
  description: 'Book intercity buses across Zambia. Travel from Lusaka to any destination with ease. Safe, reliable, and affordable bus travel.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZM Bus',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
    shortcut: [{ url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' }],
  },
  openGraph: {
    title: 'VayaZed Bus Booking',
    description: 'Book intercity buses across Zambia. Travel from Lusaka to any destination with ease.',
    url: 'https://your-domain.com',
    siteName: 'VayaZed Bus Booking',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VayaZed Bus Booking',
      },
    ],
    locale: 'en_ZM',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VayaZed Bus Booking',
    description: 'Book intercity buses across Zambia.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add when you have one
  },
  keywords: [
    'VayaZed Bus Booking', 
    'intercity buses Zambia', 
    'Lusaka to Livingstone bus',
    'Lusaka to Ndola bus',
    'Zambia travel',
    'bus tickets Zambia',
    'public transport Zambia'
  ],
  authors: [{ name: 'VayaZed Bus Booking' }],
  category: 'travel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZM Bus" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ZM Bus" />
        
        {/* Zambian theme colors */}
        <meta name="theme-color" content="#2BB2A9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#13625D" media="(prefers-color-scheme: dark)" />
        
        {/* Fallback for older browsers */}
        <meta name="msapplication-TileColor" content="#2BB2A9" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Add your domain for API calls if needed */}
        {/* <link rel="dns-prefetch" href="https://your-api-domain.com" /> */}
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {children}
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('✅ ServiceWorker registered successfully');
                    },
                    function(err) {
                      console.log('❌ ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}