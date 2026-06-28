import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    lastUpdated: '2026-03-15',
    nextUpdate: '2026-06-15',
    totalRecords: 2847,
    status: 'active',
  });
}