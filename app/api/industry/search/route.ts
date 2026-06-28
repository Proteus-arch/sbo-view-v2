import { NextResponse } from 'next/server';

const INDUSTRIES = [
  { naics_code: '722511', industry_name: 'Full-Service Restaurants' },
  { naics_code: '722513', industry_name: 'Limited-Service Restaurants' },
  { naics_code: '236220', industry_name: 'Commercial Building Construction' },
  { naics_code: '238220', industry_name: 'Plumbing, Heating & Air-Conditioning Contractors' },
  { naics_code: '333998', industry_name: 'General Purpose Machinery Manufacturing' },
  { naics_code: '339950', industry_name: 'Sign Manufacturing' },
  { naics_code: '445110', industry_name: 'Supermarkets and Other Grocery Stores' },
  { naics_code: '453910', industry_name: 'Pet and Pet Supplies Stores' },
  { naics_code: '541211', industry_name: 'Offices of Certified Public Accountants' },
  { naics_code: '541512', industry_name: 'Computer Systems Design Services' },
  { naics_code: '541611', industry_name: 'Administrative Management Consulting' },
  { naics_code: '621111', industry_name: 'Offices of Physicians' },
  { naics_code: '621210', industry_name: 'Offices of Dentists' },
  { naics_code: '484110', industry_name: 'General Freight Trucking, Local' },
  { naics_code: '531210', industry_name: 'Offices of Real Estate Agents and Brokers' },
  { naics_code: '611420', industry_name: 'Computer Training' },
  { naics_code: '811111', industry_name: 'General Automotive Repair' },
  { naics_code: '423830', industry_name: 'Industrial Machinery Wholesalers' },
  { naics_code: '713910', industry_name: 'Golf Courses and Country Clubs' },
  { naics_code: '115210', industry_name: 'Support Activities for Animal Production' },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.toLowerCase() || '';

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const results = INDUSTRIES.filter(ind => 
    ind.industry_name.toLowerCase().includes(query) ||
    ind.naics_code.includes(query)
  ).slice(0, 10);

  return NextResponse.json(results);
}