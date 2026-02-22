"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin } from 'lucide-react';
import { ProjectTeamMember, getRoleColorClass } from './page';
import styles from './cardView.module.css';

interface CardViewProps {
  member: ProjectTeamMember;
  index: number;
  shouldShowInfo: (isPublic: boolean) => boolean;
  onClick: () => void;
}

export default function CardView({ member, index, shouldShowInfo, onClick }: CardViewProps) {
  const [hovered, setHovered] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const visibleCount = 2;
  const hasMore = member.roles.length > visibleCount;
  const extraCount = member.roles.length - visibleCount;

  // Slide animation on hover
  useEffect(() => {
    if (!hovered || !hasMore) {
      // Reset position when not hovered
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setTranslateX(0);
      return;
    }

    let start: number | null = null;
    const speed = 40; // px per second
    let totalWidth = 0;

    if (trackRef.current) {
      totalWidth = trackRef.current.scrollWidth / 2; // half because we duplicate
    }

    const animate = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = (ts - start) / 1000;
      const newX = -(elapsed * speed) % totalWidth;
      setTranslateX(newX);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hovered, hasMore]);

  const ageVisible = shouldShowInfo(member.agePublic) && member.age > 0;
  const locationText = [member.location?.city, member.location?.country].filter(Boolean).join(', ') || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={styles.card}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <div className={styles.photoWrap}>
        {member.image ? (
          <img
            src={member.image}
            alt={`${member.firstName} ${member.lastName}`}
            className={styles.photo}
          />
        ) : (
          <div className={styles.photoPlaceholder}>
            <User size={48} />
          </div>
        )}
      </div>

      {/* Info body */}
      <div className={styles.body}>
        {/* Last name */}
        <p className={styles.lastName}>{member.lastName}</p>

        {/* First name */}
        <p className={styles.firstName}>{member.firstName}</p>

        {/* Age — always reserves space */}
        <p className={styles.age}>
          {ageVisible ? `${member.age} ans` : <span className={styles.agePlaceholder}>&nbsp;</span>}
        </p>

        {/* Location */}
        <p className={styles.location}>
          <MapPin size={10} className={styles.locationIcon} />
          <span>{locationText}</span>
        </p>

        {/* Roles strip */}
        <div className={styles.rolesWrap} ref={containerRef}>
          {!hovered || !hasMore ? (
            // Static view: visible roles + +N badge
            <div className={styles.rolesStatic}>
              {member.roles.slice(0, visibleCount).map((role, i) => {
                const cc = getRoleColorClass(role);
                return (
                  <span key={i} className={`${styles.roleTag} ${styles[cc]}`}>
                    {role}
                  </span>
                );
              })}
              {hasMore && (
                <span className={styles.moreTag}>+{extraCount}</span>
              )}
            </div>
          ) : (
            // Sliding marquee view
            <div className={styles.marqueeClip}>
              <div
                ref={trackRef}
                className={styles.marqueeTrack}
                style={{ transform: `translateX(${translateX}px)` }}
              >
                {/* Duplicate roles for infinite loop effect */}
                {[...member.roles, ...member.roles].map((role, i) => {
                  const cc = getRoleColorClass(role);
                  return (
                    <span key={i} className={`${styles.roleTag} ${styles[cc]}`}>
                      {role}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
