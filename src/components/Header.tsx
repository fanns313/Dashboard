'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  vmCount: number;
  runningCount: number;
  onRefresh: () => void;
  lastUpdated: string;
}

export default function Header({ vmCount, runningCount, onRefresh, lastUpdated }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <div className="header-title">Dashboard Overview</div>
        <div className="header-subtitle">Last updated: {lastUpdated}</div>
      </div>
      <div className="header-actions">
        <div className="header-badge">
          <span className="header-badge-dot" />
          {runningCount}/{vmCount} VMs Running
        </div>
        <button
          className="vm-action-btn"
          onClick={onRefresh}
          style={{ padding: '8px 14px', gap: 6 }}
          id="btn-refresh"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    </header>
  );
}
