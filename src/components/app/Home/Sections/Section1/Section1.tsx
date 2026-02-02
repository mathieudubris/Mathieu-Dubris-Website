"use client";

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Section1.module.css';
import Left from './Left/Left';
import Right from './Right/Right';

const SectionOne: React.FC = () => {
  return (
    <section className={styles.sectionOne}>
      <div className={styles.container}>
        <div className={`${styles.sectionHalf} ${styles.leftSide}`}>
          <Left />
        </div>
        <div className={`${styles.sectionHalf} ${styles.rightSide}`}>
          <Right />
        </div>
      </div>
    </section>
  );
};

export default SectionOne;