'use client';

import React from 'react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  colorClass: string;
}

export default function StatsCard({ icon, label, value, sub, colorClass }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${colorClass}`}>{icon}</div>
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-sub">{sub}</div>
    </div>
  );
}
