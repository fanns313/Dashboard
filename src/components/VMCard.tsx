'use client';

import React, { useState } from 'react';
import { Play, Square, RotateCw, Server, ArrowDown, ArrowUp } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

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

interface VMCardProps {
  vm: VM;
  isAdmin: boolean;
  onAction: (vmid: number, action: string) => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function VMCard({ vm, isAdmin, onAction }: VMCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ action: string; title: string; message: string } | null>(null);

  const cpuPercent = vm.cpus ? (vm.cpu * 100) : (vm.cpu * 100);
  const memPercent = vm.maxmem > 0 ? (vm.mem / vm.maxmem) * 100 : 0;
  const diskPercent = vm.maxdisk > 0 ? (vm.disk / vm.maxdisk) * 100 : 0;

  const handleAction = async (action: string) => {
    setDialog(null);
    setLoading(action);
    try {
      await onAction(vm.vmid, action);
    } finally {
      setLoading(null);
    }
  };

  const confirmAction = (action: string) => {
    const messages: Record<string, { title: string; message: string }> = {
      start: { title: 'Start VM', message: `Are you sure you want to start VM "${vm.name}" (${vm.vmid})?` },
      stop: { title: 'Stop VM', message: `This will forcefully stop VM "${vm.name}" (${vm.vmid}). Unsaved data may be lost.` },
      shutdown: { title: 'Shutdown VM', message: `This will gracefully shutdown VM "${vm.name}" (${vm.vmid}).` },
      reset: { title: 'Reboot VM', message: `This will reboot VM "${vm.name}" (${vm.vmid}). All connections will be interrupted.` },
    };
    setDialog({ action, ...messages[action] });
  };

  const isRunning = vm.status === 'running';
  const isStopped = vm.status === 'stopped';

  return (
    <>
      <div className="vm-card" id={`vm-card-${vm.vmid}`}>
        <div className="vm-card-header">
          <div className="vm-card-info">
            <div className="vm-card-icon">
              <Server size={20} />
            </div>
            <div>
              <div className="vm-card-name">{vm.name || `VM ${vm.vmid}`}</div>
              <div className="vm-card-id">VMID: {vm.vmid}</div>
            </div>
          </div>
          <div className={`vm-status-badge ${vm.status}`}>
            <span className={`vm-status-dot ${vm.status}`} />
            {vm.status.charAt(0).toUpperCase() + vm.status.slice(1)}
          </div>
        </div>

        <div className="vm-card-metrics">
          <div className="vm-metric">
            <div className="vm-metric-header">
              <span className="vm-metric-label">CPU</span>
              <span className="vm-metric-value">{cpuPercent.toFixed(1)}%</span>
            </div>
            <div className="vm-metric-bar">
              <div className="vm-metric-fill cpu" style={{ width: `${Math.min(cpuPercent, 100)}%` }} />
            </div>
          </div>
          <div className="vm-metric">
            <div className="vm-metric-header">
              <span className="vm-metric-label">Memory</span>
              <span className="vm-metric-value">{memPercent.toFixed(1)}%</span>
            </div>
            <div className="vm-metric-bar">
              <div className="vm-metric-fill mem" style={{ width: `${Math.min(memPercent, 100)}%` }} />
            </div>
          </div>
          <div className="vm-metric">
            <div className="vm-metric-header">
              <span className="vm-metric-label">Disk</span>
              <span className="vm-metric-value">{formatBytes(vm.disk)} / {formatBytes(vm.maxdisk)}</span>
            </div>
            <div className="vm-metric-bar">
              <div className="vm-metric-fill disk" style={{ width: `${Math.min(diskPercent, 100)}%` }} />
            </div>
          </div>
          <div className="vm-metric">
            <div className="vm-metric-header">
              <span className="vm-metric-label">RAM</span>
              <span className="vm-metric-value">{formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}</span>
            </div>
            <div className="vm-metric-bar">
              <div className="vm-metric-fill mem" style={{ width: `${Math.min(memPercent, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="vm-card-network">
          <div className="vm-net-item">
            <ArrowDown size={14} className="vm-net-icon" />
            <span>In: {formatBytes(vm.netin)}</span>
          </div>
          <div className="vm-net-item">
            <ArrowUp size={14} className="vm-net-icon out" />
            <span>Out: {formatBytes(vm.netout)}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="vm-card-actions">
            <button
              className="vm-action-btn start"
              disabled={isRunning || loading !== null}
              onClick={() => confirmAction('start')}
              id={`vm-${vm.vmid}-start`}
            >
              {loading === 'start' ? <span className="spinner" /> : <Play size={14} />}
              Start
            </button>
            <button
              className="vm-action-btn stop"
              disabled={isStopped || loading !== null}
              onClick={() => confirmAction('shutdown')}
              id={`vm-${vm.vmid}-stop`}
            >
              {loading === 'shutdown' ? <span className="spinner" /> : <Square size={14} />}
              Stop
            </button>
            <button
              className="vm-action-btn reboot"
              disabled={isStopped || loading !== null}
              onClick={() => confirmAction('reset')}
              id={`vm-${vm.vmid}-reboot`}
            >
              {loading === 'reset' ? <span className="spinner" /> : <RotateCw size={14} />}
              Reboot
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        confirmLabel={dialog?.action === 'stop' || dialog?.action === 'shutdown' ? 'Stop VM' : dialog?.action === 'reset' ? 'Reboot VM' : 'Start VM'}
        danger={dialog?.action === 'stop' || dialog?.action === 'shutdown' || dialog?.action === 'reset'}
        onConfirm={() => dialog && handleAction(dialog.action)}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
