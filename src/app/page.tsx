'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Cpu, MemoryStick, HardDrive, Clock, LayoutDashboard, Cloud, Shield, Activity } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import ServiceCard from '@/components/ServiceCard';
import VMCard from '@/components/VMCard';
import MonitorChart from '@/components/MonitorChart';

interface VM {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  netin: number;
  netout: number;
  cpus?: number;
}

interface NodeInfo {
  cpu: number;
  memory: { total: number; used: number; free: number };
  disk: { total: number; used: number; free: number };
  uptime: number;
  node: string;
}

interface ChartPoint {
  time: string;
  value: number;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const SERVICES = [
  { name: 'Dashboard', domain: 'admin.fanns.my.id', url: 'https://admin.fanns.my.id', icon: <LayoutDashboard size={22} />, colorClass: 'dashboard' },
  { name: 'Cloud Storage', domain: 'fanns.my.id', url: 'https://fanns.my.id', icon: <Cloud size={22} />, colorClass: 'cloud' },
  { name: 'Keycloak', domain: 'auth.fanns.my.id', url: 'https://auth.fanns.my.id', icon: <Shield size={22} />, colorClass: 'auth' },
  { name: 'Grafana Monitor', domain: 'monitor.fanns.my.id', url: 'https://monitor.fanns.my.id', icon: <Activity size={22} />, colorClass: 'monitor' },
];

const MAX_CHART_POINTS = 20;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [vms, setVms] = useState<VM[]>([]);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState('—');
  const [cpuHistory, setCpuHistory] = useState<ChartPoint[]>([]);
  const [memHistory, setMemHistory] = useState<ChartPoint[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session as any)?.isAdmin ?? true;

  const fetchData = useCallback(async () => {
    try {
      const [vmRes, nodeRes] = await Promise.all([
        fetch('/api/proxmox/vms'),
        fetch('/api/proxmox/nodes'),
      ]);

      if (vmRes.ok) {
        const vmData = await vmRes.json();
        setVms(vmData.data || []);
      }

      if (nodeRes.ok) {
        const nodeData = await nodeRes.json();
        const info = nodeData.data;
        setNodeInfo(info);

        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setCpuHistory(prev => {
          const next = [...prev, { time: now, value: (info.cpu || 0) * 100 }];
          return next.slice(-MAX_CHART_POINTS);
        });

        setMemHistory(prev => {
          const memPct = info.memory?.total > 0 ? (info.memory.used / info.memory.total) * 100 : 0;
          const next = [...prev, { time: now, value: memPct }];
          return next.slice(-MAX_CHART_POINTS);
        });
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      const interval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '5000', 10);
      pollRef.current = setInterval(fetchData, interval);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [status, fetchData]);

  const handleVMAction = async (vmid: number, action: string) => {
    try {
      const res = await fetch(`/api/proxmox/vms/${vmid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || 'Action failed'}`);
      }
      // Refresh after a short delay to let Proxmox process the action
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error('VM action error:', err);
      alert('Failed to perform action');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading dashboard...</div>
      </div>
    );
  }

  // Not authenticated — show login
  if (status === 'unauthenticated') {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">F</div>
          <div className="login-title">FannsPanel</div>
          <div className="login-subtitle">Sign in to manage your virtual machines</div>
          <button className="login-btn" onClick={() => signIn('keycloak')} id="btn-login">
            <Shield size={18} />
            Sign in with Keycloak
          </button>
        </div>
      </div>
    );
  }

  const runningVMs = vms.filter(v => v.status === 'running').length;
  const totalCPU = nodeInfo ? (nodeInfo.cpu * 100).toFixed(1) : '0';
  const totalMemPct = nodeInfo && nodeInfo.memory.total > 0 ? ((nodeInfo.memory.used / nodeInfo.memory.total) * 100).toFixed(1) : '0';
  const totalDiskPct = nodeInfo && nodeInfo.disk.total > 0 ? ((nodeInfo.disk.used / nodeInfo.disk.total) * 100).toFixed(1) : '0';

  return (
    <div className="app-layout">
      <Sidebar />
      <Header
        vmCount={vms.length}
        runningCount={runningVMs}
        onRefresh={fetchData}
        lastUpdated={lastUpdated}
      />

      <main className="main-content">
        {/* Stats Overview */}
        <div className="stats-grid">
          <StatsCard
            icon={<Cpu size={20} />}
            label="CPU Usage"
            value={`${totalCPU}%`}
            sub={nodeInfo ? `${nodeInfo.node} Node` : 'Loading...'}
            colorClass="indigo"
          />
          <StatsCard
            icon={<MemoryStick size={20} />}
            label="Memory"
            value={`${totalMemPct}%`}
            sub={nodeInfo ? `${formatBytes(nodeInfo.memory.used)} / ${formatBytes(nodeInfo.memory.total)}` : 'Loading...'}
            colorClass="green"
          />
          <StatsCard
            icon={<HardDrive size={20} />}
            label="Disk Usage"
            value={`${totalDiskPct}%`}
            sub={nodeInfo ? `${formatBytes(nodeInfo.disk.used)} / ${formatBytes(nodeInfo.disk.total)}` : 'Loading...'}
            colorClass="blue"
          />
          <StatsCard
            icon={<Clock size={20} />}
            label="Uptime"
            value={nodeInfo ? formatUptime(nodeInfo.uptime) : '—'}
            sub={`${runningVMs} of ${vms.length} VMs running`}
            colorClass="yellow"
          />
        </div>

        {/* Services */}
        <div className="section" style={{ animationDelay: '0.1s' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Services</div>
              <div className="section-subtitle">Quick access to your domains</div>
            </div>
          </div>
          <div className="services-grid">
            {SERVICES.map(s => (
              <ServiceCard key={s.domain} {...s} />
            ))}
          </div>
        </div>

        {/* Monitoring Charts */}
        <div className="section" style={{ animationDelay: '0.15s' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Monitoring</div>
              <div className="section-subtitle">Real-time node performance</div>
            </div>
          </div>
          <div className="charts-grid">
            <MonitorChart
              title="CPU Usage"
              data={cpuHistory}
              currentValue={totalCPU}
              subtitle="Node processor utilization"
              color="#6366f1"
              gradientId="cpuGrad"
            />
            <MonitorChart
              title="Memory Usage"
              data={memHistory}
              currentValue={totalMemPct}
              subtitle="Node memory utilization"
              color="#22c55e"
              gradientId="memGrad"
            />
          </div>
        </div>

        {/* VM List */}
        <div className="section" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Virtual Machines</div>
              <div className="section-subtitle">{vms.length} VMs on {nodeInfo?.node || 'node'}</div>
            </div>
          </div>
          <div className="vm-grid">
            {vms.map((vm, i) => (
              <VMCard
                key={vm.vmid}
                vm={vm}
                isAdmin={isAdmin}
                onAction={handleVMAction}
              />
            ))}
            {vms.length === 0 && (
              <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                No VMs found. Check your Proxmox connection settings.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
