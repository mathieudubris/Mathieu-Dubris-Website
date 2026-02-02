import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Mathieu Dubris',
    template: '%s | Mathieu Dubris',
  },
  description:
    'Plateforme digitale de Mathieu Dubris : développement web et logiciel, services numériques, projets en cours, blog et formations.',
  keywords: [
    'Mathieu Dubris',
    'développeur full stack',
    'développement web',
    'services numériques',
    'logiciel',
    'automation',
    'blog tech',
    'formation informatique',
  ],
  authors: [{ name: 'Mathieu Dubris' }],
  creator: 'Mathieu Dubris',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="app-wrapper">{children}</div>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"></script>
      </body>
    </html>
  );
}
