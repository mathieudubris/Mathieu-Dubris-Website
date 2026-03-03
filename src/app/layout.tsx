import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/utils/ThemeProvider';
import { UsersProvider } from '@/utils/UserContext';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'Mathieu Dubris - Développeur Full Stack Freelance',
    template: '%s | Mathieu Dubris',
  },
  description: 'Mathieu Dubris : développeur full stack freelance. Création de sites web, applications, formations et outils SaaS. Transformez vos idées en réalité digitale.',
  keywords: [
    'Mathieu Dubris',
    'MathieuDubris',
    'Mathieu Du',
    'développeur full stack freelance',
    'écosystème digital',
    'services développement web',
    'formations programmation',
    'outils SaaS',
    'gestion de licences',
    'portfolio technique',
    'solutions digitales complètes',
    'Mathieu Dubrix',
    'Mathieu Dubri',
  ],
  authors: [{ name: 'Mathieu Dubris', url: 'https://mathieu-dubris.web.app' }],
  creator: 'Mathieu Dubris',
  publisher: 'Mathieu Dubris',
  openGraph: {
    title: 'Mathieu Dubris - Écosystème Digital Complet',
    description: 'Développeur full stack freelance - Transformez vos idées en réalité digitale',
    url: 'https://mathieu-dubris.web.app',
    siteName: 'Mathieu Dubris',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mathieu Dubris - Développeur Full Stack',
    description: 'Transformez vos idées en réalité digitale',
    creator: '@mathieudubris',
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
    google: '6rmx2FsCUl4O1Q_NMxJd0MJJUjnzwKRBkcnnxq-0mqk',
  },
  alternates: {
    canonical: 'https://mathieu-dubris.web.app',
  },
  other: {
    'google-site-verification': '6rmx2FsCUl4O1Q_NMxJd0MJJUjnzwKRBkcnnxq-0mqk',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="canonical" href="https://mathieu-dubris.web.app" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="format-detection" content="telephone=no" />
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-B3ZL2MHVVN"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-B3ZL2MHVVN');
            `,
          }}
        />
        {/* Schema.org markup pour Google */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Mathieu Dubris",
              "alternateName": "MathieuDubris",
              "url": "https://mathieu-dubris.web.app",
              "sameAs": [
                // Ajoutez vos réseaux sociaux ici
              ],
              "jobTitle": "Développeur Full Stack Freelance",
              "worksFor": {
                "@type": "Organization",
                "name": "Mathieu Dubris Digital"
              }
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <UsersProvider>
            <div className="app-wrapper">{children}</div>
          </UsersProvider>
        </ThemeProvider>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"></script>
      </body>
    </html>
  );
}