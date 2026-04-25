import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listVMs } from '@/lib/proxmox';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const vms = await listVMs();
    return NextResponse.json({ data: vms });
  } catch (error) {
    console.error('Failed to fetch VMs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VMs', details: String(error) },
      { status: 500 }
    );
  }
}
