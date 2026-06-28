import { NextResponse } from 'next/server';

// Sample tax alerts for demo - replace with real logic later
const DEMO_TAX_ALERTS = [
  {
    id: '1',
    section: 'IRC §6654',
    title: 'Estimated Tax Payment Due',
    text: 'Q2 2026 estimated tax payment of $12,500 is due by June 15, 2026. Missing this deadline may result in penalties and interest charges.',
    source_url: 'https://www.irs.gov/payments/estimated-taxes',
    effective_date: '2026-06-15',
    priority: 'high',
  },
  {
    id: '2',
    section: 'IRC §179',
    title: 'Section 179 Depreciation Limit',
    text: 'You have $45,000 remaining in Section 179 deduction limit for 2026. Consider accelerating equipment purchases before year-end to maximize deductions.',
    source_url: 'https://www.irs.gov/publications/p946',
    effective_date: '2026-12-31',
    priority: 'medium',
  },
  {
    id: '3',
    section: 'IRC §402(g)',
    title: 'Retirement Contribution Opportunity',
    text: 'Consider maximizing SEP-IRA contribution up to $69,000 for 2026. This reduces taxable income while building retirement savings.',
    source_url: 'https://www.irs.gov/retirement-plans',
    effective_date: '2026-12-31',
    priority: 'low',
  },
  {
    id: '4',
    section: 'IRC §6302',
    title: 'Payroll Tax Deposit Due',
    text: 'Monthly payroll tax deposit of $8,200 is due by July 15, 2026. Late deposits incur penalties starting at 2% of the unpaid amount.',
    source_url: 'https://www.irs.gov/businesses/employment-taxes',
    effective_date: '2026-07-15',
    priority: 'high',
  },
];

export async function GET() {
  return NextResponse.json({ alerts: DEMO_TAX_ALERTS });
}