import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    last_updated: '2026-03-15',
    next_update: '2026-06-15',
    total_records: 2847,
    status: 'active',
  });
}