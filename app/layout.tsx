// app/layout.tsx

import '../styles/globals.css';
import '../styles/components.css';
import '../styles/vocably.css';
import '../styles/header.css';
import '../styles/responsive.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/livekit-chat-fix.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Vocably | Voice Chat for Language Learning & Making Friends',
    template: '%s | Vocably',
  },
  description:
    'Vocably is a free real-time voice chat app for learning new languages, practicing English, and making friends with people around the world. Join public or private rooms, talk to strangers, and grow your speaking skills in a safe, global community.',
  keywords: [
    'language learning',
    'voice chat',
    'practice English',
    'make friends',
    'talk to strangers',
    'global community',
    'learn languages',
    'public rooms',
    'private rooms',
    'Vocably',
  ],
  alternates: {
    canonical: 'https://vocably.vercel.app/',
  },
  twitter: {
    creator: '@vocably_app',
    site: '@vocably_app',
    card: 'summary_large_image',
    title: 'Vocably | Voice Chat for Language Learning & Making Friends',
    description:
      'Join Vocably to practice English, learn new languages, and make friends worldwide in real-time voice chat rooms. Safe, free, and easy to use.',
    images: [
      'https://vocably.vercel.app/images/vocably-og.png',
    ],
  },
  openGraph: {
    url: 'https://vocably.vercel.app',
    title: 'Vocably | Voice Chat for Language Learning & Making Friends',
    description:
      'Vocably lets you join or create voice chat rooms to practice languages, meet new people, and make friends globally. No sign-up required.',
    images: [
      {
        url: 'https://vocably.vercel.app/images/vocably-og.png',
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ],
    siteName: 'Vocably',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.png',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/vocably-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'mask-icon',
        url: '/images/vocably-mask-icon.svg',
        color: '#0f0f0f',
      },
    ],
  },
  metadataBase: new URL('https://vocably.vercel.app'),
};

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, shrink-to-fit=no' />
        <link rel="canonical" href="https://vocably.vercel.app/" />
        <meta name="keywords" content="language learning, voice chat, practice English, make friends, talk to strangers, global community, learn languages, public rooms, private rooms, Vocably" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
          \"@context\": \"https://schema.org\",
          \"@type\": \"WebSite\",
          \"name\": \"Vocably\",
          \"url\": \"https://vocably.vercel.app/\",
          \"description\": \"Vocably is a free real-time voice chat app for learning new languages, practicing English, and making friends with people around the world.\"
        }` }} />
      </head>
      <body>
        <Providers>
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 relative min-h-screen main-content">
            {children}
          </main>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
