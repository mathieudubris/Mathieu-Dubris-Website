'use client'
import React from 'react';
import styles from './home.module.css';
import Header from '@/components/app/Header/Header';
import Footer from '@/components/app/Footer/Footer';
import Section1 from '@/components/app/Home/Sections/Section1/Section1';
import Section2 from '@/components/app/Home/Sections/Section2/Section2';
import Section3 from '@/components/app/Home/Sections/Section3/Section3';
import Section4 from '@/components/app/Home/Sections/Section4/Section4';

export default function HomePage() {
  return (
    <div className={styles.mainContainer}>
      <Header />
      
      <main className={styles.content}>
        {/* Ajout des IDs pour l'ancrage du menu */}
        <div id="section1"><Section1 /></div>
        <div id="section2"><Section2 /></div>
        <div id="section3"><Section3 /></div>
        <div id="section4"><Section4 /></div>
      </main>

      <Footer />
    </div>
  );
}