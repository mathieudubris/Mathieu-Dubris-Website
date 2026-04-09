import type { Metadata } from 'next';
import React from 'react';
import styles from './home.module.css';
import Header from '@/components/app/Header/Header';
import Footer from '@/components/app/Footer/Footer';
import Section1 from '@/components/app/Home/Sections/Section1/Section1';
import Section2 from '@/components/app/Home/Sections/Section2/Section2';
import Section3 from '@/components/app/Home/Sections/Section3/Section3';
import Section4 from '@/components/app/Home/Sections/Section4/Section4';
import Section5 from '@/components/app/Home/Sections/Section5/Section5';

export const metadata: Metadata = {
  title: 'Mathieu Dubris — Développeur Full Stack Freelance',
  description: 'Mathieu Dubris : développeur full stack freelance. Création de sites web, applications, formations et outils SaaS. Transformez vos idées en réalité digitale.',
  keywords: [
    'Mathieu Dubris',
    'MathieuDubris',
    'développeur full stack freelance',
    'création site web',
    'applications web',
    'formations programmation',
    'outils SaaS',
    'portfolio développeur',
  ],
  alternates: {
    // /home pointe vers / car c'est la même page conceptuellement
    canonical: 'https://mathieu-dubris.web.app',
  },
  openGraph: {
    title: 'Mathieu Dubris — Développeur Full Stack Freelance',
    description: 'Développeur full stack freelance - Transformez vos idées en réalité digitale',
    url: 'https://mathieu-dubris.web.app/home',
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

export default function HomePage() {
  return (
    <div className={styles.mainContainer}>
      <Header />
      <main className={styles.content}>
        <div id="section1"><Section1 /></div>
        <div id="section2"><Section2 /></div>
        <div id="section3"><Section3 /></div>
        <div id="section4"><Section4 /></div>
        <div id="section5"><Section5 /></div>
      </main>
      <Footer />
    </div>
  );
}