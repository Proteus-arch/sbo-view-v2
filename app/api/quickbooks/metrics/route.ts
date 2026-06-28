import { NextResponse } from 'next/server';

export async function GET() {
  // Return demo data since QuickBooks isn't connected
  return NextResponse.json({
    cash: 125000,
    ar: 45000,
    inventory: 32000,
    currentLiabilities: 28000,
    longTermDebt: 150000,
    revenue: 850000,
    netIncome: 125000,
    operatingExpenses: 680000,
    costOfGoodsSold: 340000,
  });
}