import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVMStatus } from '@/lib/proxmox';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vmid: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { vmid } = await params;
  const vmidNum = parseInt(vmid, 10);
  if (isNaN(vmidNum)) {
    return NextResponse.json({ error: 'Invalid VM ID' }, { status: 400 });
  }

  try {
    const status = await getVMStatus(vmidNum);
    return NextResponse.json({ data: status });
  } catch (error) {
    console.error(`Failed to fetch VM ${vmid} status:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch VM status', details: String(error) },
      { status: 500 }
    );
  }
}
