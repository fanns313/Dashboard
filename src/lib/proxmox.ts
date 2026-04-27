/**
 * Proxmox VE API Client
 * Server-side only — credentials never exposed to browser
 */

const PROXMOX_HOST = process.env.PROXMOX_HOST || 'https://localhost:8006';
const PROXMOX_TOKEN_ID = process.env.PROXMOX_TOKEN_ID || '';
const PROXMOX_TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET || '';
const PROXMOX_NODE = process.env.PROXMOX_NODE || 'pve';
const ALLOW_SELF_SIGNED = process.env.PROXMOX_ALLOW_SELF_SIGNED === 'true';

// Types
export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  netin: number;
  netout: number;
  pid?: number;
  cpus?: number;
  tags?: string;
}

export interface ProxmoxNodeStatus {
  cpu: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
  loadavg: number[];
  cpuinfo: {
    cores: number;
    model: string;
    sockets: number;
  };
}

export interface VMDetail {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  cpus: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  netin: number;
  netout: number;
  pid?: number;
  ha: { managed: number };
}

export type VMAction = 'start' | 'stop' | 'shutdown' | 'reset';

/**
 * Make authenticated request to Proxmox API
 */
async function proxmoxFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${PROXMOX_HOST}/api2/json${path}`;
  
  const fetchOptions: RequestInit & { agent?: unknown } = {
    ...options,
    headers: {
      'Authorization': `PVEAPIToken=${PROXMOX_TOKEN_ID}=${PROXMOX_TOKEN_SECRET}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  };

  // Handle self-signed certificates in Node.js native fetch
  if (ALLOW_SELF_SIGNED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Proxmox API error: ${response.status} - ${errorText}`);
  }
  
  return response;
}

/**
 * List all VMs on the configured node
 */
export async function listVMs(): Promise<ProxmoxVM[]> {
  const response = await proxmoxFetch(`/nodes/${PROXMOX_NODE}/qemu`);
  const data = await response.json();
  return data.data || [];
}

/**
 * Get detailed status of a specific VM
 */
export async function getVMStatus(vmid: number): Promise<VMDetail> {
  const response = await proxmoxFetch(`/nodes/${PROXMOX_NODE}/qemu/${vmid}/status/current`);
  const data = await response.json();
  return data.data;
}

/**
 * Perform an action on a VM (start, stop, shutdown, reset)
 */
export async function performVMAction(vmid: number, action: VMAction): Promise<string> {
  const validActions: VMAction[] = ['start', 'stop', 'shutdown', 'reset'];
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action: ${action}`);
  }

  const response = await proxmoxFetch(`/nodes/${PROXMOX_NODE}/qemu/${vmid}/status/${action}`, {
    method: 'POST',
  });
  const data = await response.json();
  return data.data; // Returns UPID (task ID)
}

/**
 * Get node status (CPU, RAM, disk, etc.)
 */
export async function getNodeStatus(): Promise<ProxmoxNodeStatus> {
  const response = await proxmoxFetch(`/nodes/${PROXMOX_NODE}/status`);
  const data = await response.json();
  const d = data.data;

  return {
    cpu: d.cpu || 0,
    memory: {
      total: d.memory?.total || 0,
      used: d.memory?.used || 0,
      free: d.memory?.free || 0,
    },
    disk: {
      total: d.rootfs?.total || 0,
      used: d.rootfs?.used || 0,
      free: d.rootfs?.avail || 0,
    },
    uptime: d.uptime || 0,
    loadavg: d.loadavg || [0, 0, 0],
    cpuinfo: {
      cores: d.cpuinfo?.cores || 0,
      model: d.cpuinfo?.model || 'Unknown',
      sockets: d.cpuinfo?.sockets || 1,
    },
  };
}

/**
 * Get the configured node name
 */
export function getNodeName(): string {
  return PROXMOX_NODE;
}
