// app/admin/layout.tsx
"use client";

import React from 'react';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="admin-layout">
        {children}
      </div>
    </AdminGuard>
  );
}