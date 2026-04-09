import type { Metadata } from 'next';
import SplashClient from '@/app/SplashClient';

export const metadata: Metadata = {
  title: 'Mathieu Dubris — Développeur Full Stack Freelance',
  description: 'Mathieu Dubris : développeur full stack freelance. Création de sites web, applications, formations et outils SaaS. Transformez vos idées en réalité digitale.',
  keywords: [
    'Mathieu Dubris',
    'MathieuDubris',
    'Mathieu Du',
    'développeur full stack freelance',
    'création site web',
    'applications web',
    'formations programmation',
    'outils SaaS',
    'portfolio développeur',
    'solutions digitales complètes',
    'Mathieu Dubrix',
    'Mathieu Dubri',
  ],
  alternates: {
    canonical: 'https://mathieu-dubris.web.app',
  },
  openGraph: {
    title: 'Mathieu Dubris — Développeur Full Stack Freelance',
    description: 'Développeur full stack freelance - Transformez vos idées en réalité digitale',
    url: 'https://mathieu-dubris.web.app',
    siteName: 'Mathieu Dubris',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mathieu Dubris — Développeur Full Stack Freelance',
    description: 'Transformez vos idées en réalité digitale',
    creator: '@mathieudubris',
  },
};

export default function RootPage() {
  return <SplashClient />;
}