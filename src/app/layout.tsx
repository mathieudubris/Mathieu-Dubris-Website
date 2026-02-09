import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UsersProvider } from '@/utils/UserContext'; // AJOUT
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'Mathieu Dubris',
    template: 'Mathieu Dubris',
  },
  description:
    'Deviens tout ce que tu veux avec nous. Transformez vos idées en réalité.Tout votre développement digital à un seul endroit.',
  keywords: [
    'Mathieu Dubris',
    'développeur full stack freelance',
    'écosystème digital',
    'services développement web',
    'formations programmation',
    'outils SaaS',
    'gestion de licences',
    'portfolio technique',
    'solutions digitales complètes',
  ],
  authors: [{ name: 'Mathieu Dubris' }],
  creator: 'Mathieu Dubris',
  other: {
    'google-site-verification': "6rmx2FsCUl4O1Q_NMxJd0MJJUjnzwKRBkcnnxq-0mqk",
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
        {/* Google Analytics Script */}
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
      </head>
      <body>
        <ThemeProvider>
          <UsersProvider> {/* ENVELOPPE TOUTE L'APPLICATION */}
            <div className="app-wrapper">{children}</div>
          </UsersProvider>
        </ThemeProvider>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"></script>
      </body>
    </html>
  );
}