'use client';

import React from 'react';
import { AdminDashboard } from '@/components/admin/Dashboard';
import { AdminKeyGate } from '@/components/admin/AdminKeyGate';

export default function AdminPage() {
  return (
    <AdminKeyGate>
      <AdminDashboard />
    </AdminKeyGate>
  );
}
