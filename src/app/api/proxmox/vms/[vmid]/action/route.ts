import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { performVMAction, VMAction } from '@/lib/proxmox';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vmid: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session as any).isAdmin;
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin role required' },
      { status: 403 }
    );
  }

  const { vmid } = await params;
  const vmidNum = parseInt(vmid, 10);
  if (isNaN(vmidNum)) {
    return NextResponse.json({ error: 'Invalid VM ID' }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = body.action as VMAction;
  const validActions: VMAction[] = ['start', 'stop', 'shutdown', 'reset'];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const upid = await performVMAction(vmidNum, action);
    return NextResponse.json({
      data: { upid, message: `VM ${vmidNum} ${action} initiated` }
    });
  } catch (error) {
    console.error(`Failed to ${action} VM ${vmid}:`, error);
    return NextResponse.json(
      { error: `Failed to ${action} VM`, details: String(error) },
      { status: 500 }
    );
  }
}
