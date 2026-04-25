'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Server, Globe, LogOut, Monitor } from 'lucide-react';

export default function Sidebar() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || 'admin@fanns.my.id';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">F</div>
        <div>
          <div className="sidebar-logo-text">FannsPanel</div>
          <div className="sidebar-logo-sub">VM Management</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        <button className="sidebar-nav-item active" id="nav-dashboard">
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <div className="sidebar-section-label">Services</div>
        <a href="https://admin.fanns.my.id" target="_blank" rel="noopener noreferrer" className="sidebar-nav-item" id="nav-admin">
          <Monitor size={18} />
          Admin Panel
        </a>
        <a href="https://fanns.my.id" target="_blank" rel="noopener noreferrer" className="sidebar-nav-item" id="nav-cloud">
          <Globe size={18} />
          Cloud Storage
        </a>
        <a href="https://auth.fanns.my.id" target="_blank" rel="noopener noreferrer" className="sidebar-nav-item" id="nav-keycloak">
          <Server size={18} />
          Keycloak
        </a>
        <a href="https://monitor.fanns.my.id" target="_blank" rel="noopener noreferrer" className="sidebar-nav-item" id="nav-grafana">
          <LayoutDashboard size={18} />
          Grafana Monitor
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{userEmail}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={() => signOut()} id="btn-logout">
          <LogOut size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
