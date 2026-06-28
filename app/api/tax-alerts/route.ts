import { NextResponse } from 'next/server';

// Sample tax alerts for demo - replace with real logic later
const DEMO_TAX_ALERTS = [
  {
    id: '1',
    severity: 'high',
    title: 'Estimated Tax Payment Due',
    description: 'Q2 2026 estimated tax payment of $12,500 is due by June 15, 2026.',
    deadline: '2026-06-15',
    code: 'IRC §6654',
  },
  {
    id: '2',
    severity: 'medium',
    title: 'Section 179 Depreciation Limit',
    description: 'You have $45,000 remaining in Section 179 deduction limit for 2026.',
    deadline: '2026-12-31',
    code: 'IRC §179',
  },
  {
    id: '3',
    severity: 'low',
    title: 'Retirement Contribution Opportunity',
    description: 'Consider maximizing SEP-IRA contribution up to $69,000 for 2026.',
    deadline: '2026-12-31',
    code: 'IRC §402(g)',
  },
  {
    id: '4',
    severity: 'high',
    title: 'Payroll Tax Deposit Due',
    description: 'Monthly payroll tax deposit of $8,200 is due by July 15, 2026.',
    deadline: '2026-07-15',
    code: 'IRC §6302',
  },
];

export async function GET() {
  return NextResponse.json({ alerts: DEMO_TAX_ALERTS });
}