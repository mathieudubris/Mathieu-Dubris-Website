// app/elevate/page.tsx
'use client'
import React from 'react';
import Header from '@/components/app/Header/Header';
import Elevate from '@/components/app/Elevate/Elevate';
import styles from './elevate.module.css';

export default function ElevatePage() {
  return (
    <div className={styles.mainContainer}>
      <Header />
      <Elevate />
    </div>
  );
}