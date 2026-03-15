"use client";

import React, { useState, useEffect } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const suggestions = [
  "Rechercher un projet...",
  "Rechercher un blog...",
  "Rechercher une actualité...",
  "Rechercher une formation...",
];

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 1800);
      return () => clearTimeout(pauseTimer);
    }

    const currentText = suggestions[suggestionIndex];

    if (!isDeleting) {
      if (charIndex < currentText.length) {
        const timer = setTimeout(() => {
          setDisplayedPlaceholder(currentText.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }, 55);
        return () => clearTimeout(timer);
      } else {
        setIsPaused(true);
      }
    } else {
      if (charIndex > 0) {
        const timer = setTimeout(() => {
          setDisplayedPlaceholder(currentText.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        }, 30);
        return () => clearTimeout(timer);
      } else {
        setIsDeleting(false);
        setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      }
    }
  }, [charIndex, isDeleting, isPaused, suggestionIndex]);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder={displayedPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className={styles.searchIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;