"use client";

import { usePathname } from 'next/navigation';
import CTA from '@/components/services/formation/CTA';

// Affiche le CTA sur toutes les pages sauf la splash screen "/"
export default function CTAWrapper() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <CTA
      whatsappNumber="0342526948"
      calendarUrl="/services/booking"
    />
  );
}