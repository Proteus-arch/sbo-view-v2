import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    last_updated: 'March 15, 2026',
    next_update: 'June 15, 2026',
    total_records: 2847,
    status: 'active',
    error: null,
  });
}