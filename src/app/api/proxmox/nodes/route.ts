import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNodeStatus, getNodeName } from '@/lib/proxmox';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getNodeStatus();
    const nodeName = getNodeName();
    return NextResponse.json({ data: { ...status, node: nodeName } });
  } catch (error) {
    console.error('Failed to fetch node status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node status', details: String(error) },
      { status: 500 }
    );
  }
}
