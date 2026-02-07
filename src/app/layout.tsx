import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider'; // Créez ce fichier

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
        <ThemeProvider> {/* Ajoutez le ThemeProvider ici */}
          <div className="app-wrapper">{children}</div>
        </ThemeProvider>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"></script>
      </body>
    </html>
  );
}