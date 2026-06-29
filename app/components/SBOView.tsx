'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  Shield,
  Building2,
  Tag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Target,
  ListChecks,
  PieChart as PieIcon,
  SlidersHorizontal,
  AlertOctagon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  GitFork,
  Landmark,
  X,
} from 'lucide-react';
import IRCAlertsPanel from './IRCAlertsPanel';
import DynamicIndustryWidget from './DynamicIndustryWidget';
import cashRunwayBelowControls from '../data/controls/naics_cash_runway_below_controls.json';
import cashRunwayAboveControls from '../data/controls/naics_cash_runway_above_controls.json';
import dsoFastControls from '../data/controls/naics_dso_fast_controls.json';
import dsoSlowControls from '../data/controls/naics_dso_slow_controls.json';
import grossMarginAboveControls from '../data/controls/naics_gross_margin_above_controls.json';
import grossMarginBelowControls from '../data/controls/naics_gross_margin_below_controls.json';
import operatingMarginAboveControls from '../data/controls/naics_operating_margin_above_controls.json';
import operatingMarginBelowControls from '../data/controls/naics_operating_margin_below_controls.json';
import costStructureControls from '../data/controls/naics_cost_structure_controls.json';
import currentRatioAboveControls from '../data/controls/naics_current_ratio_above_controls.json';
import currentRatioBelowControls from '../data/controls/naics_current_ratio_below_controls.json';
import debtToEquityAboveControls from '../data/controls/naics_debt_to_equity_above_controls.json';
import debtToEquityBelowControls from '../data/controls/naics_debt_to_equity_below_controls.json';

type ControlFile = {
  naics_4digit_overrides?: Record<string, { title: string; controls: any[] }>;
  sector_controls?: Record<string, { sector: string; controls: any[] }>;
  sector_growth_controls?: Record<string, { sector: string; controls: any[] }>;
  universal_controls?: any[];
  universal_cash_preservation?: any[];
  universal_growth_controls?: any[];
  [key: string]: any;
};

interface InternalControl {
  id: string;
  title: string;
  description: string;
  effort?: string;
  impact_days?: number;
  cash_impact_days?: number;
  category?: string;
  audit_trail?: string;
}

// =============================================================================
// COMPREHENSIVE NAICS DATA STRUCTURE
// =============================================================================
const FOUR_DIGIT_NAICS: Record<string, string> = {
  '1111': 'Oilseed and Grain Farming',
  '1121': 'Cattle Ranching and Farming',
  '2111': 'Oil and Gas Extraction',
  '2121': 'Coal Mining',
  '2211': 'Electric Power Generation, Transmission and Distribution',
  '2212': 'Natural Gas Distribution',
  '2361': 'Residential Building Construction',
  '2362': 'Nonresidential Building Construction',
  '2381': 'Foundation, Structure, and Building Exterior Contractors',
  '2382': 'Building Equipment Contractors',
  '2383': 'Building Finishing Contractors',
  '3111': 'Animal Food Manufacturing',
  '3112': 'Grain and Oilseed Milling',
  '3118': 'Bakeries and Tortilla Manufacturing',
  '3151': 'Apparel Knitting Mills',
  '3152': 'Cut and Sew Apparel Manufacturing',
  '3211': 'Sawmills and Wood Preservation',
  '3231': 'Printing and Related Support Activities',
  '3241': 'Petroleum and Coal Products Manufacturing',
  '3251': 'Basic Chemical Manufacturing',
  '3261': 'Plastics Product Manufacturing',
  '3311': 'Iron and Steel Mills and Ferroalloy Manufacturing',
  '3321': 'Forging and Stamping',
  '3331': 'Agriculture, Construction, and Mining Machinery Manufacturing',
  '3341': 'Computer and Peripheral Equipment Manufacturing',
  '3351': 'Electric Lighting Equipment Manufacturing',
  '3361': 'Motor Vehicle Manufacturing',
  '4231': 'Motor Vehicle and Motor Vehicle Parts Merchant Wholesalers',
  '4232': 'Furniture and Home Furnishing Merchant Wholesalers',
  '4244': 'Grocery and Related Product Merchant Wholesalers',
  '4411': 'Automobile Dealers',
  '4412': 'Other Motor Vehicle Dealers',
  '4431': 'Electronics and Appliance Stores',
  '4441': 'Building Material and Supplies Dealers',
  '4451': 'Grocery and Convenience Retailers',
  '4471': 'Gasoline Stations',
  '4481': 'Clothing Stores',
  '4523': 'General Merchandise Stores',
  '4532': 'Office Supplies, Stationery, and Gift Stores',
  '4811': 'Scheduled Air Transportation',
  '4841': 'General Freight Trucking',
  '4853': 'Taxi and Limousine Service',
  '4921': 'Couriers and Express Delivery Services',
  '5111': 'Newspaper, Periodical, Book, and Directory Publishers',
  '5121': 'Motion Picture and Video Industries',
  '5171': 'Wired Telecommunications Carriers',
  '5182': 'Data Processing, Hosting, and Related Services',
  '5211': 'Monetary Authorities-Central Bank',
  '5221': 'Depository Credit Intermediation',
  '5231': 'Securities and Commodity Contracts Intermediation and Brokerage',
  '5241': 'Insurance Carriers',
  '5311': 'Lessors of Real Estate',
  '5321': 'Automotive Equipment Rental and Leasing',
  '5411': 'Legal Services',
  '5412': 'Accounting, Tax Preparation, Bookkeeping, and Payroll Services',
  '5413': 'Architectural, Engineering, and Related Services',
  '5415': 'Computer Systems Design and Related Services',
  '5416': 'Management, Scientific, and Technical Consulting Services',
  '5511': 'Management of Companies and Enterprises',
  '5611': 'Office Administrative Services',
  '5613': 'Employment Services',
  '5617': 'Services to Buildings and Dwellings',
  '6111': 'Elementary and Secondary Schools',
  '6112': 'Junior Colleges',
  '6113': 'Colleges, Universities, and Professional Schools',
  '6211': 'Offices of Physicians',
  '6212': 'Offices of Dentists',
  '6213': 'Offices of Other Health Practitioners',
  '6214': 'Outpatient Care Centers',
  '6221': 'General Medical and Surgical Hospitals',
  '6231': 'Nursing Care Facilities (Skilled Nursing Facilities)',
  '6241': 'Individual and Family Services',
  '7111': 'Performing Arts Companies',
  '7113': 'Promoters of Performing Arts, Sports, and Similar Events',
  '7131': 'Amusement Parks and Arcades',
  '7211': 'Traveler Accommodation',
  '7223': 'Special Food Services',
  '7224': 'Drinking Places (Alcoholic Beverages)',
  '7225': 'Restaurants and Other Eating Places',
  '8111': 'Automotive Repair and Maintenance',
  '8121': 'Personal Care Services',
  '8131': 'Religious Organizations',
  '8139': 'Business, Professional, Labor, Political, and Similar Organizations',
  '9211': 'Executive, Legislative, and Other General Government Support',
};

const SIX_DIGIT_MAP: Record<string, { parent: string; title: string }> = {
  '111110': { parent: '1111', title: 'Soybean Farming' },
  '111120': { parent: '1111', title: 'Oilseed (except Soybean) Farming' },
  '111130': { parent: '1111', title: 'Dry Pea and Bean Farming' },
  '111140': { parent: '1111', title: 'Wheat Farming' },
  '112111': { parent: '1121', title: 'Beef Cattle Ranching and Farming' },
  '112112': { parent: '1121', title: 'Cattle Feedlots' },
  '211120': { parent: '2111', title: 'Crude Petroleum Extraction' },
  '211130': { parent: '2111', title: 'Natural Gas Extraction' },
  '212111': { parent: '2121', title: 'Bituminous Coal and Lignite Surface Mining' },
  '212112': { parent: '2121', title: 'Bituminous Coal Underground Mining' },
  '221111': { parent: '2211', title: 'Hydroelectric Power Generation' },
  '221112': { parent: '2211', title: 'Fossil Fuel Electric Power Generation' },
  '221113': { parent: '2211', title: 'Nuclear Electric Power Generation' },
  '221114': { parent: '2211', title: 'Solar Electric Power Generation' },
  '221115': { parent: '2211', title: 'Wind Electric Power Generation' },
  '221210': { parent: '2212', title: 'Natural Gas Distribution' },
  '236115': { parent: '2361', title: 'New Single-Family Housing Construction' },
  '236116': { parent: '2361', title: 'New Multifamily Housing Construction' },
  '236117': { parent: '2361', title: 'New Housing For-Sale Builders' },
  '236118': { parent: '2361', title: 'Residential Remodelers' },
  '236210': { parent: '2362', title: 'Industrial Building Construction' },
  '236220': { parent: '2362', title: 'Commercial and Institutional Building Construction' },
  '238110': { parent: '2381', title: 'Poured Concrete Foundation and Structure Contractors' },
  '238120': { parent: '2381', title: 'Structural Steel and Precast Concrete Contractors' },
  '238130': { parent: '2381', title: 'Framing Contractors' },
  '238140': { parent: '2381', title: 'Masonry Contractors' },
  '238150': { parent: '2381', title: 'Glass and Glazing Contractors' },
  '238160': { parent: '2381', title: 'Roofing Contractors' },
  '238170': { parent: '2381', title: 'Siding Contractors' },
  '238190': { parent: '2381', title: 'Other Foundation, Structure, and Building Exterior Contractors' },
  '238210': { parent: '2382', title: 'Electrical Contractors and Other Wiring Installation Contractors' },
  '238220': { parent: '2382', title: 'Plumbing, Heating, and Air-Conditioning Contractors' },
  '238290': { parent: '2382', title: 'Other Building Equipment Contractors' },
  '238310': { parent: '2383', title: 'Drywall and Insulation Contractors' },
  '238320': { parent: '2383', title: 'Painting and Wall Covering Contractors' },
  '238330': { parent: '2383', title: 'Flooring Contractors' },
  '238340': { parent: '2383', title: 'Tile and Terrazzo Contractors' },
  '238350': { parent: '2383', title: 'Finish Carpentry Contractors' },
  '238390': { parent: '2383', title: 'Other Building Finishing Contractors' },
  '311111': { parent: '3111', title: 'Dog and Cat Food Manufacturing' },
  '311119': { parent: '3111', title: 'Other Animal Food Manufacturing' },
  '311211': { parent: '3112', title: 'Flour Milling' },
  '311212': { parent: '3112', title: 'Rice Milling' },
  '311213': { parent: '3112', title: 'Malt Manufacturing' },
  '311221': { parent: '3112', title: 'Wet Corn Milling' },
  '311224': { parent: '3112', title: 'Soybean and Other Oilseed Processing' },
  '311225': { parent: '3112', title: 'Fats and Oils Refining and Blending' },
  '311230': { parent: '3112', title: 'Breakfast Cereal Manufacturing' },
  '311811': { parent: '3118', title: 'Retail Bakeries' },
  '311812': { parent: '3118', title: 'Commercial Bakeries' },
  '311813': { parent: '3118', title: 'Frozen Cakes, Pies, and Other Pastries Manufacturing' },
  '311821': { parent: '3118', title: 'Cookie and Cracker Manufacturing' },
  '311824': { parent: '3118', title: 'Dry Pasta, Dough, and Flour Mixes Manufacturing from Purchased Flour' },
  '311830': { parent: '3118', title: 'Tortilla Manufacturing' },
  '315110': { parent: '3151', title: 'Hosiery and Sock Mills' },
  '315190': { parent: '3151', title: 'Other Apparel Knitting Mills' },
  '315210': { parent: '3152', title: 'Cut and Sew Apparel Contractors' },
  '315220': { parent: '3152', title: "Men's and Boys' Cut and Sew Apparel Manufacturing" },
  '315240': { parent: '3152', title: "Women's, Girls', and Infants' Cut and Sew Apparel Manufacturing" },
  '315280': { parent: '3152', title: 'Other Cut and Sew Apparel Manufacturing' },
  '321113': { parent: '3211', title: 'Sawmills' },
  '321114': { parent: '3211', title: 'Wood Preservation' },
  '323111': { parent: '3231', title: 'Commercial Printing (except Screen and Books)' },
  '323113': { parent: '3231', title: 'Commercial Screen Printing' },
  '323117': { parent: '3231', title: 'Books Printing' },
  '324110': { parent: '3241', title: 'Petroleum Refineries' },
  '324121': { parent: '3241', title: 'Asphalt Paving Mixture and Block Manufacturing' },
  '324122': { parent: '3241', title: 'Asphalt Shingle and Coating Materials Manufacturing' },
  '325110': { parent: '3251', title: 'Petrochemical Manufacturing' },
  '325120': { parent: '3251', title: 'Industrial Gas Manufacturing' },
  '325130': { parent: '3251', title: 'Synthetic Dye and Pigment Manufacturing' },
  '325180': { parent: '3251', title: 'Other Basic Inorganic Chemical Manufacturing' },
  '325193': { parent: '3251', title: 'Ethyl Alcohol Manufacturing' },
  '325194': { parent: '3251', title: 'Cyclic Crude, Intermediate, and Gum and Wood Chemical Manufacturing' },
  '325199': { parent: '3251', title: 'All Other Basic Organic Chemical Manufacturing' },
  '326111': { parent: '3261', title: 'Plastics Bag and Pouch Manufacturing' },
  '326112': { parent: '3261', title: 'Plastics Packaging Film and Sheet (including Laminated) Manufacturing' },
  '326113': { parent: '3261', title: 'Unlaminated Plastics Film and Sheet (except Packaging) Manufacturing' },
  '326121': { parent: '3261', title: 'Unlaminated Plastics Profile Shape Manufacturing' },
  '326122': { parent: '3261', title: 'Plastics Pipe and Pipe Fitting Manufacturing' },
  '331110': { parent: '3311', title: 'Iron and Steel Mills and Ferroalloy Manufacturing' },
  '332111': { parent: '3321', title: 'Iron and Steel Forging' },
  '332112': { parent: '3321', title: 'Nonferrous Forging' },
  '332114': { parent: '3321', title: 'Custom Roll Forming' },
  '332117': { parent: '3321', title: 'Powder Metallurgy Part Manufacturing' },
  '332119': { parent: '3321', title: 'Metal Crown, Closure, and Other Metal Stamping (except Automotive)' },
  '333111': { parent: '3331', title: 'Farm Machinery and Equipment Manufacturing' },
  '333112': { parent: '3331', title: 'Lawn and Garden Tractor and Home Lawn and Garden Equipment Manufacturing' },
  '333120': { parent: '3331', title: 'Construction Machinery Manufacturing' },
  '333131': { parent: '3331', title: 'Mining Machinery and Equipment Manufacturing' },
  '333132': { parent: '3331', title: 'Oil and Gas Field Machinery and Equipment Manufacturing' },
  '334111': { parent: '3341', title: 'Electronic Computer Manufacturing' },
  '334112': { parent: '3341', title: 'Computer Storage Device Manufacturing' },
  '334118': { parent: '3341', title: 'Computer Terminal and Other Computer Peripheral Equipment Manufacturing' },
  '335110': { parent: '3351', title: 'Electric Lamp Bulb and Part Manufacturing' },
  '335121': { parent: '3351', title: 'Residential Electric Lighting Fixture Manufacturing' },
  '335122': { parent: '3351', title: 'Commercial, Industrial, and Institutional Electric Lighting Fixture Manufacturing' },
  '335129': { parent: '3351', title: 'Other Lighting Equipment Manufacturing' },
  '336111': { parent: '3361', title: 'Automobile Manufacturing' },
  '336112': { parent: '3361', title: 'Light Truck and Utility Vehicle Manufacturing' },
  '336120': { parent: '3361', title: 'Heavy Duty Truck Manufacturing' },
  '423110': { parent: '4231', title: 'Automobile and Other Motor Vehicle Merchant Wholesalers' },
  '423120': { parent: '4231', title: 'Motor Vehicle Supplies and New Parts Merchant Wholesalers' },
  '423130': { parent: '4231', title: 'Tire and Tube Merchant Wholesalers' },
  '423140': { parent: '4231', title: 'Motor Vehicle Parts (Used) Merchant Wholesalers' },
  '423210': { parent: '4232', title: 'Furniture Merchant Wholesalers' },
  '423220': { parent: '4232', title: 'Home Furnishing Merchant Wholesalers' },
  '424410': { parent: '4244', title: 'General Line Grocery Merchant Wholesalers' },
  '424420': { parent: '4244', title: 'Packaged Frozen Food Merchant Wholesalers' },
  '424430': { parent: '4244', title: 'Dairy Product (except Dried or Canned) Merchant Wholesalers' },
  '424440': { parent: '4244', title: 'Poultry and Poultry Product Merchant Wholesalers' },
  '424450': { parent: '4244', title: 'Confectionery Merchant Wholesalers' },
  '424460': { parent: '4244', title: 'Fish and Seafood Merchant Wholesalers' },
  '424470': { parent: '4244', title: 'Meat and Meat Product Merchant Wholesalers' },
  '424480': { parent: '4244', title: 'Fresh Fruit and Vegetable Merchant Wholesalers' },
  '424490': { parent: '4244', title: 'Other Grocery and Related Products Merchant Wholesalers' },
  '441110': { parent: '4411', title: 'New Car Dealers' },
  '441120': { parent: '4411', title: 'Used Car Dealers' },
  '441210': { parent: '4412', title: 'Recreational Vehicle Dealers' },
  '441222': { parent: '4412', title: 'Boat Dealers' },
  '441228': { parent: '4412', title: 'Motorcycle, ATV, and All Other Motor Vehicle Dealers' },
  '443141': { parent: '4431', title: 'Household Appliance Stores' },
  '443142': { parent: '4431', title: 'Electronics Stores' },
  '444110': { parent: '4441', title: 'Home Centers' },
  '444120': { parent: '4441', title: 'Paint and Wallpaper Stores' },
  '444130': { parent: '4441', title: 'Hardware Stores' },
  '444190': { parent: '4441', title: 'Other Building Material Dealers' },
  '445110': { parent: '4451', title: 'Supermarkets and Other Grocery (except Convenience) Stores' },
  '445120': { parent: '4451', title: 'Convenience Stores' },
  '447110': { parent: '4471', title: 'Gasoline Stations with Convenience Stores' },
  '447190': { parent: '4471', title: 'Other Gasoline Stations' },
  '448110': { parent: '4481', title: "Men's Clothing Stores" },
  '448120': { parent: '4481', title: "Women's Clothing Stores" },
  '448130': { parent: '4481', title: "Children's and Infants' Clothing Stores" },
  '448140': { parent: '4481', title: 'Family Clothing Stores' },
  '448150': { parent: '4481', title: 'Clothing Accessories Stores' },
  '448190': { parent: '4481', title: 'Other Clothing Stores' },
  '452311': { parent: '4523', title: 'Warehouse Clubs and Supercenters' },
  '452319': { parent: '4523', title: 'All Other General Merchandise Stores' },
  '453210': { parent: '4532', title: 'Office Supplies and Stationery Stores' },
  '453220': { parent: '4532', title: 'Gift, Novelty, and Souvenir Stores' },
  '481111': { parent: '4811', title: 'Scheduled Passenger Air Transportation' },
  '481112': { parent: '4811', title: 'Scheduled Freight Air Transportation' },
  '484110': { parent: '4841', title: 'General Freight Trucking, Local' },
  '484121': { parent: '4841', title: 'General Freight Trucking, Long-Distance, Truckload' },
  '484122': { parent: '4841', title: 'General Freight Trucking, Long-Distance, Less Than Truckload' },
  '485310': { parent: '4853', title: 'Taxi Service' },
  '485320': { parent: '4853', title: 'Limousine Service' },
  '492110': { parent: '4921', title: 'Couriers and Express Delivery Services' },
  '511110': { parent: '5111', title: 'Newspaper Publishers' },
  '511120': { parent: '5111', title: 'Periodical Publishers' },
  '511130': { parent: '5111', title: 'Book Publishers' },
  '511140': { parent: '5111', title: 'Directory and Mailing List Publishers' },
  '511191': { parent: '5111', title: 'Greeting Card Publishers' },
  '511199': { parent: '5111', title: 'All Other Publishers' },
  '512110': { parent: '5121', title: 'Motion Picture and Video Production' },
  '512120': { parent: '5121', title: 'Motion Picture and Video Distribution' },
  '512131': { parent: '5121', title: 'Motion Picture Theaters (except Drive-Ins)' },
  '512132': { parent: '5121', title: 'Drive-In Motion Picture Theaters' },
  '512191': { parent: '5121', title: 'Teleproduction and Other Postproduction Services' },
  '512199': { parent: '5121', title: 'Other Motion Picture and Video Industries' },
  '517311': { parent: '5171', title: 'Wired Telecommunications Carriers' },
  '517312': { parent: '5171', title: 'Wireless Telecommunications Carriers (except Satellite)' },
  '518210': { parent: '5182', title: 'Data Processing, Hosting, and Related Services' },
  '521110': { parent: '5211', title: 'Monetary Authorities-Central Bank' },
  '522110': { parent: '5221', title: 'Commercial Banking' },
  '522120': { parent: '5221', title: 'Savings Institutions' },
  '522130': { parent: '5221', title: 'Credit Unions' },
  '522190': { parent: '5221', title: 'Other Depository Credit Intermediation' },
  '523110': { parent: '5231', title: 'Investment Banking and Securities Dealing' },
  '523120': { parent: '5231', title: 'Securities Brokerage' },
  '523130': { parent: '5231', title: 'Commodity Contracts Dealing' },
  '523140': { parent: '5231', title: 'Commodity Contracts Brokerage' },
  '523910': { parent: '5231', title: 'Miscellaneous Intermediation' },
  '523920': { parent: '5231', title: 'Portfolio Management' },
  '523930': { parent: '5231', title: 'Investment Advice' },
  '523991': { parent: '5231', title: 'Trust, Fiduciary, and Custody Activities' },
  '523999': { parent: '5231', title: 'Miscellaneous Financial Investment Activities' },
  '524113': { parent: '5241', title: 'Direct Life Insurance Carriers' },
  '524114': { parent: '5241', title: 'Direct Health and Medical Insurance Carriers' },
  '524126': { parent: '5241', title: 'Direct Property and Casualty Insurance Carriers' },
  '524127': { parent: '5241', title: 'Direct Title Insurance Carriers' },
  '524128': { parent: '5241', title: 'Other Direct Insurance (except Life, Health, and Medical) Carriers' },
  '524130': { parent: '5241', title: 'Reinsurance Carriers' },
  '531110': { parent: '5311', title: 'Lessors of Residential Buildings and Dwellings' },
  '531120': { parent: '5311', title: 'Lessors of Nonresidential Buildings (except Miniwarehouses)' },
  '531130': { parent: '5311', title: 'Lessors of Miniwarehouses and Self-Storage Units' },
  '531190': { parent: '5311', title: 'Lessors of Other Real Estate Property' },
  '532111': { parent: '5321', title: 'Passenger Car Rental' },
  '532112': { parent: '5321', title: 'Passenger Car Leasing' },
  '532120': { parent: '5321', title: 'Truck, Utility Trailer, and RV (Recreational Vehicle) Rental and Leasing' },
  '541110': { parent: '5411', title: 'Offices of Lawyers' },
  '541120': { parent: '5411', title: 'Offices of Notaries' },
  '541191': { parent: '5411', title: 'Title Abstract and Settlement Offices' },
  '541199': { parent: '5411', title: 'All Other Legal Services' },
  '541211': { parent: '5412', title: 'Offices of Certified Public Accountants' },
  '541213': { parent: '5412', title: 'Tax Preparation Services' },
  '541214': { parent: '5412', title: 'Payroll Services' },
  '541219': { parent: '5412', title: 'Other Accounting Services' },
  '541310': { parent: '5413', title: 'Architectural Services' },
  '541320': { parent: '5413', title: 'Landscape Architectural Services' },
  '541330': { parent: '5413', title: 'Engineering Services' },
  '541340': { parent: '5413', title: 'Drafting Services' },
  '541350': { parent: '5413', title: 'Building Inspection Services' },
  '541360': { parent: '5413', title: 'Geophysical Surveying and Mapping Services' },
  '541370': { parent: '5413', title: 'Surveying and Mapping (except Geophysical) Services' },
  '541380': { parent: '5413', title: 'Testing Laboratories' },
  '541511': { parent: '5415', title: 'Custom Computer Programming Services' },
  '541512': { parent: '5415', title: 'Computer Systems Design Services' },
  '541513': { parent: '5415', title: 'Computer Facilities Management Services' },
  '541519': { parent: '5415', title: 'Other Computer Related Services' },
  '541611': { parent: '5416', title: 'Administrative Management and General Management Consulting Services' },
  '541612': { parent: '5416', title: 'Human Resources Consulting Services' },
  '541613': { parent: '5416', title: 'Marketing Consulting Services' },
  '541614': { parent: '5416', title: 'Process, Physical Distribution, and Logistics Consulting Services' },
  '541618': { parent: '5416', title: 'Other Management Consulting Services' },
  '541620': { parent: '5416', title: 'Environmental Consulting Services' },
  '541690': { parent: '5416', title: 'Other Scientific and Technical Consulting Services' },
  '551111': { parent: '5511', title: 'Offices of Bank Holding Companies' },
  '551112': { parent: '5511', title: 'Offices of Other Holding Companies' },
  '551114': { parent: '5511', title: 'Corporate, Subsidiary, and Regional Managing Offices' },
  '561110': { parent: '5611', title: 'Office Administrative Services' },
  '561311': { parent: '5613', title: 'Employment Placement Agencies' },
  '561312': { parent: '5613', title: 'Executive Search Services' },
  '561320': { parent: '5613', title: 'Temporary Help Services' },
  '561330': { parent: '5613', title: 'Professional Employer Organizations' },
  '561710': { parent: '5617', title: 'Exterminating and Pest Control Services' },
  '561720': { parent: '5617', title: 'Janitorial Services' },
  '561730': { parent: '5617', title: 'Landscaping Services' },
  '561740': { parent: '5617', title: 'Carpet and Upholstery Cleaning Services' },
  '561790': { parent: '5617', title: 'Other Services to Buildings and Dwellings' },
  '611110': { parent: '6111', title: 'Elementary and Secondary Schools' },
  '611210': { parent: '6112', title: 'Junior Colleges' },
  '611310': { parent: '6113', title: 'Colleges, Universities, and Professional Schools' },
  '621111': { parent: '6211', title: 'Offices of Physicians (except Mental Health Specialists)' },
  '621112': { parent: '6211', title: 'Offices of Physicians, Mental Health Specialists' },
  '621210': { parent: '6212', title: 'Offices of Dentists' },
  '621310': { parent: '6213', title: 'Offices of Chiropractors' },
  '621320': { parent: '6213', title: 'Offices of Optometrists' },
  '621330': { parent: '6213', title: 'Offices of Mental Health Practitioners (except Physicians)' },
  '621340': { parent: '6213', title: 'Offices of Physical, Occupational and Speech Therapists, and Audiologists' },
  '621391': { parent: '6213', title: 'Offices of Podiatrists' },
  '621399': { parent: '6213', title: 'Offices of All Other Miscellaneous Health Practitioners' },
  '621410': { parent: '6214', title: 'Family Planning Centers' },
  '621420': { parent: '6214', title: 'Outpatient Mental Health and Substance Abuse Centers' },
  '621491': { parent: '6214', title: 'HMO Medical Centers' },
  '621492': { parent: '6214', title: 'Kidney Dialysis Centers' },
  '621493': { parent: '6214', title: 'Freestanding Ambulatory Surgical and Emergency Centers' },
  '621498': { parent: '6214', title: 'All Other Outpatient Care Centers' },
  '622110': { parent: '6221', title: 'General Medical and Surgical Hospitals' },
  '622210': { parent: '6221', title: 'Psychiatric and Substance Abuse Hospitals' },
  '622310': { parent: '6221', title: 'Specialty (except Psychiatric and Substance Abuse) Hospitals' },
  '623110': { parent: '6231', title: 'Nursing Care Facilities (Skilled Nursing Facilities)' },
  '624110': { parent: '6241', title: 'Child and Youth Services' },
  '624120': { parent: '6241', title: 'Services for the Elderly and Persons with Disabilities' },
  '624190': { parent: '6241', title: 'Other Individual and Family Services' },
  '711110': { parent: '7111', title: 'Theater Companies and Dinner Theaters' },
  '711120': { parent: '7111', title: 'Dance Companies' },
  '711130': { parent: '7111', title: 'Musical Groups and Artists' },
  '711190': { parent: '7111', title: 'Other Performing Arts Companies' },
  '711310': { parent: '7113', title: 'Promoters of Performing Arts, Sports, and Similar Events with Facilities' },
  '711320': { parent: '7113', title: 'Promoters of Performing Arts, Sports, and Similar Events without Facilities' },
  '713110': { parent: '7131', title: 'Amusement and Theme Parks' },
  '713120': { parent: '7131', title: 'Amusement Arcades' },
  '721110': { parent: '7211', title: 'Hotels (except Casino Hotels) and Motels' },
  '721120': { parent: '7211', title: 'Casino Hotels' },
  '721191': { parent: '7211', title: 'Bed-and-Breakfast Inns' },
  '721199': { parent: '7211', title: 'All Other Traveler Accommodation' },
  '722310': { parent: '7223', title: 'Food Service Contractors' },
  '722320': { parent: '7223', title: 'Caterers' },
  '722330': { parent: '7223', title: 'Mobile Food Services' },
  '722410': { parent: '7224', title: 'Drinking Places (Alcoholic Beverages)' },
  '722511': { parent: '7225', title: 'Full-Service Restaurants' },
  '722513': { parent: '7225', title: 'Limited-Service Restaurants' },
  '722514': { parent: '7225', title: 'Cafeterias, Grill Buffets, and Buffets' },
  '722515': { parent: '7225', title: 'Snack and Nonalcoholic Beverage Bars' },
  '811111': { parent: '8111', title: 'General Automotive Repair' },
  '811112': { parent: '8111', title: 'Automotive Exhaust System Repair' },
  '811113': { parent: '8111', title: 'Automotive Transmission Repair' },
  '811118': { parent: '8111', title: 'Other Automotive Mechanical and Electrical Repair and Maintenance' },
  '811121': { parent: '8111', title: 'Automotive Body, Paint, and Interior Repair and Maintenance' },
  '811122': { parent: '8111', title: 'Automotive Glass Replacement Shops' },
  '811191': { parent: '8111', title: 'Automotive Oil Change and Lubrication Shops' },
  '811192': { parent: '8111', title: 'Car Washes' },
  '811198': { parent: '8111', title: 'All Other Automotive Repair and Maintenance' },
  '812111': { parent: '8121', title: 'Barber Shops' },
  '812112': { parent: '8121', title: 'Beauty Salons' },
  '812113': { parent: '8121', title: 'Nail Salons' },
  '812191': { parent: '8121', title: 'Diet and Weight Reducing Centers' },
  '812199': { parent: '8121', title: 'Other Personal Care Services' },
  '813110': { parent: '8131', title: 'Religious Organizations' },
  '813910': { parent: '8139', title: 'Business Associations' },
  '813920': { parent: '8139', title: 'Professional Organizations' },
  '813930': { parent: '8139', title: 'Labor Unions and Similar Labor Organizations' },
  '813940': { parent: '8139', title: 'Political Organizations' },
  '813990': { parent: '8139', title: 'Other Similar Organizations (except Business, Professional, Labor, and Political Organizations)' },
  '921110': { parent: '9211', title: 'Executive Offices' },
  '921120': { parent: '9211', title: 'Legislative Bodies' },
  '921130': { parent: '9211', title: 'Public Finance Activities' },
  '921140': { parent: '9211', title: 'Executive and Legislative Offices, Combined' },
  '921150': { parent: '9211', title: 'American Indian and Alaska Native Tribal Governments' },
  '921190': { parent: '9211', title: 'Other General Government Support' },
};

// =============================================================================
// COMMUNITY RESOURCES BY NAICS SUBSECTOR (from Community Assets by NAICS Code.xlsx)
// =============================================================================
const COMMUNITY_RESOURCES: Record<string, string[]> = {
  '111': [
    'Agricultural Consulting Services',
    'Farm Equipment Suppliers',
    "Farmers' Markets",
    'Farmland',
    'Irrigation Systems',
    'Storage Facilities',
  ],
  '112': [
    'Barns',
    'Feed Suppliers',
    'Livestock Auctions',
    'Pastures',
    'Ranches',
    'Veterinary Services',
  ],
  '113': [
    'Forestry Consulting Services',
    'Forests',
    'Logging Equipment Suppliers',
    'Logging Roads',
    'Sawmills',
    'Storage Yards',
  ],
  '114': [
    'Boats',
    'Docks',
    'Fishing Gear Suppliers',
    'Fishing Ports',
    'Guide Services',
    'Hunting Lodges',
  ],
  '115': [
    'Agricultural Education And Training Programs',
    'Crop Scouting And Consulting Services',
    'Farm Equipment Rental Services',
    'Farm Labor Contractors',
    'Soil Testing And Analysis Services',
  ],
  '211': [
    'Drilling Equipment Suppliers',
    'Drilling Rigs',
    'Geological Consulting Services',
    'Oil And Gas Wells',
    'Pipelines',
    'Refineries',
  ],
  '212': [
    'Conveyor Systems',
    'Heavy Equipment',
    'Heavy Equipment Suppliers',
    'Mines',
    'Mining Consulting Services',
    'Processing Facilities',
  ],
  '213': [
    'Environmental Remediation Services',
    'Maintenance Facilities',
    'Mining Equipment Repair Services',
    'Repair Shops',
    'Storage Facilities',
    'Storage Yards',
  ],
  '221': [
    'Electrical Equipment Suppliers',
    'Energy Efficiency Services',
    'Generators',
    'Power Plants',
    'Transmission Lines',
    'Transmission Towers',
    'Electric Transmission Lines',
    'Gas Pipelines',
    'Power Plants',
    'Wastewater Treatment Facilities',
    'Water Treatment Facilities',
  ],
  '236': [
    'Architectural Services',
    'Building Sites',
    'Construction Equipment Rental Yards',
    'Cranes',
    'Engineering Services',
    'Scaffolding',
  ],
  '237': [
    'Bulldozers',
    'Construction Materials Suppliers',
    'Excavators',
    'Heavy Equipment Suppliers',
    'Infrastructure Project Sites',
    'Quarries',
  ],
  '238': [
    'Contractor Yards',
    'Electrical Suppliers',
    'Equipment',
    'Plumbing Suppliers',
    'Specialized Equipment Rental Facilities',
    'Specialized Tools',
  ],
  '311': [
    'Food Processing Equipment Suppliers',
    'Food Processing Plants',
    'Packaging Materials Suppliers',
    'Processing Equipment',
    'Refrigerated Storage',
    'Warehouses',
  ],
  '312': [
    'Workforce Development Programs',
    'Economic Development Incentives',
    'Environmental Resources',
    'Research and Development Resources',
    'Supply Chain Partners',
    'Beverage Processing Equipment Suppliers',
    'Bottling And Canning Equipment Suppliers',
    'Bottling Lines',
    'Breweries',
    'Fermentation Tanks',
    'Wineries',
  ],
  '313': [
    'Fabric Suppliers',
    'Fabric Warehouses',
    'Looms',
    'Spinning Machines',
    'Textile Equipment Suppliers',
    'Textile Mills',
  ],
  '314': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Fabric Cutting And Finishing Equipment',
    'Industrial Sewing Machines',
    'Textile Testing And Inspection Services',
  ],
  '315': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Fabric Cutting And Finishing Equipment',
    'Fashion Design Schools',
    'Industrial Sewing Machines',
  ],
  '316': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Industrial Sewing Machines',
    'Leather Tanning And Finishing Equipment',
    'Leatherworking Classes',
  ],
  '321': [
    'Dry Kilns',
    'Lumber Suppliers',
    'Sawmills',
    'Woodworking Equipment Suppliers',
    'Woodworking Machinery',
    'Woodworking Shops',
  ],
  '322': [
    'Paper Machines',
    'Paper Mills',
    'Paper Processing Equipment Suppliers',
    'Pulp Digesters',
    'Pulp Processing Facilities',
    'Pulp Suppliers',
  ],
  '323': [
    'Binderies',
    'Binding Equipment',
    'Ink And Toner Suppliers',
    'Printing Equipment Suppliers',
    'Printing Plants',
    'Printing Presses',
  ],
  '324': [
    'Community Emergency Response Plans',
    'Employee Training Programs',
    'Pipelines',
    'Refineries',
    'Storage Tanks',
  ],
  '325': [
    'Chemical Processing Equipment',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Environmental Monitoring Systems',
    'Quality Control Laboratories',
  ],
  '326': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Extrusion Equipment',
    'Injection Molding Machines',
    'Recycling Programs',
  ],
  '327': [
    'Community Outreach Programs',
    'Crushing And Grinding Equipment',
    'Employee Training Programs',
    'Environmental Monitoring Systems',
    'Kilns And Furnaces',
  ],
  '331': [
    'Foundries',
    'Furnaces',
    'Metal Processing Equipment Suppliers',
    'Rolling Mills',
    'Scrap Metal Suppliers',
    'Steel Mills',
  ],
  '332': [
    'Fabrication Shops',
    'Fastener Suppliers',
    'Machine Shops',
    'Machining Centers',
    'Metal Fabrication Equipment Suppliers',
    'Welding Equipment',
  ],
  '333': [
    'Assembly Lines',
    'Machinery Equipment Suppliers',
    'Machinery Plants',
    'Machining Centers',
    'Robotics Integration Facilities',
    'Robotics Suppliers',
  ],
  '334': [
    'Clean Rooms',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Soldering And Assembly Equipment',
    'Technology Incubators',
  ],
  '335': [
    'Assembly Lines',
    'Community Outreach Programs',
    'Electrical Testing Equipment',
    'Employee Training Programs',
    'Energy-Efficient Product Development',
  ],
  '336': [
    'Assembly Lines',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Painting And Coating Equipment',
    'Supply Chain Management Systems',
  ],
  '337': [
    'Community Outreach Programs',
    'Design Studios',
    'Employee Training Programs',
    'Upholstery Equipment',
    'Woodworking Equipment',
  ],
  '339': [
    '3D Printing Equipment',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Laser Cutting Equipment',
    'Product Design Studios',
  ],
  '423': [
    'Community Outreach Programs',
    'Distribution Centers',
    'Employee Training Programs',
    'Inventory Management Software Providers',
    'Inventory Management Systems',
    'Logistics And Transportation Services',
    'Logistics Management Systems',
    'Material Handling Equipment',
    'Shelving And Storage Systems',
    'Warehouses',
  ],
  '424': [
    'Cold Storage Facilities',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Food Distribution Centers',
    'Food Processing And Packaging Services',
    'Inventory Management Systems',
    'Packaging Equipment',
    'Perishable Goods Transportation Services',
    'Refrigerated Storage',
    'Supply Chain Management Systems',
    'Warehouses',
  ],
  '425': [
    'E-Commerce Platforms Digital Payment Processing Services',
    'Data Centers',
    'Network Infrastructure',
    'Network Operations Centers',
    'Servers',
    'Communication Equipment',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Market Research Services',
    'Office Space',
  ],
  '441': [
    'Automotive Repair Services',
    'Car Dealerships',
    'Car Wash And Detailing Services',
    'Community Outreach Programs',
    'Customer Loyalty Programs',
    'Employee Training Programs',
    'Repair Shops',
    'Service Bays',
    'Auto Showrooms',
  ],
  '442': [
    'Furniture Stores',
    'Home Decor Suppliers',
    'Home Furnishings Stores',
    'Interior Design Services',
    'Showrooms',
    'Warehouse Storage',
  ],
  '443': [
    'Appliance Stores',
    'Demonstration Areas',
    'Electronics Repair Services',
    'Electronics Stores',
    'Installation Services',
    'Showrooms',
  ],
  '444': [
    'Community Outreach Programs',
    'General Contractor Services',
    'Employee Training Programs',
    'Showrooms',
    'Warehouses',
  ],
  '445': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Food Safety Training',
    'Restaurants',
    'Supermarkets',
  ],
  '449': [
    'Community Outreach Programs',
    'Customer Service Programs',
    'Employee Training Programs',
    'Product Demonstration Areas',
    'Showrooms',
  ],
  '451': [
    'Music Lessons',
    'Music Stores',
    'Practice Areas',
    'Showrooms',
    'Sporting Goods Repair Services',
    'Sporting Goods Stores',
  ],
  '452': [
    'Department Stores',
    'Discount Stores',
    'Optical Services',
    'Pharmacy Services',
    'Showrooms',
    'Stockrooms',
  ],
  '453': [
    'Display Cases',
    'Gift Shops',
    'Gift Wrapping Services',
    'Personalized Shopping Services',
    'Showrooms',
    'Souvenir Shops',
  ],
  '455': [
    'Community Outreach Programs',
    'Customer Service Programs',
    'Department Stores',
    'Employee Training Programs',
    'Product Demonstration Areas',
  ],
  '456': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Health Clinics',
    'Pharmacies',
    'Wellness Programs',
  ],
  '457': [
    'Community Outreach Programs',
    'Convenience Stores',
    'Employee Training Programs',
    'Environmental Monitoring Systems',
    'Fuel Pumps',
  ],
  '458': [
    'Boutiques',
    'Community Outreach Programs',
    'Employee Training Programs',
    'Fashion Shows',
    'Styling Services',
  ],
  '459': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Product Demonstration Areas',
    'Specialty Stores',
    'Workshops And Classes',
  ],
  '481': [
    'Air Cargo Handling Services',
    'Aircraft',
    'Aircraft Maintenance Services',
    'Airports',
    'Ground Handling Equipment',
    'Hangars',
  ],
  '482': [
    'Freight Brokerage Services',
    'Locomotives',
    'Rail Yards',
    'Railcar Maintenance Services',
    'Railcars',
    'Train Stations',
  ],
  '483': [
    'Cranes And Hoists',
    'Marinas',
    'Marine Cargo Handling Services',
    'Ports',
    'Ship Maintenance Services',
    'Vessels',
  ],
  '484': [
    'Community Outreach Programs',
    'Employee Training Programs',
    'Logistics Management Systems',
    'Trailers',
    'Trucks',
  ],
  '485': [
    'Bike-Share Programs',
    'Bus Shelters',
    'Community Outreach Programs',
    'Public Transportation Apps',
    'Transportation Hubs (Examples: Train Stations Airports)',
  ],
  '486': [
    'Emergency Response Plans',
    'Environmental Monitoring Systems',
    'Pipelines',
    'Pumping Stations',
    'Storage Facilities',
  ],
  '487': [
    'Aircraft',
    'Boats',
    'Interpretive Programs',
    'Tour Buses',
    'Tour Guides',
  ],
  '488': [
    'Freight Brokerage Services',
    'Logistics Management Systems',
    'Safety Training Programs',
    'Transportation Consulting Services',
    'Warehousing And Storage Facilities',
  ],
  '491': [
    'Logistics Services',
    'Mail Processing Services',
    'Mail Sorting Facilities',
    'Mail Trucks',
    'Post Offices',
    'Sorting Equipment',
  ],
  '492': [
    'Courier Depots',
    'Delivery Hubs',
    'Delivery Services',
    'Logistics Services',
    'Sorting Equipment',
    'Vehicles',
  ],
  '493': [
    'Inventory Management Services',
    'Logistics Services',
    'Material Handling Equipment',
    'Shelving And Storage Systems',
    'Storage Facilities',
    'Warehouses',
  ],
  '511': [
    'Binding Equipment',
    'Content Creation Services',
    'Printing Plants',
    'Printing Presses',
    'Printing Services',
    'Publishing Houses',
  ],
  '512': [
    'Cameras',
    'Film Production Services',
    'Film Studios',
    'Lighting Equipment',
    'Sound Recording Studios',
    'Sound Stages',
  ],
  '513': [
    'Antennas',
    'Broadcast Equipment',
    'Broadcast Equipment Suppliers',
    'Broadcast Studios',
    'Telecommunications Services',
    'Transmission Towers',
    'Bookbinding And Finishing Equipment',
    'Editorial Software',
    'Graphic Design Equipment',
    'Literary Festivals',
    'Printing Presses',
  ],
  '516': [
    'Broadcasting Equipment',
    'Community Outreach Programs',
    'Content Management Systems',
    'Post-Production Facilities',
    'Studios',
  ],
  '517': [
    'Cell Towers',
    'Cybersecurity Systems',
    'Fiber Optic Cables',
    'Network Operations Centers',
    'Telecommunications Equipment',
  ],
  '518': [
    'Cybersecurity Systems',
    'Data Centers',
    'IT Training Programs',
    'Network Equipment',
    'Servers',
  ],
  '519': [
    'Archives',
    'Digital Repositories',
    'Information Literacy Programs',
    'Libraries',
    'Research Databases',
  ],
  '521': [
    'Central Banks',
    'Currency Exchange Services',
    'Data Centers',
    'Financial Regulatory Agencies',
    'Financial Regulatory Services',
    'Secure Storage Facilities',
  ],
  '522': [
    'ATMs',
    'Banks',
    'Credit Reporting Agencies',
    'Credit Unions',
    'Loan Servicing Companies',
    'Online Banking Platforms',
  ],
  '523': [
    'Financial Analysis Software',
    'Financial Planning Tools',
    'Investment Research Databases',
    'Investor Education Programs',
    'Trading Floors',
    'Data Analytics Software',
    'Investment Advisory Services',
    'Investment Firms',
    'Portfolio Management Services',
    'Stock Exchanges',
    'Trading Floors',
  ],
  '524': [
    'Claims Processing Software',
    'Customer Service Programs',
    'Disaster Response Plans',
    'Insurance Policy Management Systems',
    'Risk Assessment Tools',
  ],
  '525': [
    'Customer Service Programs',
    'Financial Planning Tools',
    'Investment Management Software',
    'Investor Education Programs',
    'Portfolio Analysis Tools',
  ],
  '531': [
    'Property Listings',
    'Property Management Companies',
    'Property Management Services',
    'Real Estate Appraisal Services',
    'Real Estate Offices',
    'Real Estate Software',
  ],
  '532': [
    'Equipment Rental Services',
    'Leasing Offices',
    'Leasing Services',
    'Leasing Software',
    'Rental Equipment',
    'Rental Equipment Yards',
  ],
  '533': [
    'Innovation Incubators',
    'Intellectual Property Management Software',
    'Licensing Agreements',
    'Patent Databases',
    'Trademark Databases',
  ],
  '541': [
    'Consulting Services',
    'Professional Offices',
    'Research And Development Services',
    'Research Laboratories',
    'Software And Technology',
    'Specialized Equipment',
  ],
  '542': [
    'Accounting Firms',
    'Auditing Services',
    'Data Analysis Tools',
    'Financial Advisory Services',
    'Financial Software',
    'Tax Preparation Offices',
  ],
  '543': [
    'Architectural Firms',
    'Building Information Modeling (Bim) Technology',
    'Construction Management Services',
    'Design Services',
    'Design Software',
    'Engineering Offices',
  ],
  '551': [
    'Business Consulting Services',
    'Business Software',
    'Communication Technology',
    'Corporate Headquarters',
    'Human Resources Services',
    'Management Consulting Firms',
  ],
  '561': [
    'Administrative Offices',
    'Cleaning Equipment',
    'Janitorial Services',
    'Office Equipment',
    'Staffing Services',
    'Support Service Providers',
  ],
  '562': [
    'Environmental Consulting Services',
    'Recycling Centers',
    'Recycling Equipment',
    'Recycling Services',
    'Waste Collection Vehicles',
    'Waste Management Facilities',
  ],
  '611': [
    'Classrooms',
    'Educational Consulting Services',
    'Educational Institutions',
    'Educational Software',
    'Library Resources',
    'Schools',
    'Tutoring Services',
    'Universities',
  ],
  '612': [
    'Educational Research Centers',
    'Educational Research Services',
    'Research Equipment',
    'Testing And Assessment Services',
    'Testing Facilities',
    'Testing Software',
  ],
  '621': [
    'Clinics',
    'Examination Rooms',
    'Medical Equipment',
    'Medical Imaging Services',
    'Medical Laboratories',
    'Medical Offices',
  ],
  '622': [
    'Hospital Beds',
    'Hospital Equipment Suppliers',
    'Hospitals',
    'Medical Centers',
    'Medical Equipment',
    'Medical Staffing Services',
  ],
  '623': [
    'Assisted Living Facilities',
    'Home Health Care Services',
    'Medical Equipment',
    'Medical Transportation Services',
    'Nursing Homes',
    'Patient Rooms',
  ],
  '624': [
    'Counseling Services',
    'Food Banks',
    'Homeless Shelters',
    'Senior Centers',
    'Youth Centers',
  ],
  '711': [
    'Arenas',
    'Event Promotion Services',
    'Seating',
    'Sound And Lighting Equipment',
    'Stadiums',
    'Stages',
    'Theaters',
    'Ticketing Services',
  ],
  '712': [
    'Artifacts',
    'Cultural Centers',
    'Cultural Event Planning Services',
    'Educational Resources',
    'Exhibit Design Services',
    'Exhibits',
    'Historical Sites',
    'Museums',
  ],
  '713': [
    'Amusement Park Services',
    'Amusement Parks',
    'Casinos',
    'Sportsbook Services',
    'Arcade and Carnival Games',
    'Gaming Equipment Suppliers',
    'Recreation Centers',
    'Recreational Equipment',
    'Carnival Rides',
  ],
  '721': [
    'Amenities',
    'Guest Rooms',
    'Hospitality Equipment',
    'Hospitality Services',
    'Hotels',
    'Motels',
    'Resorts',
    'Tourism Services',
  ],
  '722': [
    'Bars',
    'Cafes',
    'Catering Services',
    'Dining Areas',
    'Food Preparation Equipment',
    'Food Suppliers',
    'Kitchen Equipment',
    'Restaurants',
  ],
  '811': [
    'Equipment Rental Services',
    'Maintenance Facilities',
    'Maintenance Software',
    'Maintenance Software Providers',
    'Repair Equipment',
    'Repair Shops',
    'Tools',
  ],
  '812': [
    'Dry Cleaners',
    'Dry Cleaning Equipment',
    'Dry Cleaning Services',
    'Laundromats',
    'Laundry Equipment',
    'Laundry Services',
    'Personal Service Providers',
  ],
  '813': [
    'Charitable Organizations',
    'Community Centers',
    'Places Of Worship',
    'Professional Associations',
    'Volunteer Programs',
  ],
  '814': [
    'Community Gardens',
    'Family Support Networks',
    "Homeowners' Associations",
    'Local Advocacy Groups',
    'Neighborhood Associations',
  ],
  '921': [
    'City Halls',
    'Community Engagement Programs',
    'Data Analysis Tools',
    'Government Consulting Services',
    'Government Offices',
    'Government Software',
    'Legislative Buildings',
    'Policy Analysis Services',
    'Public Meeting Spaces',
    'Town Halls',
  ],
  '922': [
    'Correctional Facilities',
    'Courthouses',
    'Courts',
    'Emergency Response Centers',
    'Emergency Response Equipment',
    'Emergency Response Plans',
    'Emergency Response Services',
    'Fire Stations',
    'Law Enforcement Equipment',
    'Law Enforcement Services',
    'Police Stations',
  ],
  '923': [
    'Career Counseling',
    'Employment Offices',
    'Job Training Programs',
    'Social Services',
    'Unemployment Benefit Programs',
  ],
  '924': [
    'Conservation Organizations',
    'Environmental Education Programs',
    'Parks And Recreation Departments',
    'Recycling Centers',
    'Sustainability Initiatives',
  ],
  '925': [
    'Affordable Housing Initiatives',
    'Community Development Organizations',
    'Homeownership Programs',
    'Housing Authorities',
    'Urban Planning Departments',
  ],
  '926': [
    'Business Incubators',
    'Economic Development Organizations',
    'Job Creation Programs',
    'Small Business Development Centers',
    'Trade Associations',
  ],
  '927': [
    'Research Laboratories',
    'Scientific Instruments',
    'Space Exploration Equipment',
    'Technology Incubators',
    'Testing Facilities',
  ],
  '928': [
    'Defense Contractors',
    'Diplomatic Missions',
    'Intelligence Agencies',
    'International Relations Organizations',
    'Military Bases',
  ],
};

// =============================================================================
// KEYWORD MAPPINGS FOR NAICS SEARCH
// =============================================================================
const NAICS_KEYWORDS: Record<string, string[]> = {
  '1111': ['oilseed', 'grain', 'farming', 'agriculture', 'crop', 'soybean', 'wheat', 'corn', 'farm'],
  '1121': ['cattle', 'ranching', 'farming', 'livestock', 'beef', 'cow', 'dairy', 'ranch', 'animal'],
  '2111': ['oil', 'gas', 'extraction', 'petroleum', 'drilling', 'energy', 'crude', 'natural gas', 'well'],
  '2121': ['coal', 'mining', 'mineral', 'underground', 'surface', 'energy', 'fossil', 'mine'],
  '2211': ['electric', 'power', 'electricity', 'generation', 'transmission', 'distribution', 'utility', 'grid', 'energy'],
  '2212': ['natural gas', 'gas', 'distribution', 'pipeline', 'utility', 'energy'],
  '2361': ['residential', 'housing', 'home', 'house', 'construction', 'builder', 'building', 'remodel', 'renovation'],
  '2362': ['nonresidential', 'commercial', 'industrial', 'building', 'construction', 'office', 'warehouse', 'institutional'],
  '2381': ['foundation', 'structure', 'exterior', 'concrete', 'steel', 'framing', 'roofing', 'masonry', 'contractor'],
  '2382': ['building equipment', 'electrical', 'plumbing', 'hvac', 'contractor', 'wiring', 'heating', 'air conditioning'],
  '2383': ['building finishing', 'drywall', 'painting', 'flooring', 'tile', 'carpentry', 'interior', 'contractor'],
  '3111': ['animal food', 'pet food', 'feed', 'manufacturing', 'dog food', 'cat food', 'livestock feed'],
  '3112': ['grain milling', 'flour', 'rice', 'cereal', 'malt', 'oilseed processing', 'food manufacturing'],
  '3118': ['bakery', 'bread', 'pastry', 'tortilla', 'cookie', 'cracker', 'pasta', 'baking', 'food'],
  '3151': ['apparel', 'knitting', 'hosiery', 'sock', 'textile', 'clothing', 'fabric', 'mill'],
  '3152': ['cut and sew', 'apparel', 'clothing', 'garment', 'fashion', 'manufacturing', 'textile', 'dress'],
  '3211': ['sawmill', 'wood', 'lumber', 'timber', 'preservation', 'forest', 'logging', 'mill'],
  '3231': ['printing', 'publisher', 'commercial print', 'screen print', 'book', 'newspaper', 'press', 'graphic'],
  '3241': ['petroleum', 'coal', 'refinery', 'asphalt', 'fuel', 'oil', 'gasoline', 'chemical', 'energy'],
  '3251': ['chemical', 'petrochemical', 'industrial gas', 'dye', 'pigment', 'fertilizer', 'plastic', 'resin'],
  '3261': ['plastic', 'plastics', 'packaging', 'bag', 'pouch', 'film', 'sheet', 'pipe', 'molding', 'polymer'],
  '3311': ['iron', 'steel', 'mill', 'ferroalloy', 'metal', 'foundry', 'smelting', 'blast furnace'],
  '3321': ['forging', 'stamping', 'metal', 'roll forming', 'powder metallurgy', 'automotive parts', 'die'],
  '3331': ['machinery', 'agriculture', 'construction', 'mining', 'equipment', 'tractor', 'excavator', 'heavy'],
  '3341': ['computer', 'peripheral', 'electronic', 'hardware', 'server', 'storage', 'laptop', 'desktop', 'tech'],
  '3351': ['electric lighting', 'lamp', 'bulb', 'fixture', 'residential', 'commercial', 'led', 'illumination'],
  '3361': ['motor vehicle', 'car', 'automobile', 'truck', 'auto', 'vehicle', 'manufacturing', 'assembly', 'sedan', 'suv', 'cars'],
  '4231': ['motor vehicle', 'car', 'auto', 'wholesale', 'parts', 'tire', 'dealer', 'distributor', 'supply'],
  '4232': ['furniture', 'home furnishing', 'wholesale', 'interior', 'decor', 'household', 'distributor'],
  '4244': ['grocery', 'food', 'wholesale', 'distributor', 'frozen', 'dairy', 'meat', 'produce', 'beverage'],
  '4411': ['automobile', 'car', 'dealer', 'new car', 'used car', 'auto sales', 'dealership', 'vehicle', 'showroom'],
  '4412': ['motor vehicle', 'rv', 'recreational', 'boat', 'motorcycle', 'atv', 'dealer', 'powersports'],
  '4431': ['electronics', 'appliance', 'store', 'retail', 'tv', 'computer', 'phone', 'gadget', 'home'],
  '4441': ['building material', 'hardware', 'home center', 'paint', 'lumber', 'supply', 'diy', 'improvement', 'store'],
  '4451': ['grocery', 'supermarket', 'convenience', 'food', 'retail', 'market', 'store', 'produce', 'bakery'],
  '4471': ['gasoline', 'gas station', 'fuel', 'petrol', 'convenience', 'pump', 'service station', 'energy'],
  '4481': ['clothing', 'apparel', 'fashion', 'retail', 'boutique', 'store', 'menswear', 'womenswear', 'dress'],
  '4523': ['general merchandise', 'department store', 'warehouse club', 'supercenter', 'discount', 'retail', 'walmart'],
  '4532': ['office supply', 'stationery', 'gift', 'novelty', 'souvenir', 'paper', 'pen', 'card', 'store'],
  '4811': ['airline', 'air transportation', 'passenger', 'flight', 'aviation', 'scheduled', 'jet', 'travel'],
  '4841': ['trucking', 'freight', 'shipping', 'logistics', 'transport', 'cargo', 'haul', 'delivery', 'semi'],
  '4853': ['taxi', 'limousine', 'ride', 'transport', 'cab', 'uber', 'lyft', 'chauffeur', 'car service'],
  '4921': ['courier', 'express delivery', 'package', 'shipping', 'fedex', 'ups', 'logistics', 'parcel', 'mail'],
  '5111': ['newspaper', 'periodical', 'book', 'publisher', 'publishing', 'directory', 'media', 'print', 'magazine'],
  '5121': ['motion picture', 'video', 'film', 'movie', 'theater', 'cinema', 'production', 'hollywood', 'entertainment'],
  '5171': ['telecommunications', 'wired', 'wireless', 'phone', 'internet', 'broadband', 'carrier', 'isp', 'network'],
  '5182': ['data processing', 'hosting', 'cloud', 'server', 'it', 'technology', 'saas', 'web hosting', 'computing'],
  '5211': ['central bank', 'monetary', 'federal reserve', 'treasury', 'finance', 'government', 'currency'],
  '5221': ['bank', 'banking', 'credit', 'depository', 'savings', 'credit union', 'loan', 'mortgage', 'financial'],
  '5231': ['securities', 'brokerage', 'investment', 'stock', 'bond', 'trading', 'wall street', 'finance', 'commodity'],
  '5241': ['insurance', 'carrier', 'life', 'health', 'property', 'casualty', 'policy', 'underwriting', 'risk'],
  '5311': ['real estate', 'lessor', 'rental', 'property', 'landlord', 'apartment', 'office', 'building', 'lease'],
  '5321': ['automotive', 'rental', 'leasing', 'car rental', 'truck rental', 'vehicle', 'enterprise', 'hertz', 'avis'],
  '5411': ['legal', 'lawyer', 'attorney', 'law firm', 'litigation', 'counsel', 'notary', 'title', 'estate planning'],
  '5412': ['accounting', 'cpa', 'tax', 'bookkeeping', 'payroll', 'audit', 'financial', 'tax preparation', 'enrolled agent'],
  '5413': ['architectural', 'engineering', 'design', 'survey', 'drafting', 'civil', 'structural', 'mechanical', 'consulting'],
  '5415': ['computer systems', 'it', 'software', 'programming', 'design', 'technology', 'consulting', 'cyber', 'dev'],
  '5416': ['management', 'consulting', 'advisory', 'strategy', 'hr', 'marketing', 'logistics', 'business', 'expert'],
  '5511': ['holding company', 'management', 'enterprise', 'corporate', 'subsidiary', 'regional office', 'headquarters'],
  '5611': ['office administrative', 'virtual assistant', 'admin', 'secretarial', 'clerical', 'support', 'back office'],
  '5613': ['employment', 'staffing', 'temp agency', 'recruiting', 'headhunter', 'placement', 'hr', 'personnel', 'job'],
  '5617': ['janitorial', 'cleaning', 'pest control', 'landscaping', 'maintenance', 'exterminator', 'facility', 'service'],
  '6111': ['elementary school', 'secondary school', 'k-12', 'education', 'teaching', 'public school', 'private school', 'academy'],
  '6112': ['junior college', 'community college', 'education', 'associate degree', 'higher ed', 'academic'],
  '6113': ['college', 'university', 'higher education', 'degree', 'academic', 'professor', 'campus', 'student', 'graduate'],
  '6211': ['physician', 'doctor', 'medical', 'healthcare', 'clinic', 'md', 'primary care', 'specialist', 'medicine', 'health'],
  '6212': ['dentist', 'dental', 'oral', 'orthodontist', 'hygiene', 'teeth', 'healthcare', 'practice', 'dds', 'dmd'],
  '6213': ['health practitioner', 'chiropractor', 'optometrist', 'mental health', 'therapist', 'podiatrist', 'wellness', 'alternative'],
  '6214': ['outpatient', 'clinic', 'ambulatory', 'surgical', 'dialysis', 'hmo', 'healthcare', 'medical center', 'family planning'],
  '6221': ['hospital', 'medical', 'surgical', 'inpatient', 'emergency', 'healthcare', 'icu', 'ward', 'patient', 'nurse'],
  '6231': ['nursing', 'skilled nursing', 'nursing home', 'long term care', 'elderly', 'rehabilitation', 'assisted living', 'snf'],
  '6241': ['social service', 'family service', 'child', 'youth', 'elderly', 'disability', 'nonprofit', 'community', 'welfare'],
  '7111': ['performing arts', 'theater', 'dance', 'music', 'concert', 'entertainment', 'stage', 'broadway', 'opera', 'symphony'],
  '7113': ['promoter', 'event', 'sports', 'concert', 'ticket', 'venue', 'festival', 'entertainment', 'show', 'booking'],
  '7131': ['amusement', 'arcade', 'theme park', 'fun', 'entertainment', 'game', 'attraction', 'recreation', 'family'],
  '7211': ['hotel', 'motel', 'travel', 'accommodation', 'lodging', 'hospitality', 'inn', 'resort', 'bed and breakfast', 'bnb'],
  '7223': ['food service', 'catering', 'contractor', 'mobile food', 'food truck', 'event catering', 'cafeteria', 'banquet'],
  '7224': ['bar', 'tavern', 'pub', 'drinking', 'alcohol', 'nightclub', 'lounge', 'cocktail', 'beverage', 'wine'],
  '7225': ['restaurant', 'eating', 'food', 'dining', 'cafe', 'fast food', 'full service', 'limited service', 'buffet', 'snack'],
  '8111': ['automotive repair', 'mechanic', 'car repair', 'auto service', 'maintenance', 'body shop', 'oil change', 'tire', 'garage'],
  '8121': ['personal care', 'salon', 'barber', 'beauty', 'nail', 'spa', 'hair', 'stylist', 'wellness', 'grooming'],
  '8131': ['religious', 'church', 'temple', 'mosque', 'synagogue', 'faith', 'worship', 'ministry', 'spiritual', 'congregation'],
  '8139': ['business association', 'professional organization', 'labor union', 'political', 'nonprofit', 'lobby', 'advocacy', 'membership'],
  '9211': ['government', 'executive', 'legislative', 'public', 'civil service', 'municipal', 'federal', 'state', 'bureaucracy'],
};

function getKeywordsForNaics(code: string): string[] {
  return NAICS_KEYWORDS[code] || [];
}

const fourDigitOptions = Object.entries(FOUR_DIGIT_NAICS)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([code, title]) => ({ code, title }));

function getSixDigitOptions(parentCode: string): { code: string; title: string }[] {
  const options = Object.entries(SIX_DIGIT_MAP)
    .filter(([, info]) => info.parent === parentCode)
    .map(([code, info]) => ({ code, title: info.title }));
  options.sort((a, b) => a.code.localeCompare(b.code));
  return options;
}

function getControlsForMetric({
  metric,
  actual,
  benchmark,
  naicsCode,
}: {
  metric: string;
  actual: number;
  benchmark: number;
  naicsCode?: string;
}): { controls: InternalControl[]; source: string } {
  let universal: InternalControl[] = [];
  let specific: InternalControl[] = [];
  let sourceFile: ControlFile | null = null;
  let sourceTag = 'Universal';

  switch (metric) {
    case 'cash_runway': {
      const below = actual < benchmark;
      sourceFile = (below ? cashRunwayBelowControls : cashRunwayAboveControls) as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    case 'dso': {
      sourceFile = (actual <= benchmark ? dsoFastControls : dsoSlowControls) as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    case 'gross_margin': {
      sourceFile = (actual >= benchmark ? grossMarginAboveControls : grossMarginBelowControls) as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    case 'operating_margin': {
      sourceFile = (actual >= benchmark ? operatingMarginAboveControls : operatingMarginBelowControls) as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    case 'cost_structure': {
      sourceFile = costStructureControls as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    case 'current_ratio': {
      sourceFile = (actual >= benchmark ? currentRatioAboveControls : currentRatioBelowControls) as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    case 'debt_to_equity': {
      sourceFile = (actual >= benchmark ? debtToEquityAboveControls : debtToEquityBelowControls) as ControlFile;
      universal = sourceFile.universal_controls || [];
      break;
    }
    default:
      break;
  }

// ✅ REPLACE IT WITH THIS:
if (naicsCode && sourceFile) {
  const override = sourceFile.naics_4digit_overrides?.[naicsCode];
  if (override?.controls) {
    specific = override.controls;
    
    // Look up the clean name from the dictionary, or use the code as a backup
    const industryTitle = FOUR_DIGIT_NAICS[naicsCode] || naicsCode;
    sourceTag = `Industry: ${industryTitle}`;
    
  } else {
      const sectorKey = naicsCode.substring(0, 2);
      specific =
        sourceFile.sector_controls?.[sectorKey]?.controls ||
        sourceFile.sector_growth_controls?.[sectorKey]?.controls ||
        [];
      if (specific.length > 0) {
        sourceTag = `Sector: ${sectorKey}xx`;
      }
    }
  }

  return { controls: [...universal, ...specific].slice(0, 6), source: sourceTag };
}

const InternalControlsPanel = ({ controls, sourceTag }: { controls: InternalControl[]; sourceTag: string }) => {
  if (!controls.length) return null;
  return (
    <div className="mt-4 border-t border-gray-700/50 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-cyan-400" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-300">Checks and Balances</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
          <Tag size={10} className="text-indigo-400" />
          <span className="text-[9px] font-medium text-indigo-300">{sourceTag}</span>
        </div>
      </div>
      {sourceTag.includes('Universal') && (
        <div className="mb-3 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
          ⚠️ Showing universal controls only. Select a specific industry from the dropdown above to see industry-specific Checks and Balances.
        </div>
      )}
      <div className="space-y-2">
        {controls.map((control) => (
          <div key={control.id} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-3 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-white">{control.title}</div>
                <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">{control.description}</div>
              </div>
              <div className="text-[9px] px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 whitespace-nowrap">
                {control.effort || 'Medium'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(control.impact_days || control.cash_impact_days) && (
                <div className="text-[9px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Impact: {control.impact_days || control.cash_impact_days} days
                </div>
              )}
              {control.category && (
                <div className="text-[9px] px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {control.category}
                </div>
              )}
            </div>
            {control.audit_trail && (
              <div className="mt-3 text-[9px] text-gray-500 border-t border-gray-800 pt-2">
                Audit Trail: {control.audit_trail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const HealthScoreCard = ({ metrics }: { metrics: any }) => {
  const weights = { cash_runway: 0.25, gross_margin: 0.20, operating_margin: 0.20, dso: 0.15, current_ratio: 0.10, debt_to_equity: 0.10 };
  const components = [
    { key: 'cash_runway', value: metrics.cash_runway || 6.5, benchmark: 4.2, dir: 'higher' },
    { key: 'gross_margin', value: metrics.gross_margin || 55, benchmark: 48, dir: 'higher' },
    { key: 'operating_margin', value: metrics.operating_margin || 18, benchmark: 12, dir: 'higher' },
    { key: 'dso', value: metrics.dso_ttm || metrics.dso || 44, benchmark: 37, dir: 'lower' },
    { key: 'current_ratio', value: metrics.current_ratio || 1.8, benchmark: 1.5, dir: 'higher' },
    { key: 'debt_to_equity', value: metrics.debt_to_equity || 0.6, benchmark: 0.9, dir: 'lower' },
  ];

const termMap: Record<string, string> = {
  cash_runway: 'Months of cash the Business has left',
  gross_margin: 'Money left after Cost of Sales compared to Money from Sales',
  operating_margin: 'Money left after Running the Business compared to Money from Sales',
  dso: 'Days to get paid after a sale',
  current_ratio: 'Cash and resources for use within 12 months vs. Debts to be paid within 12 months',
  debt_to_equity: 'Debts vs. Company\'s Value',
};

  const diffs = components.map(c => c.dir === 'higher' ? c.value - c.benchmark : c.benchmark - c.value);
  const normalized = components.map((c, i) => {
    const val = c.dir === 'higher' ? (c.value / c.benchmark) * 50 + 25 : (c.benchmark / c.value) * 50 + 25;
    return Math.min(100, Math.max(0, val));
  });
  const score = Math.round(normalized.reduce((sum, v, i) => sum + v * Object.values(weights)[i], 0));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const bg = score >= 80 ? 'bg-emerald-500/20' : score >= 60 ? 'bg-amber-500/20' : 'bg-red-500/20';
  const best = components.reduce((b, c, i) => diffs[i] > diffs[b] ? i : b, 0);
  const worst = components.reduce((b, c, i) => diffs[i] < diffs[b] ? i : b, 0);

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${bg} flex items-center justify-center border-2 border-gray-600`}>
            <span className={`text-2xl font-bold ${color}`}>{grade}</span>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Overall Health</div>
            <div className="text-3xl font-bold text-white">{score} <span className="text-lg text-gray-400">/100</span></div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {score >= 70 ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-amber-400" />}
            <span className="text-gray-300">
{diffs[best] > 0
? `✅ ${termMap[components[best].key] || components[best].key.replace('_', ' ')} is ${Math.abs(Math.round(diffs[best]))}${components[best].key.includes('margin') ? '%' : ''} above the industry average` 
: `⚠️ Focus on improving ${termMap[components[worst].key] || components[worst].key.replace('_', ' ')}` }
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={14} className="text-cyan-400" />
            <span className="text-gray-400">Priority: <span className="text-white">{components[worst].key === 'cash_runway' ? 'Reduce burn rate' : components[worst].key === 'dso' ? 'Collect overdue invoices' : 'Review pricing/cost of sales'}</span></span>
          </div>
        </div>
        <div className="w-full md:w-48">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CashFlowForecastCard = ({ currentCash, monthlyBurnRate }: { currentCash: number; monthlyBurnRate: number }) => {
  const roundedBurnRate = Math.round(monthlyBurnRate);
  const runway = monthlyBurnRate > 0 ? currentCash / monthlyBurnRate : 99;
  const data = [
    { name: 'Now', cash: currentCash },
    { name: '30d', cash: Math.max(0, currentCash - monthlyBurnRate) },
    { name: '60d', cash: Math.max(0, currentCash - monthlyBurnRate * 2) },
    { name: '90d', cash: Math.max(0, currentCash - monthlyBurnRate * 3) },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Cash Flow Forecast</div>
          <div className="text-3xl font-bold text-white mt-1">${currentCash.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Monthly burn: ${roundedBurnRate.toLocaleString()}</div>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${runway > 6 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
          <div className="text-sm font-bold">{runway.toFixed(1)} months of cash the business has left</div>
          <div className="text-[10px] opacity-80">at current spend</div>
        </div>
      </div>
      <div className="h-24 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cashG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="cash" stroke="#06b6d4" fillOpacity={1} fill="url(#cashG)" isAnimationActive={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-gray-300">
        {runway > 6
          ? <><span className="text-emerald-400 font-medium">✅ Healthy trajectory.</span> ~{runway.toFixed(1)} months of cash remain. Focus on margin improvement.</>
          : <><span className="text-amber-400 font-medium">⚠️ Tight runway.</span> Reduce expenses or secure funding within {runway.toFixed(1)} months.</>}
      </div>
    </div>
  );
};

const ExecutiveBriefingCard = ({ metrics, alerts, goals }: { metrics: any; alerts: any[]; goals: any[] }) => {
  const wins: string[] = [];
  const attention: string[] = [];

  if (metrics.gross_margin > 48) wins.push('Money after Cost of Sales compared to Money from Sales outperforms industry average.');
  else attention.push('Money after Cost of Sales compared to Money from Sales is below industry benchmark.');

  if (metrics.cash_runway > 6) wins.push('Months of Cash the Business has left is healthy (>6 months).');
  else attention.push('Months of Cash the Business has left is tightening. Monitor burn rate.');

  if (metrics.dso_ttm < 40 || metrics.dso < 40) wins.push('Collections are faster than industry average.');
  else attention.push('Days to get paid after Sales is elevated. Prioritize overdue invoice follow-ups.');

  const activeAlerts = alerts.filter(a => a.priority === 'high').length;
  if (activeAlerts > 0) attention.push(`${activeAlerts} high-priority tax compliance items require review.`);

  const onTrackGoals = goals.filter(g => (g.inverse ? g.current > g.target : g.current >= g.target * 0.9)).length;
  if (onTrackGoals === goals.length) wins.push('All tracked goals are on or ahead of schedule.');
  else attention.push(`${goals.length - onTrackGoals} goals are behind schedule.`);

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Executive Briefing</h3>
      </div>
      <div className="space-y-3 text-[11px] leading-relaxed">
        <div className="text-gray-300">
          <span className="text-emerald-400 font-semibold">Current State:</span> {wins.length > 0 ? wins.join(' ') : 'Stabilizing operations.'}
        </div>
        {attention.length > 0 && (
          <div className="text-gray-300">
            <span className="text-amber-400 font-semibold">Attention Required:</span> {attention.join(' ')}
          </div>
        )}
        <div className="pt-2 border-t border-gray-700/50 text-gray-400">
          Recommendation: {attention.length > 0 ? 'Address cash/days to get paid after a sale first, then implement high-impact tax optimizations.' : 'Maintain current trajectory; focus on scaling profitable revenue streams.'}
        </div>
      </div>
    </div>
  );
};

// Replace the entire TaxImpactBridgeCard component with this:
const TaxImpactBridgeCard = ({ alerts, baseMetrics, homeOfficeSqFt }: { alerts: any[]; baseMetrics: any; homeOfficeSqFt: number }) => {
  const monthlyBurn = baseMetrics.opex / 12;

  const getAlertMeta = (alert: any) => {
    const section = alert.section || '';
    const title = alert.title || '';
    const combined = `${section} ${title}`.toLowerCase();

    if (combined.includes('280a') || combined.includes('home office')) {
      return {
        label: 'Home Office Deduction',
        explanation: 'If you have a dedicated workspace at home, you can deduct a portion of your rent, utilities, and other home costs. This reduces your taxable income, saving you cash.',
      };
    }
    if (combined.includes('179') || combined.includes('depreciation') || combined.includes('equipment purchases')) {
      return {
        label: 'Expensing Tools & Equipment (Section 179)',
        explanation: 'The IRS lets you deduct the full cost of new equipment (up to ~$1.22 million) in the year you buy it – instead of spreading it over many years. This lowers your tax bill immediately, putting cash back in your pocket.',
      };
    }
    if (combined.includes('199a') || combined.includes('qualified business income')) {
      return {
        label: 'QBI Deduction (Small Business Bonus)',
        explanation: 'Many business owners can deduct up to 20% of their qualified business income on their personal tax return. That means you pay tax on only 80% of that income – a significant cash saver.',
      };
    }
    if (combined.includes('274') || combined.includes('meals')) {
      return {
        label: 'Business Meals Deduction',
        explanation: 'When you take clients or partners out for a meal, you can deduct 50% of the cost. This reduces your taxable income, so you keep more of your hard‑earned cash.',
      };
    }
    if (combined.includes('174') || combined.includes('research')) {
      return {
        label: 'R&D Expenses Must Be Capitalised',
        explanation: 'New tax rules force you to spread R&D costs over 5 years instead of deducting them immediately. This temporarily reduces your cash flow – plan accordingly.',
      };
    }
    if (combined.includes('3111') || combined.includes('classification')) {
      return {
        label: 'Employee Classification Risk',
        explanation: 'If you treat a worker as a contractor but the IRS says they should be an employee, you could owe back payroll taxes (about 7.65% of their pay) plus penalties. Correct classification protects your cash flow.',
      };
    }
    return {
      label: title,
      explanation: 'Tax rule that may affect your cash flow.',
    };
  };

  const computeImpact = (alert: any) => {
    const section = alert.section || '';
    const title = alert.title || '';
    const combined = `${section} ${title}`.toLowerCase();

    let cashImpact = 0;
    let calculationNote = '';

    // Home Office Deduction (§280A) – uses user-provided square footage
    if (combined.includes('280a') || combined.includes('home office')) {
      const deduction = homeOfficeSqFt * 5; // $5 per sq ft simplified method
      cashImpact = deduction * 0.25; // 25% marginal tax rate
      calculationNote = `${homeOfficeSqFt} sq ft × $5/sq ft × 25% tax rate = $${Math.round(cashImpact).toLocaleString()} saved`;
    }
    // Section 179 / Expensing Tools and Equipment
    else if (combined.includes('179') || combined.includes('depreciation') || combined.includes('equipment purchases')) {
      const max179 = 1220000;
      const eligibleAssets = Math.min(baseMetrics.fixed_assets, max179);
      cashImpact = eligibleAssets * 0.21;
      calculationNote = `$${baseMetrics.fixed_assets.toLocaleString()} equipment cost × 21% tax rate = $${Math.round(cashImpact).toLocaleString()} saved this year`;
    }
    // QBI Deduction (§199A)
    else if (combined.includes('199a') || combined.includes('qualified business income')) {
      const qbi = Math.max(0, baseMetrics.net_income);
      const deduction = qbi * 0.20;
      cashImpact = deduction * 0.21;
      calculationNote = `Net income $${baseMetrics.net_income.toLocaleString()} × 20% QBI × 21% tax rate = $${Math.round(cashImpact).toLocaleString()} saved`;
    }
    // Business Meals (§274) – uses real meals_expense from QuickBooks
    else if (combined.includes('274') || combined.includes('meals')) {
      const annualMealExpense = baseMetrics.meals_expense || 0;
      cashImpact = annualMealExpense * 0.5 * 0.21;
      calculationNote = `$${annualMealExpense.toLocaleString()} meals expense × 50% deductible × 21% tax rate = $${Math.round(cashImpact).toLocaleString()} saved`;
    }
    // R&D Expenses (§174) – uses real rnd_expense from QuickBooks
    else if (combined.includes('174') || combined.includes('research')) {
      const rndExpense = baseMetrics.rnd_expense || 0;
      // Negative impact because you can't deduct immediately (must capitalise)
      const lostDeduction = rndExpense * 0.8; // you lose 80% of immediate deduction
      cashImpact = -lostDeduction * 0.21;
      calculationNote = `$${rndExpense.toLocaleString()} R&D expense must be capitalised – estimated cash flow reduction of $${Math.round(Math.abs(cashImpact)).toLocaleString()}`;
    }
    // Employee Classification (§3111) – placeholder warning
    else if (combined.includes('3111') || combined.includes('classification')) {
      cashImpact = -15000;
      calculationNote = 'Estimated back payroll taxes + penalties if 1-2 workers are reclassified from contractor to employee';
    }
    else {
      cashImpact = 0;
      calculationNote = 'No cash impact estimated for this rule';
    }

    const runwayImpact = monthlyBurn > 0 ? cashImpact / monthlyBurn : 0;
    return { cashImpact, runwayImpact, calculationNote };
  };

  const impacts = alerts
    .map(alert => {
      const impact = computeImpact(alert);
      const meta = getAlertMeta(alert);
      return { ...alert, ...impact, friendlyLabel: meta.label, explanation: meta.explanation };
    })
    .filter(imp => imp.cashImpact !== 0);

  const totalNetImpact = impacts.reduce((sum, imp) => sum + imp.cashImpact, 0);
  const totalRunwayImpact = monthlyBurn > 0 ? totalNetImpact / monthlyBurn : 0;

  const formatRunway = (value: number) => {
    const absVal = Math.abs(value);
    if (absVal < 0.005) return '0.00';
    return value.toFixed(2);
  };

  if (impacts.length === 0) {
    return (
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitFork size={18} className="text-cyan-400" />
          <h3 className="text-white font-bold text-sm">Tax-to-Cash Impact Bridge</h3>
        </div>
        <div className="text-gray-400 text-sm text-center py-6">
          No specific tax opportunities with cash impact identified at this time.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitFork size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Tax-to-Cash Impact Bridge</h3>
      </div>
      <div className="space-y-3">
        {impacts.map((imp, i) => (
          <div key={i} className="flex flex-col p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold text-white">{imp.friendlyLabel}</span>
                  {imp.cashImpact < 0 && (
                    <div className="group relative">
                      <AlertTriangle size={12} className="text-red-400" />
                      <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-900 text-gray-300 text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                        Negative impact – potential risk or penalty
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-gray-300 leading-relaxed mb-2">
                  {imp.explanation}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/30">
              <div className="flex flex-col gap-1">
                <div className="text-[10px] text-gray-400">
                  Est. Cash Impact:{' '}
                  <span className={`${imp.cashImpact >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                    {imp.cashImpact >= 0 ? '+' : ''}${Math.round(Math.abs(imp.cashImpact)).toLocaleString()}
                  </span>
                </div>
                <div className="text-[9px] text-cyan-400/70">ⓘ {imp.calculationNote}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400">Cash Runway Impact</div>
                <div className={`text-sm font-bold ${imp.runwayImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {imp.runwayImpact >= 0 ? '+' : ''}{formatRunway(imp.runwayImpact)} mo
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <div className="flex items-center justify-between p-3 bg-gray-900/70 rounded-xl border border-gray-600/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Total Net Impact</span>
            <div className="group relative">
              <HelpCircle size={10} className="text-gray-500 hover:text-cyan-400 cursor-help" />
              <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-900 text-gray-300 text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                Sum of all cash impacts (positive = savings, negative = risk)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${totalNetImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalNetImpact >= 0 ? '+' : ''}${Math.round(Math.abs(totalNetImpact)).toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400">
              {totalRunwayImpact >= 0 ? '+' : ''}{formatRunway(totalRunwayImpact)} mo runway
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-gray-500">
        * Estimates based on your QuickBooks data and current tax rules. Consult a tax professional.
      </div>
    </div>
  );
};

const ComplianceCalendarCard = () => {
  const events = [
    { date: '2026-06-15', label: 'Estimated Tax Payment for the three months ending June 30th', type: 'tax', urgency: 'high' },
    { date: '2026-06-30', label: 'Payroll & Payroll-Related Tax Forms Filing', type: 'payroll', urgency: 'medium' },
    { date: '2026-07-15', label: 'Home Office Review', type: 'control', urgency: 'low' },
    { date: '2026-08-01', label: 'Days to get paid after a sale - Collection Sprint', type: 'control', urgency: 'medium' },
  ];

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Compliance & Control Calendar</h3>
      </div>
      <div className="space-y-2">
        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
            <div className={`w-2 h-2 rounded-full ${ev.urgency === 'high' ? 'bg-red-500' : ev.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <div className="flex-1">
              <div className="text-xs text-white font-medium">{ev.label}</div>
              <div className="text-[10px] text-gray-500">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <div className={`text-[9px] px-2 py-0.5 rounded-full ${ev.type === 'tax' ? 'bg-purple-500/20 text-purple-400' : ev.type === 'payroll' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {ev.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PriorityActionsPanel = ({ metrics, benchmarks }: { metrics: any; benchmarks: any }) => {
  const actions: { priority: 'high' | 'medium' | 'low'; description: string; advice: string; due: string; metric: string }[] = [];

  // Helper to format currency
  const formatCurrency = (value: number) => `$${Math.round(Math.abs(value)).toLocaleString()}`;

  // Helper to format percentages with commas
  const formatPercent = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };

  // Helper to format ratio
  const formatRatio = (value: number) => value.toFixed(2);

  // 1. DSO - High priority if above benchmark
  const currentDSO = metrics.dso_ttm || metrics.dso || 0;
  const dsoBenchmark = benchmarks.dso || 37;
  if (currentDSO > dsoBenchmark) {
    const avgDailySales = metrics.revenue / 365;
    const overdueAmount = (currentDSO - dsoBenchmark) * avgDailySales;
    actions.push({
      priority: 'high',
      description: `Days to get paid after a sale is ${currentDSO.toFixed(0)} days, above the industry average of ${dsoBenchmark} days. Estimated ${formatCurrency(overdueAmount)} is tied up in overdue invoices.`,
      advice: `Send payment reminders, offer early-pay discounts (e.g., 2% discount if paid within 10 days, due date of 30 days), or consider invoice factoring.`,
      due: 'This week',
      metric: 'dso',
    });
  }

  // 2. Cash Runway - High priority if less than 6 months
  const runway = metrics.cash_runway || 0;
  if (runway < 6 && runway > 0) {
    actions.push({
      priority: 'high',
      description: `Months of cash the business has left is only ${runway.toFixed(1)} months (healthy is >6 months).`,
      advice: `Reduce non-essential spending, negotiate payment terms with suppliers, or seek a short-term line of credit.`,
      due: 'Immediate',
      metric: 'cash_runway',
    });
  }

  // 3. Gross Margin - Medium priority if below benchmark
  const grossMargin = metrics.gross_margin || 0;
  const gmBenchmark = benchmarks.gross_margin || 48;
  if (grossMargin < gmBenchmark) {
    actions.push({
      priority: 'medium',
      description: `Money left after Cost of Sales compared to Money from Sales is ${formatPercent(grossMargin)} vs industry ${gmBenchmark}%.`,
      advice: `Review supplier pricing, increase sales prices, or reduce direct material/labor costs.`,
      due: 'This month',
      metric: 'gross_margin',
    });
  }

  // 4. Operating Margin - Medium priority if below benchmark
  const opMargin = metrics.operating_margin || 0;
  const omBenchmark = benchmarks.operating_margin || 12;
  if (opMargin < omBenchmark) {
    actions.push({
      priority: 'medium',
      description: `Comparison of money after running the business to money from sales is ${formatPercent(opMargin)} vs industry ${omBenchmark}%.`,
      advice: `Cut overhead (rent, subscriptions, admin), automate processes, or renegotiate fixed costs.`,
      due: 'This month',
      metric: 'operating_margin',
    });
  }

  // 5. Debt-to-Equity - Low priority if above benchmark
  const dte = metrics.debt_to_equity || 0;
  const dteBenchmark = benchmarks.debt_to_equity || 0.9;
  if (dte > dteBenchmark) {
    actions.push({
      priority: 'low',
      description: `Comparison of total debts to company's value is ${formatRatio(dte)} vs industry ${dteBenchmark}.`,
      advice: `Refinance high-interest debt, consider equity investment, or focus on paying down liabilities.`,
      due: 'Next quarter',
      metric: 'debt_to_equity',
    });
  }

  // If no actions, show a default "all good" message
  if (actions.length === 0) {
    return (
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={18} className="text-cyan-400" />
          <h3 className="text-white font-bold text-sm">Priority Actions</h3>
        </div>
        <div className="text-center text-gray-400 text-sm py-6">
          ✅ All key metrics are healthy. No urgent actions needed. Keep monitoring.
        </div>
      </div>
    );
  }

  // Sort actions by priority (high → medium → low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Priority Actions</h3>
      </div>
      <div className="space-y-3">
        {actions.map((a, i) => (
          <div key={i} className="flex flex-col p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-2 h-2 rounded-full ${a.priority === 'high' ? 'bg-red-500' : a.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div className="flex-1">
                <div className="text-xs text-white leading-relaxed">{a.description}</div>
                <div className="text-xs text-cyan-400 leading-relaxed mt-2">Action: {a.advice}</div>
                <div className="text-[10px] text-gray-500 mt-2">Due: {a.due}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BreakdownCard = ({ 
  topCustomers, 
  totalRevenue 
}: { 
  topCustomers: { name: string; revenue: number }[];
  totalRevenue: number;
}) => {
  const [showDebug, setShowDebug] = useState(false);

  // Define colors for the pie chart
  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#6b7280'];

  // Aggregate revenue by customer name (QBO may return multiple rows per customer)
  const customerMap: Record<string, number> = {};
  topCustomers.forEach((c: any) => {
    customerMap[c.name] = (customerMap[c.name] || 0) + c.revenue;
  });
  const customers = Object.entries(customerMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a: any, b: any) => b.revenue - a.revenue);

  const customerTotalRevenue = customers.reduce((sum, c) => sum + c.revenue, 0);

  const sortedCustomers = [...customers].sort((a, b) => b.revenue - a.revenue);
  const top3 = sortedCustomers.slice(0, 3);
  const otherClients = sortedCustomers.slice(3);
  const otherRevenue = otherClients.reduce((sum, c) => sum + c.revenue, 0);

  const chartData = [
    ...top3.map(c => ({
      name: c.name,
      value: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0,
      revenue: c.revenue,
    })),
    {
      name: 'Other Clients',
      value: totalRevenue > 0 ? (otherRevenue / totalRevenue) * 100 : 0,
      revenue: otherRevenue,
    },
  ].filter(d => d.revenue > 0);

  const top3Revenue = top3.reduce((sum, c) => sum + c.revenue, 0);
  const top3Percent = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0;

  // Helper to format currency with 2 decimal places
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieIcon size={18} className="text-cyan-400" />
          <h3 className="text-white font-bold text-sm">Revenue Concentration</h3>
        </div>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-[10px] px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          {showDebug ? 'Hide Debug' : '🔍 Debug'}
        </button>
      </div>

      {/* Existing chart and summary */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={chartData} 
                cx="50%" 
                cy="50%" 
                innerRadius={25} 
                outerRadius={45} 
                paddingAngle={2} 
                dataKey="value"
                nameKey="name"
                isAnimationActive={false}
              >
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                formatter={(value: number, name: string) => {
                  const item = chartData.find(c => c.name === name);
                  const dollarAmount = item ? formatCurrency(item.revenue) : '';
                  return [`${value.toFixed(1)}% (${dollarAmount})`, name];
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-[11px] text-gray-300">
            Top 3 clients = <span className="text-white font-medium">{top3Percent.toFixed(1)}%</span> of total revenue
            <span className="text-gray-500 ml-1">({formatCurrency(top3Revenue)})</span>
          </div>
          
          {/* Top 3 individual clients */}
          <div className="space-y-1 mt-2">
            {top3.map((customer, i) => {
              const percent = totalRevenue > 0 ? (customer.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-300 truncate max-w-[140px]">{customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{formatCurrency(customer.revenue)}</span>
                    <span className="text-cyan-400 font-medium w-10 text-right">{percent.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
            
            {/* Other Clients group */}
            {otherRevenue > 0 && (
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[3] }} />
                  <span className="text-gray-400">Other Clients ({otherClients.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{formatCurrency(otherRevenue)}</span>
                  <span className="text-gray-400 font-medium w-10 text-right">
                    {totalRevenue > 0 ? ((otherRevenue / totalRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            )}
            
            {/* Total customer income (sum of invoices) line */}
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-700/50 mt-1">
              <span className="text-gray-500 font-medium">Total Customer Income</span>
              <span className="text-white font-medium">{formatCurrency(customerTotalRevenue)}</span>
            </div>
            {/* Optional: show total revenue from P&L for transparency */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500 font-medium">Total Company Revenue (P&L)</span>
              <span className="text-white font-medium">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
          
          <div className="text-[11px] text-gray-400 leading-relaxed pt-2 border-t border-gray-700/30">
            {top3Percent > 70 ? (
              <>
                ⚠️ <span className="text-amber-400">Concentration risk:</span> Losing one major client would significantly impact revenue. Consider diversifying with 2 new prospects this quarter.
              </>
            ) : (
              <>
                ✅ <span className="text-emerald-400">Healthy diversification:</span> Revenue is well-distributed across your client base.
              </>
            )}
          </div>
        </div>
      </div>

      {/* DEBUG PANEL */}
      {showDebug && (
        <div className="mt-4 p-4 bg-gray-900/80 border border-cyan-500/30 rounded-xl text-xs">
          <div className="font-mono text-cyan-300 mb-3">📊 Revenue Concentration – Debug</div>
          <div className="space-y-2">
            {/* Total Company Revenue (from P&L) */}
            <div className="flex justify-between border-b border-gray-700 py-1">
              <span className="text-gray-400">Total Company Revenue (P&L)</span>
              <span className="text-white font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
            {/* Sum of Customer Revenues (from Invoices) */}
            <div className="flex justify-between border-b border-gray-700 py-1">
              <span className="text-gray-400">Sum of Customer Revenues (Invoices)</span>
              <span className="text-white font-bold">{formatCurrency(customerTotalRevenue)}</span>
            </div>
            {/* Difference */}
            <div className="flex justify-between border-b border-gray-700 py-1">
              <span className="text-gray-400">Difference (P&L - Invoices)</span>
              <span className={`font-bold ${totalRevenue - customerTotalRevenue !== 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatCurrency(totalRevenue - customerTotalRevenue)}
              </span>
              <span className="text-gray-500 text-[9px]">
                {totalRevenue - customerTotalRevenue !== 0 ? '⚠️ May include non‑customer revenue (e.g., interest, other income)' : '✅ Matches'}
              </span>
            </div>
            {/* Debug table – all customers individually */}
            <div className="mt-2 max-h-60 overflow-y-auto">
              <table className="w-full text-left text-[10px]">
                <thead className="text-gray-500 border-b border-gray-700">
                  <tr>
                    <th className="py-1 pr-4">Customer</th>
                    <th className="py-1 pr-4 text-right">Revenue</th>
                    <th className="py-1 text-right">% of Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const percent = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
                    return (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="py-1 pr-4 text-gray-300">{c.name}</td>
                        <td className="py-1 pr-4 text-right text-gray-300">{formatCurrency(c.revenue)}</td>
                        <td className="py-1 text-right text-cyan-400">{percent.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr className="border-t border-gray-700 font-bold">
                    <td className="py-1 pr-4 text-white">Total (all customers)</td>
                    <td className="py-1 pr-4 text-right text-white">{formatCurrency(customerTotalRevenue)}</td>
                    <td className="py-1 text-right text-white">
                      {totalRevenue > 0 ? ((customerTotalRevenue / totalRevenue) * 100).toFixed(2) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-[9px] text-gray-500 mt-2">
              * Percentages are based on <span className="text-white">Total Company Revenue (P&L)</span>, not the sum of customer revenues.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GoalProgressCard = ({ metrics, benchmarks }: { metrics: any; benchmarks: any }) => {
  // State for revenue target (editable)
  const [revenueTarget, setRevenueTarget] = useState(() => {
    const saved = localStorage.getItem('goal_revenue_target');
    if (saved) return parseFloat(saved);
    // Default: current revenue * 1.10, min $1,000
    const defaultTarget = Math.max(metrics.revenue * 1.1, 1000);
    return Math.round(defaultTarget);
  });
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [revenueInput, setRevenueInput] = useState(revenueTarget.toString());

  // State for DSO target (editable) – default to industry benchmark
  const [dsoTarget, setDsoTarget] = useState(() => {
    const saved = localStorage.getItem('goal_dso_target');
    return saved ? parseFloat(saved) : (benchmarks.dso || 37);
  });
  const [isEditingDSO, setIsEditingDSO] = useState(false);
  const [dsoInput, setDsoInput] = useState(dsoTarget.toString());

  // Current values from QuickBooks (live)
  const currentRevenue = metrics.revenue;
  const currentDSO = metrics.dso_ttm || metrics.dso || 0;

  // Save revenue target to localStorage when changed
  const saveRevenueTarget = (value: number) => {
    const newTarget = Math.max(1, value);
    setRevenueTarget(newTarget);
    localStorage.setItem('goal_revenue_target', newTarget.toString());
    setIsEditingRevenue(false);
  };

  const handleRevenueEdit = () => {
    setRevenueInput(revenueTarget.toString());
    setIsEditingRevenue(true);
  };

  const handleRevenueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRevenueInput(e.target.value);
  };

  const handleRevenueInputBlur = () => {
    const num = parseFloat(revenueInput);
    if (!isNaN(num)) {
      saveRevenueTarget(num);
    } else {
      setIsEditingRevenue(false);
    }
  };

  const handleRevenueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const num = parseFloat(revenueInput);
      if (!isNaN(num)) saveRevenueTarget(num);
      else setIsEditingRevenue(false);
    } else if (e.key === 'Escape') {
      setIsEditingRevenue(false);
    }
  };

  // Save DSO target to localStorage
  const saveDSOTarget = (value: number) => {
    const newTarget = Math.max(1, value);
    setDsoTarget(newTarget);
    localStorage.setItem('goal_dso_target', newTarget.toString());
    setIsEditingDSO(false);
  };

  const handleDSOEdit = () => {
    setDsoInput(dsoTarget.toString());
    setIsEditingDSO(true);
  };

  const handleDSOInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDsoInput(e.target.value);
  };

  const handleDSOInputBlur = () => {
    const num = parseFloat(dsoInput);
    if (!isNaN(num)) saveDSOTarget(num);
    else setIsEditingDSO(false);
  };

  const handleDSOKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const num = parseFloat(dsoInput);
      if (!isNaN(num)) saveDSOTarget(num);
      else setIsEditingDSO(false);
    } else if (e.key === 'Escape') {
      setIsEditingDSO(false);
    }
  };

  // Calculate progress percentages
  const revenueProgress = Math.min(100, (currentRevenue / revenueTarget) * 100);
  // For DSO, lower is better: progress = (target / current) * 100, but cap at 100%
  const dsoProgress = currentDSO > 0 ? Math.min(100, (dsoTarget / currentDSO) * 100) : 0;

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Goal Progress</h3>
      </div>
      <div className="space-y-4">
        {/* Revenue Goal */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-300">Revenue Goal</span>
              {!isEditingRevenue ? (
                <button onClick={handleRevenueEdit} className="text-gray-500 hover:text-cyan-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-7 7H10v-4l7-7z"/><path d="M4 20h16"/></svg>
                </button>
              ) : (
                <input
                  type="number"
                  value={revenueInput}
                  onChange={handleRevenueInputChange}
                  onBlur={handleRevenueInputBlur}
                  onKeyDown={handleRevenueKeyDown}
                  autoFocus
                  className="bg-gray-800 text-white text-[11px] w-24 px-1 rounded border border-cyan-500 focus:outline-none"
                  step="1000"
                />
              )}
            </div>
            <span className="text-[10px] text-gray-500">
              {isEditingRevenue ? 'Enter target' : `$${currentRevenue.toLocaleString()} / $${revenueTarget.toLocaleString()}`}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${revenueProgress >= 90 ? 'bg-emerald-500' : revenueProgress >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${revenueProgress}%` }} />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {revenueProgress.toFixed(0)}% of target
          </div>
        </div>

        {/* DSO Goal */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-300">Days to get paid after a sale</span>
              {!isEditingDSO ? (
                <button onClick={handleDSOEdit} className="text-gray-500 hover:text-cyan-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-7 7H10v-4l7-7z"/><path d="M4 20h16"/></svg>
                </button>
              ) : (
                <input
                  type="number"
                  value={dsoInput}
                  onChange={handleDSOInputChange}
                  onBlur={handleDSOInputBlur}
                  onKeyDown={handleDSOKeyDown}
                  autoFocus
                  className="bg-gray-800 text-white text-[11px] w-16 px-1 rounded border border-cyan-500 focus:outline-none"
                  step="1"
                />
              )}
            </div>
            <span className="text-[10px] text-gray-500">
              {isEditingDSO ? 'Enter target' : `${currentDSO.toFixed(0)} → ${dsoTarget} days`}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            {/* For inverse metric: lower is better. Green if progress >= 100 (current <= target) */}
            <div className={`h-full transition-all ${dsoProgress >= 100 ? 'bg-emerald-500' : dsoProgress >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dsoProgress}%` }} />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {currentDSO <= dsoTarget ? '✅ Target met' : `${dsoProgress.toFixed(0)}% toward target`}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioSimulator = ({ baseMetrics, onSimulate }: { baseMetrics: any; onSimulate: (vals: any) => void }) => {
  // Business‑friendly sliders (as percentage changes)
  const [revenueChange, setRevenueChange] = useState(0);    // percent (+/-)
  const [cogsChange, setCogsChange] = useState(0);         // percent (+/-) – lower is better
  const [opexChange, setOpexChange] = useState(0);         // percent (+/-) – lower is better
  const [dsoChange, setDsoChange] = useState(0);           // days (+/-)

  // Helper to apply changes to baseMetrics
  const projected = useMemo(() => {
    const rev = baseMetrics.revenue * (1 + revenueChange / 100);
    const cogs = baseMetrics.cogs * (1 + cogsChange / 100);
    const opex = baseMetrics.opex * (1 + opexChange / 100);
    const grossProfit = rev - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    const operatingMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
    const monthlyBurn = opex / 12;
    const currentMonthlyBurn = baseMetrics.opex / 12;
    const runway = monthlyBurn > 0 ? baseMetrics.cash / monthlyBurn : 99;
    const currentRunway = currentMonthlyBurn > 0 ? baseMetrics.cash / currentMonthlyBurn : 99;
    const projectedDso = Math.max(10, (baseMetrics.dso_ttm || baseMetrics.dso || 44) + dsoChange);

    return {
      revenue: rev,
      grossProfit,
      netProfit,
      grossMargin,
      operatingMargin,
      runway,
      projectedDso,
      changeInRunway: runway - currentRunway,
      changeInNetProfit: netProfit - (baseMetrics.revenue - baseMetrics.cogs - baseMetrics.opex),
    };
  }, [revenueChange, cogsChange, opexChange, dsoChange, baseMetrics]);

  const handleApply = () => {
    // Convert percentage changes back to multipliers for the parent state
    // Parent expects revenueMult, cogsMult, opexMult, dsoAdj
    const revenueMult = 1 + revenueChange / 100;
    const cogsMult = 1 + cogsChange / 100;
    const opexMult = 1 + opexChange / 100;
    const dsoAdj = dsoChange;
    onSimulate({ revenueMult, cogsMult, opexMult, dsoAdj });
  };

  // Preset scenarios
  const presets = {
    optimistic: () => {
      setRevenueChange(25);
      setCogsChange(-15);
      setOpexChange(-10);
      setDsoChange(-10);
    },
    pessimistic: () => {
      setRevenueChange(-15);
      setCogsChange(10);
      setOpexChange(10);
      setDsoChange(15);
    },
    focusOnCollections: () => {
      setRevenueChange(0);
      setCogsChange(0);
      setOpexChange(0);
      setDsoChange(-15);
    },
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">What‑If Scenario Simulator</h3>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={presets.optimistic}
          className="flex-1 py-1.5 px-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 rounded-lg text-[10px] font-medium text-emerald-300 transition-colors"
        >
          Optimistic
        </button>
        <button
          onClick={presets.pessimistic}
          className="flex-1 py-1.5 px-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-lg text-[10px] font-medium text-red-300 transition-colors"
        >
          Pessimistic
        </button>
        <button
          onClick={presets.focusOnCollections}
          className="flex-1 py-1.5 px-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded-lg text-[10px] font-medium text-amber-300 transition-colors"
        >
          Faster Collections
        </button>
      </div>

      {/* Plain‑language sliders */}
      <div className="space-y-4">
        {/* Sell more */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[11px] text-gray-300 font-medium">Sell more</label>
            <span className="text-[11px] text-cyan-400">{revenueChange >= 0 ? '+' : ''}{revenueChange}%</span>
          </div>
          <input
            type="range"
            min="-30"
            max="50"
            step="5"
            value={revenueChange}
            onChange={(e) => setRevenueChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <p className="text-[9px] text-gray-500 mt-1">Increase the number and/or price of products and services sold.</p>
        </div>

        {/* Reduce material costs (COGS) */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[11px] text-gray-300 font-medium">Reduce material costs</label>
            <span className="text-[11px] text-red-400">{cogsChange >= 0 ? '+' : ''}{cogsChange}%</span>
          </div>
          <input
            type="range"
            min="-30"
            max="20"
            step="5"
            value={cogsChange}
            onChange={(e) => setCogsChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <p className="text-[9px] text-gray-500 mt-1">Lower material costs increase money after cost of sales.</p>
        </div>

        {/* Cut overhead (OpEx) */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[11px] text-gray-300 font-medium">Cut overhead</label>
            <span className="text-[11px] text-amber-400">{opexChange >= 0 ? '+' : ''}{opexChange}%</span>
          </div>
          <input
            type="range"
            min="-30"
            max="20"
            step="5"
            value={opexChange}
            onChange={(e) => setOpexChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-[9px] text-gray-500 mt-1">Rent, payroll, marketing, subscriptions.</p>
        </div>

        {/* Get paid faster (DSO) */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[11px] text-gray-300 font-medium">Get paid faster</label>
            <span className="text-[11px] text-emerald-400">{dsoChange >= 0 ? `+${dsoChange}` : dsoChange} days</span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            step="1"
            value={dsoChange}
            onChange={(e) => setDsoChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-[9px] text-gray-500 mt-1">Reducing collection days improves cash flow.</p>
        </div>
      </div>

      {/* Output cards – plain English */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 mb-4 text-center">
        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
          <div className="text-[9px] text-gray-500 uppercase">Projected Money from Sales</div>
          <div className="text-sm font-bold text-white">${Math.round(projected.revenue).toLocaleString()}</div>
          <div className="text-[9px] text-gray-400">
            {revenueChange !== 0 && `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`}
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
          <div className="text-[9px] text-gray-500 uppercase">Money After Running the Business</div>
          <div className={`text-sm font-bold ${projected.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${Math.round(projected.netProfit).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400">
            {projected.changeInNetProfit !== 0 && `${projected.changeInNetProfit >= 0 ? '+' : ''}$${Math.round(Math.abs(projected.changeInNetProfit)).toLocaleString()}`}
          </div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
          <div className="text-[9px] text-gray-500 uppercase">Money after Cost of Sales Compared to Money from Sales</div>
          <div className="text-sm font-bold text-emerald-400">{projected.grossMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-700/50">
          <div className="text-[9px] text-gray-500 uppercase">Months of Cash the Business Has Left</div>
          <div className="text-sm font-bold text-cyan-400">{projected.runway.toFixed(1)} mo</div>
          <div className="text-[9px] text-gray-400">
            {projected.changeInRunway !== 0 && `${projected.changeInRunway >= 0 ? '+' : ''}${projected.changeInRunway.toFixed(1)} mo`}
          </div>
        </div>
      </div>

      <button
        onClick={handleApply}
        className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors"
      >
        Apply Scenario to Dashboard
      </button>
    </div>
  );
};

const RiskRadar = () => {
  const risks = [
    { name: 'Spendable Cash Risk', level: 'Low', color: 'bg-emerald-500', tip: 'Maintain 6+ months operating cash. Automate unpaid sales follow-ups.' },
    { name: 'Risk of having a few Customers', level: 'High', color: 'bg-red-500', tip: 'Diversify client base. Target 2 new accounts this quarter.' },
    { name: 'Tax and Regulation Risk', level: 'Medium', color: 'bg-amber-500', tip: 'Review the rules related to a home office and keeping documents related to business meals.' },
    { name: 'Efficiency Risk', level: 'Low', color: 'bg-emerald-500', tip: 'Days to get paid after a sale is improving. Continue 2% early-pay discounts.' },
  ];

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertOctagon size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Risk Radar & Early Warnings</h3>
      </div>
      <div className="space-y-3">
        {risks.map((r, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
            <div className={`mt-1 w-2 h-2 rounded-full ${r.color}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white font-medium">{r.name}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${r.level === 'High' ? 'bg-red-500/20 text-red-400' : r.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {r.level}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{r.tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContextualLearning = () => {
  const [open, setOpen] = useState<string | null>(null);
  const terms = [
    { 
      id: 'dso', 
      term: 'Days to get paid after a sale', 
      def: 'Average days it takes to collect payment after a sale. Lower = faster cash flow.', 
      why: 'Why it matters: High days to get paid after a sale ties up cash in unpaid invoices, increasing borrowing needs.' 
    },
    { 
      id: 'gross_margin', 
      term: 'Money left after Cost of Sales compared to Money from Sales', 
      def: 'Percentage of revenue left after direct production costs (cost of sales).', 
      why: 'Why it matters: Shows pricing power and production efficiency. Declines signal cost inflation or pricing pressure.' 
    },
    { 
      id: 'operating_margin', 
      term: 'Money left after Running the Business compared to Money from Sales', 
      def: 'Profit after paying for both direct costs (cost of sales) and operating expenses (rent, payroll, marketing).', 
      why: 'Why it matters: Measures how well you control overhead. A low or negative number means your business model is not sustainable.' 
    },
    { 
      id: 'current_ratio', 
      term: 'Cash and resources for use within 12 months vs. Debts to be paid within 12 months', 
      def: 'Current assets divided by current liabilities. Shows if you can pay short‑term debts with short‑term assets.', 
      why: 'Why it matters: Below 1.0 means you might struggle to pay bills on time. Above 1.5 is comfortable.' 
    },
    { 
      id: 'debt_to_equity', 
      term: 'Debts vs. Company\'s Value', 
      def: 'Total liabilities divided by total equity. Measures how much your business relies on borrowed money vs. owner investment.', 
      why: 'Why it matters: High ratio means high financial risk – lenders may charge higher interest or refuse loans.' 
    },
    { 
      id: 'runway', 
      term: 'Months of Cash the Business has left', 
      def: 'Months of operation you can fund with current cash reserves at current burn rate.', 
      why: 'Why it matters: Survival metric. <6 months requires immediate cost control or funding action.' 
    },
    { 
      id: 'qbi', 
      term: 'Qualified Business Income', 
      def: 'Up to 20% deduction on qualified business income for pass‑through entities (sole props, partnerships, S‑corps).', 
      why: 'Why it matters: Lowers taxable income significantly. Limitations related to businesses where the principal asset is the skill, expertise, reputation, or personal services of its employees or owners may apply at higher income levels.' 
    },
  ];

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">Contextual Learning & Glossary</h3>
      </div>
      <div className="space-y-2">
        {terms.map((t) => (
          <div key={t.id} className="border border-gray-700/50 rounded-xl overflow-hidden">
            <button 
              onClick={() => setOpen(open === t.id ? null : t.id)} 
              className="w-full flex items-center justify-between p-3 bg-gray-900/30 hover:bg-gray-900/50 transition-colors"
            >
              <span className="text-xs font-medium text-white">{t.term}</span>
              {open === t.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            {open === t.id && (
              <div className="p-3 bg-gray-900/60 border-t border-gray-700/50 space-y-2">
                <p className="text-[11px] text-gray-300">{t.def}</p>
                <p className="text-[10px] text-cyan-400 font-medium">{t.why}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const GrossMarginDetailCard = ({
  businessGrossProfit,
  businessNetSales,
  industryGrossProfit,
  industryNetSales,
  trend = '0%',
  trendDirection = 'neutral',
  plainLanguage = '',
  naicsCode = '',
  userGrossMarginPercent,
  industryGrossMarginPercent = 48,
}: {
  businessGrossProfit: number;
  businessNetSales: number;
  industryGrossProfit: number;
  industryNetSales: number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  plainLanguage?: string;
  naicsCode?: string;
  userGrossMarginPercent: number;
  industryGrossMarginPercent?: number;
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const data = [
    { name: 'Money left after Cost of Sales', value: businessGrossProfit, color: '#10b981' },
    { name: 'Money from Sales', value: businessNetSales, color: '#3b82f6' },
    { name: 'Industry Average: Money left after Cost of Sales', value: industryGrossProfit, color: '#f59e0b' },
    { name: 'Industry Average: Money from Sales', value: industryNetSales, color: '#6b7280' },
  ];
  const { controls, source } = getControlsForMetric({
    metric: 'gross_margin',
    actual: userGrossMarginPercent,
    benchmark: industryGrossMarginPercent,
    naicsCode,
  });
  const trendIcon = trendDirection === 'up' ? <TrendingUp size={14} /> : trendDirection === 'down' ? <TrendingDown size={14} /> : null;
  const trendColor = trendDirection === 'up' ? 'text-emerald-400' : trendDirection === 'down' ? 'text-red-400' : 'text-gray-400';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white shadow-lg">
          <div className="font-semibold">{point.name}</div>
          <div>Amount: ${point.value.toLocaleString()}</div>
          {point.name === 'Business Gross Profit' && <div>Gross Margin: {userGrossMarginPercent.toFixed(1)}%</div>}
          {point.name === 'Industry Gross Profit' && <div>Gross Margin (est.): {industryGrossMarginPercent.toFixed(1)}%</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Money left after Cost of Sales compared to Money from Sales</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>{trendIcon} <span>{trend}</span></div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {plainLanguage && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors">
            <HelpCircle size={12} /> Why is this important?
          </button>
          {showHelp && <div className="mt-2 text-[11px] text-gray-300 leading-relaxed bg-gray-900/50 p-2 rounded-lg">{plainLanguage}</div>}
        </div>
      )}
      <InternalControlsPanel controls={controls} sourceTag={source} />
    </div>
  );
};

const OperatingMarginDetailCard = ({
  businessEBIT,
  businessNetSales,
  industryEBIT,
  industryNetSales,
  trend = '0%',
  trendDirection = 'neutral',
  plainLanguage = '',
  naicsCode = '',
  userOperatingMarginPercent,
  industryOperatingMarginPercent = 12,
}: {
  businessEBIT: number;
  businessNetSales: number;
  industryEBIT: number;
  industryNetSales: number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  plainLanguage?: string;
  naicsCode?: string;
  userOperatingMarginPercent: number;
  industryOperatingMarginPercent?: number;
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const data = [
    { name: 'Money left after Running the Business', value: businessEBIT, color: '#3b82f6' },
    { name: 'Money from Sales', value: businessNetSales, color: '#10b981' },
    { name: 'Industry Average: Money left after Running the Business', value: industryEBIT, color: '#f59e0b' },
    { name: 'Industry Average: Money from Sales', value: industryNetSales, color: '#6b7280' },
  ];
  const { controls, source } = getControlsForMetric({
    metric: 'operating_margin',
    actual: userOperatingMarginPercent,
    benchmark: industryOperatingMarginPercent,
    naicsCode,
  });
  const trendIcon = trendDirection === 'up' ? <TrendingUp size={14} /> : trendDirection === 'down' ? <TrendingDown size={14} /> : null;
  const trendColor = trendDirection === 'up' ? 'text-emerald-400' : trendDirection === 'down' ? 'text-red-400' : 'text-gray-400';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white shadow-lg">
          <div className="font-semibold">{point.name}</div>
          <div>Amount: ${point.value.toLocaleString()}</div>
          {point.name === 'Business EBIT' && <div>Operating Margin: {userOperatingMarginPercent.toFixed(1)}%</div>}
          {point.name === 'Industry EBIT' && <div>Operating Margin (est.): {industryOperatingMarginPercent.toFixed(1)}%</div>}
          {point.name === 'Business Net Sales' && <div>Net Sales = Revenue - Returns/Allowances/Discounts</div>}
          {point.name === 'Industry Net Sales' && <div>Industry net sales (scaled to your revenue)</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Money left after Running the Business compared to Money from Sales</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>{trendIcon} <span>{trend}</span></div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {plainLanguage && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors">
            <HelpCircle size={12} /> Why is this important?
          </button>
          {showHelp && <div className="mt-2 text-[11px] text-gray-300 leading-relaxed bg-gray-900/50 p-2 rounded-lg">{plainLanguage}</div>}
        </div>
      )}
      <InternalControlsPanel controls={controls} sourceTag={source} />
    </div>
  );
};

const DSODetailCard = ({
  dsoYtd,
  dsoTtm,
  currentAR,
  currentNetSales,
  dsoTrendData,
  benchmark,
  naicsCode,
  plainLanguage = '',
}: {
  dsoYtd: number;
  dsoTtm: number;
  currentAR: number;
  currentNetSales: number;
  dsoTrendData: { month: string; dso: number }[];
  benchmark: number;
  naicsCode?: string;
  plainLanguage?: string;
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const { controls, source } = getControlsForMetric({
    metric: 'dso',
    actual: dsoTtm,
    benchmark,
    naicsCode,
  });
  const dsoChange = dsoTtm - (dsoTtm * 0.95);
  const trendIcon = dsoChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />;
  const trendColor = dsoChange < 0 ? 'text-emerald-400' : 'text-red-400';
  const trendText = dsoChange < 0 ? `↓ ${Math.abs(dsoChange).toFixed(1)} days` : `↑ ${dsoChange.toFixed(1)} days`;

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Days to get paid after a sale</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          {trendIcon} <span>{trendText}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/50">
          <div className="text-[9px] text-gray-400 uppercase">YTD days to get paid after a sale</div>
          <div className="text-2xl font-bold text-cyan-400">{dsoYtd.toFixed(1)}</div>
          <div className="text-[9px] text-gray-500">period-to-date</div>
        </div>
        <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/50">
          <div className="text-[9px] text-gray-400 uppercase">TTM days to get paid after a sale</div>
          <div className="text-2xl font-bold text-emerald-400">{dsoTtm.toFixed(1)}</div>
          <div className="text-[9px] text-gray-500">annualized</div>
        </div>
      </div>
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dsoTrendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickFormatter={(val) => val.slice(0, 3)} />
            <YAxis stroke="#9ca3af" fontSize={10} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Line type="monotone" dataKey="dso" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
        <div className="text-[10px] text-gray-400 mb-2">Days to get paid after a sale Calculation (TTM)</div>
        <div className="text-[11px] text-gray-300 font-mono">
          <div>days to get paid after a sale = (Money owed from Customers divided by Money from Sales) × 365</div>
          <div className="mt-1 text-cyan-400">
            = (${currentAR.toLocaleString()} ÷ ${currentNetSales.toLocaleString()}) × 365
          </div>
          <div className="text-emerald-400 font-bold">
            = {dsoTtm.toFixed(1)} days
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-500">
          Industry Benchmark: {benchmark} days ({dsoTtm < benchmark ? '✅ Better' : '️Needs Improvement'})
        </div>
      </div>
      {plainLanguage && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors">
            <HelpCircle size={12} /> Why is this important?
          </button>
          {showHelp && <div className="mt-2 text-[11px] text-gray-300 leading-relaxed bg-gray-900/50 p-2 rounded-lg">{plainLanguage}</div>}
        </div>
      )}
      <InternalControlsPanel controls={controls} sourceTag={source} />
    </div>
  );
};

const CurrentRatioDetailCard = ({
  businessCurrentAssets,
  businessCurrentLiabilities,
  industryCurrentAssets,
  industryCurrentLiabilities,
  trend = '0%',
  trendDirection = 'neutral',
  plainLanguage = '',
  naicsCode = '',
  userCurrentRatio,
  industryCurrentRatio = 1.5,
}: {
  businessCurrentAssets: number;
  businessCurrentLiabilities: number;
  industryCurrentAssets: number;
  industryCurrentLiabilities: number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  plainLanguage?: string;
  naicsCode?: string;
  userCurrentRatio: number;
  industryCurrentRatio?: number;
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const data = [
    { name: 'Cash and resources for use within 12 months', value: businessCurrentAssets, color: '#8b5cf6' },
    { name: 'Debts to be paid within 12 months', value: businessCurrentLiabilities, color: '#ec4899' },
    { name: 'Industry Average: Cash and resources for use within 12 months', value: industryCurrentAssets, color: '#f59e0b' },
    { name: 'Industry Average: Debts to be paid within 12 months', value: industryCurrentLiabilities, color: '#6b7280' },
  ];
  const { controls, source } = getControlsForMetric({
    metric: 'current_ratio',
    actual: userCurrentRatio,
    benchmark: industryCurrentRatio,
    naicsCode,
  });
  const trendIcon = trendDirection === 'up' ? <TrendingUp size={14} /> : trendDirection === 'down' ? <TrendingDown size={14} /> : null;
  const trendColor = trendDirection === 'up' ? 'text-emerald-400' : trendDirection === 'down' ? 'text-red-400' : 'text-gray-400';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white shadow-lg">
          <div className="font-semibold">{point.name}</div>
          <div>Amount: ${point.value.toLocaleString()}</div>
          {point.name === 'Business Current Assets' && <div>Current Ratio: {userCurrentRatio.toFixed(2)}</div>}
          {point.name === 'Industry Current Assets' && <div>Industry Current Ratio (est.): {industryCurrentRatio.toFixed(2)}</div>}
          {point.name === 'Business Current Liabilities' && <div>Short‑term obligations due within one year</div>}
          {point.name === 'Industry Current Liabilities' && <div>Scaled to your net sales</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Cash and resources for use within 12 months vs. Debts to be paid within 12 months</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>{trendIcon} <span>{trend}</span></div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {plainLanguage && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors">
            <HelpCircle size={12} /> Why is this important?
          </button>
          {showHelp && <div className="mt-2 text-[11px] text-gray-300 leading-relaxed bg-gray-900/50 p-2 rounded-lg">{plainLanguage}</div>}
        </div>
      )}
      <InternalControlsPanel controls={controls} sourceTag={source} />
    </div>
  );
};

const DebtToEquityDetailCard = ({
  businessTotalLiabilities,
  businessTotalEquity,
  industryTotalLiabilities,
  industryTotalEquity,
  trend = '0%',
  trendDirection = 'neutral',
  plainLanguage = '',
  naicsCode = '',
  userDebtToEquity,
  industryDebtToEquity = 0.9,
}: {
  businessTotalLiabilities: number;
  businessTotalEquity: number;
  industryTotalLiabilities: number;
  industryTotalEquity: number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  plainLanguage?: string;
  naicsCode?: string;
  userDebtToEquity: number;
  industryDebtToEquity?: number;
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const data = [
    { name: 'Total Debts', value: businessTotalLiabilities, color: '#ec4899' },
    { name: 'Company\'s Value', value: businessTotalEquity, color: '#10b981' },
    { name: 'Industry Average: Total Debts', value: industryTotalLiabilities, color: '#f59e0b' },
    { name: 'Industry Average: Company\'s Value', value: industryTotalEquity, color: '#3b82f6' },
  ];
  const { controls, source } = getControlsForMetric({
    metric: 'debt_to_equity',
    actual: userDebtToEquity,
    benchmark: industryDebtToEquity,
    naicsCode,
  });
  const trendIcon = trendDirection === 'up' ? <TrendingUp size={14} /> : trendDirection === 'down' ? <TrendingDown size={14} /> : null;
  const trendColor = trendDirection === 'up' ? 'text-red-400' : trendDirection === 'down' ? 'text-emerald-400' : 'text-gray-400';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs text-white shadow-lg">
          <div className="font-semibold">{point.name}</div>
          <div>Amount: ${point.value.toLocaleString()}</div>
          {point.name === 'Business Liabilities' && <div>Debt‑to‑Equity Ratio: {userDebtToEquity.toFixed(2)}</div>}
          {point.name === 'Industry Liabilities' && <div>Industry total debts compared to company's value (est.): {industryDebtToEquity.toFixed(2)}</div>}
          {point.name === 'Business Equity' && <div>Owner equity (net assets)</div>}
          {point.name === 'Industry Equity' && <div>Scaled to business net sales</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Debts vs. Company's Value</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>{trendIcon} <span>{trend}</span></div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {plainLanguage && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors">
            <HelpCircle size={12} /> Why is this important?
          </button>
          {showHelp && <div className="mt-2 text-[11px] text-gray-300 leading-relaxed bg-gray-900/50 p-2 rounded-lg">{plainLanguage}</div>}
        </div>
      )}
      <InternalControlsPanel controls={controls} sourceTag={source} />
    </div>
  );
};

const MetricCard = ({
  title,
  metric,
  value,
  benchmark,
  naicsCode,
  accentColor = '#06b6d4',
  trend = '0%',
  trendDirection = 'neutral',
  plainLanguage = '',
  sparklineData = [],
}: any) => {
  const [showHelp, setShowHelp] = useState(false);
  const { controls, source } = getControlsForMetric({ metric, actual: value, benchmark, naicsCode });
  const barData = [{ name: 'You', value }, { name: 'Industry', value: benchmark }];
  const trendIcon = trendDirection === 'up' ? <TrendingUp size={14} /> : trendDirection === 'down' ? <TrendingDown size={14} /> : null;
  const trendColor = trendDirection === 'up' ? 'text-emerald-400' : trendDirection === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{title}</div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>{trendIcon} <span>{trend}</span></div>
      </div>
      {sparklineData.length > 0 && (
        <div className="h-10 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData.map((v: number) => ({ val: v }))}>
              <Line type="monotone" dataKey="val" stroke={accentColor} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
            <YAxis stroke="#9ca3af" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
            <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {plainLanguage && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors">
            <HelpCircle size={12} /> Why is this important?
          </button>
          {showHelp && <div className="mt-2 text-[11px] text-gray-300 leading-relaxed bg-gray-900/50 p-2 rounded-lg">{plainLanguage}</div>}
        </div>
      )}
      <InternalControlsPanel controls={controls} sourceTag={source} />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Community Resources Panel Component
// -----------------------------------------------------------------------------
const CommunityResourcesPanel = ({ naicsCode }: { naicsCode: string }) => {
  // Extract the first 3 digits of the NAICS code
  const subsector = naicsCode.substring(0, 3);
  const resources = COMMUNITY_RESOURCES[subsector] || [];

  // Look up the sector name from the 4‑digit mapping
  const sectorKey = Object.keys(FOUR_DIGIT_NAICS).find(key => key.startsWith(subsector));
  const sectorName = sectorKey ? FOUR_DIGIT_NAICS[sectorKey] : `NAICS ${subsector}`;

  if (resources.length === 0) {
    return (
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={18} className="text-cyan-400" />
          <h3 className="text-white font-bold text-sm">Community Resources</h3>
        </div>
        <p className="text-gray-400 text-sm">
          No specific community resources found for {sectorName}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-cyan-400" />
        <h3 className="text-white font-bold text-sm">
          Community Resources for {sectorName}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {resources.map((resource, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 bg-gray-900/70 border border-gray-700/50 rounded-full text-xs text-gray-300"
          >
            {resource}
          </span>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT: SBOView
// =============================================================================
export default function SBOView() {
  const [selectedFourDigit, setSelectedFourDigit] = useState('7225');
  const [selectedSixDigit, setSelectedSixDigit] = useState('722511');
  const [selectedZipCode, setSelectedZipCode] = useState('60601');
  const [sixDigitOptions, setSixDigitOptions] = useState<{ code: string; title: string }[]>([]);

  // Combobox state for 4-digit dropdown
  const initialFourDigit = fourDigitOptions.find(o => o.code === '7225');
  const [fourDigitSearch, setFourDigitSearch] = useState(initialFourDigit ? `${initialFourDigit.title} (${initialFourDigit.code})` : '');
  const [isFourDigitOpen, setIsFourDigitOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const options = getSixDigitOptions(selectedFourDigit);
    setSixDigitOptions(options);
    if (options.length > 0) {
      if (!options.some(opt => opt.code === selectedSixDigit)) {
        setSelectedSixDigit(options[0].code);
      }
    } else {
      setSelectedSixDigit(selectedFourDigit);
    }
  }, [selectedFourDigit, selectedSixDigit]);

  // Filter logic for combobox
  const filteredFourDigitOptions = useMemo(() => {
    if (!fourDigitSearch) return fourDigitOptions;
    const lowerSearch = fourDigitSearch.toLowerCase().trim();
    return fourDigitOptions.filter(opt => {
      // Match against title
      if (opt.title.toLowerCase().includes(lowerSearch)) return true;
      // Match against code
      if (opt.code.includes(lowerSearch)) return true;
      // Match against keywords
      const keywords = getKeywordsForNaics(opt.code);
      return keywords.some(kw => kw.toLowerCase().includes(lowerSearch));
    });
  }, [fourDigitSearch]);

  // Handlers
  const handleSelectFourDigit = (code: string) => {
    setSelectedFourDigit(code);
    const selected = fourDigitOptions.find(o => o.code === code);
    setFourDigitSearch(selected ? `${selected.title} (${selected.code})` : '');
    setIsFourDigitOpen(false);
    setHighlightedIndex(-1);
  };

  const handleFourDigitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFourDigitSearch(e.target.value);
    setIsFourDigitOpen(true);
    setHighlightedIndex(-1);
  };

  const handleFourDigitKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredFourDigitOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredFourDigitOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredFourDigitOptions.length) {
        handleSelectFourDigit(filteredFourDigitOptions[highlightedIndex].code);
      }
    } else if (e.key === 'Escape') {
      setIsFourDigitOpen(false);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsFourDigitOpen(false);
        const selected = fourDigitOptions.find(o => o.code === selectedFourDigit);
        setFourDigitSearch(selected ? `${selected.title} (${selected.code})` : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedFourDigit]);

  const finalNaics = selectedSixDigit || selectedFourDigit;

  const [baseMetrics, setBaseMetrics] = useState({
    revenue: 9288.52,
    cogs: 405.0,
    opex: 57445.23,
    cash: 45200,
    dso: 44,
    dso_ytd: 0,
    dso_ttm: 0,
    accountsReceivable: 14281.52,
    cash_runway: 6.5,
    gross_margin: 55,
    operating_margin: 18,
    current_ratio: 1.8,
    debt_to_equity: 0.6,
    fixed_assets: 58495,
    net_income: -48561.71,
    discounts: 89.5,
    returns_allowances: 0,
    currentAssets: 45200 + 14281.52 + 5000,
    currentLiabilities: 157031.33,
    totalLiabilities: 157031.33 + 125000,
    totalEquity: -140124.21,
    topCustomers: [] as { name: string; revenue: number }[],
    meals_expense: 0,      // <-- add this
    rnd_expense: 0,        // <-- add this
  });

  useEffect(() => {
    const fetchQuickBooksMetrics = async () => {
      try {
        const response = await fetch('/api/quickbooks/metrics', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[SBOView] QuickBooks metrics received:', data);
          const hasRealData = data.revenue !== undefined && data.revenue !== null;
          if (hasRealData) {
            console.log('[SBOView] ✅ Using live QuickBooks data');

// Fetch real customer names from CustomerIncome report
let realTopCustomers: { name: string; revenue: number }[] = [];
let customerIncomeTotal: number | null = null;
try {
  const customerIncomeResponse = await fetch('/api/quickbooks/reports/CustomerIncome', {
    credentials: 'include',
  });
  if (customerIncomeResponse.ok) {
    const customerIncomeData = await customerIncomeResponse.json();
    console.log('[SBOView] CustomerIncome report received:', customerIncomeData);

    // Prefer the pre-parsed customers array returned by the backend
    if (Array.isArray(customerIncomeData.customers) && customerIncomeData.customers.length > 0) {
      realTopCustomers = customerIncomeData.customers;
      customerIncomeTotal = customerIncomeData.totalRevenue ?? null;
      console.log('[SBOView] ✅ Using pre-parsed customer data:', realTopCustomers);
    } else if (customerIncomeData.Rows && customerIncomeData.Rows.Row) {
      // Fallback: parse raw Rows if pre-parsed array is missing
      const rows = Array.isArray(customerIncomeData.Rows.Row)
        ? customerIncomeData.Rows.Row
        : [customerIncomeData.Rows.Row];

      const rawCustomers = rows
        .filter((row: any) => row.type === 'Data' && row.ColData && row.ColData.length >= 2)
        .map((row: any) => ({
          name: row.ColData[0]?.value || 'Unknown Customer',
          revenue: parseFloat(row.ColData[1]?.value || '0'),
        }))
        .filter((c: any) => c.revenue > 0);

      if (rawCustomers.length > 0) {
        realTopCustomers = rawCustomers;
        console.log('[SBOView] ✅ Using raw-row customer data:', rawCustomers);
      } else {
        console.warn('[SBOView] No customers found in report');
      }
    }
  } else {
    console.warn('[SBOView] CustomerIncome fetch failed:', customerIncomeResponse.status);
  }
} catch (customerError) {
  console.error('[SBOView] Error fetching CustomerIncome:', customerError);
}

// Inside fetchQuickBooksMetrics map the values to state variables safely
            setBaseMetrics({
              revenue: data.revenue ?? 59850.30, // Updated to match your actual YTD Profit and Loss sandbox revenue
              cogs: data.cogs ?? 405.0,
              opex: data.opex ?? 57445.23,
              cash: data.cash ?? 45200,
              dso: data.dso ?? 44,
              dso_ytd: data.dso_ytd ?? data.dso ?? 44,
              dso_ttm: data.dso_ttm ?? data.dso ?? 44,
              accountsReceivable: data.accountsReceivable ?? 14281.52,
              cash_runway: data.cash_runway ?? 6.5,
              gross_margin: data.gross_margin ?? 55,
              operating_margin: data.operating_margin ?? 18,
              current_ratio: data.current_ratio ?? 1.8,
              debt_to_equity: data.debt_to_equity ?? 0.6,
              fixed_assets: data.fixed_assets ?? 58495,
              net_income: data.net_income ?? -48561.71,
              discounts: data.discounts ?? 89.5,
              returns_allowances: data.returns_allowances ?? 0,
              currentAssets: data.currentAssets ?? 64481.52,
              currentLiabilities: data.currentLiabilities ?? 157031.33,
              totalLiabilities: data.totalLiabilities ?? 282031.33,
              totalEquity: data.totalEquity ?? -140124.21,
              topCustomers: realTopCustomers, 
              meals_expense: data.meals_expense ?? 0,   
              rnd_expense: data.rnd_expense ?? 0,       
            });
          } else {
            console.warn('[SBOView] ⚠️ API returned no revenue data, using fallback');
          }
        } else {
          console.error('[SBOView] Failed to fetch QuickBooks metrics:', response.status);
        }
      } catch (error) {
        console.error('[SBOView] Error fetching QuickBooks metrics:', error);
      }
    };

    fetchQuickBooksMetrics();
    const interval = setInterval(fetchQuickBooksMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const dsoTrendData = [
    { month: 'Jan', dso: 48.2 },
    { month: 'Feb', dso: 47.5 },
    { month: 'Mar', dso: 46.8 },
    { month: 'Apr', dso: 46.1 },
    { month: 'May', dso: 45.3 },
    { month: 'Jun', dso: 44.9 },
    { month: 'Jul', dso: 44.4 },
    { month: 'Aug', dso: 44.2 },
    { month: 'Sep', dso: 44.0 },
    { month: 'Oct', dso: 43.8 },
    { month: 'Nov', dso: 43.5 },
    { month: 'Dec', dso: 44.0 },
  ];

  const currentdays = baseMetrics.dso_ttm || baseMetrics.dso || dsoTrendData[dsoTrendData.length - 1].dso;
  const previousdays = dsoTrendData[dsoTrendData.length - 2].dso;
  const currentAR = baseMetrics.accountsReceivable;
  const previousAR = currentAR * 0.98;
  const businessNetSales = baseMetrics.revenue - (baseMetrics.returns_allowances + baseMetrics.discounts);
  const currentNetSales = businessNetSales;
  const previousNetSales = currentNetSales * 0.99;
  const businessGrossProfit = baseMetrics.revenue - baseMetrics.cogs;
  const businessEBIT = businessGrossProfit - baseMetrics.opex;
  const industryGrossMarginPercent = 48;
  const industryOperatingMarginPercent = 12;
  const industryGrossProfit = (industryGrossMarginPercent / 100) * businessNetSales;
  const industryEBIT = (industryOperatingMarginPercent / 100) * businessNetSales;
  const industryNetSales = businessNetSales;
  const industryCurrentLiabilities = businessNetSales;
  const industryCurrentAssets = industryCurrentLiabilities * 1.5;
  const industryTotalLiabilities = businessNetSales;
  const industryTotalEquity = industryTotalLiabilities / 0.9;

  const [simAdjustments, setSimAdjustments] = useState({ revenueMult: 1.0, cogsMult: 1.0, opexMult: 1.0, dsoAdj: 0 });
const [alerts] = useState([
  { id: '1', title: 'Home Office Deduction', priority: 'medium' },
  { id: '2', title: 'Expensing Tools and Equipment', priority: 'high' },
  { id: '3', title: 'Small Business Bonus (Qualified Business Income)', priority: 'medium' },
]);

const [taxAlerts, setTaxAlerts] = useState<any[]>([]);

  useEffect(() => {
    const options = getSixDigitOptions(selectedFourDigit);
    setSixDigitOptions(options);
    if (options.length > 0) {
      if (!options.some(opt => opt.code === selectedSixDigit)) {
        setSelectedSixDigit(options[0].code);
      }
    } else {
      setSelectedSixDigit(selectedFourDigit);
    }
  }, [selectedFourDigit, selectedSixDigit]);

const [homeOfficeSqFt, setHomeOfficeSqFt] = useState(() => {
  const saved = localStorage.getItem('homeOfficeSqFt');
  return saved ? parseInt(saved, 10) : 200;
});

useEffect(() => {
  localStorage.setItem('homeOfficeSqFt', homeOfficeSqFt.toString());
}, [homeOfficeSqFt]);

useEffect(() => {
  fetch('/api/tax-alerts')
    .then(res => res.json())
    .then(data => {
      if (data.alerts) {
        setTaxAlerts(data.alerts);
      }
    })
    .catch(err => console.error('Failed to fetch tax alerts:', err));
}, []);

  const goals = [
    { name: 'Q2 Revenue Target', current: 412000, target: 450000, date: 'Jun 30' },
    { name: 'Days to get paid after a sale Reduction', current: 44, target: 35, date: 'Aug 15', inverse: true },
  ];

  const displayMetrics = useMemo(() => {
    const { revenueMult, cogsMult, opexMult, dsoAdj } = simAdjustments;
    const rev = baseMetrics.revenue * revenueMult;
    const cogs = baseMetrics.cogs * cogsMult;
    const opex = baseMetrics.opex * opexMult;
    const grossMargin = rev > 0 ? ((rev - cogs) / rev) * 100 : 0;
    const operatingMargin = rev > 0 ? ((rev - cogs - opex) / rev) * 100 : 0;
    const monthlyBurn = opex / 12;
    const runway = monthlyBurn > 0 ? baseMetrics.cash / monthlyBurn : 99;
    return {
      ...baseMetrics,
      revenue: rev,
      gross_margin: grossMargin,
      operating_margin: operatingMargin,
      cash_runway: runway,
      dso_ttm: Math.max(10, (baseMetrics.dso_ttm || baseMetrics.dso || 44) + dsoAdj),
      dso_ytd: baseMetrics.dso_ytd || baseMetrics.dso || 44,
    };
  }, [baseMetrics, simAdjustments]);

const industryBenchmarks = {
  dso: 37,
  gross_margin: 48,
  operating_margin: 12,
  debt_to_equity: 0.9,
};

  const userGrossMarginPercent = displayMetrics.gross_margin;
  const userOperatingMarginPercent = displayMetrics.operating_margin;
  const userCurrentRatio = baseMetrics.current_ratio;
  const userDebtToEquity = baseMetrics.debt_to_equity;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Decision Maker Intelligence Dashboard</h1>
            <p className="text-gray-400 mt-2">Industry-specific internal controls engine</p>
          </div>
          <div className="flex flex-col items-start gap-3 w-full">
            {/* 4-Digit Combobox */}
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-xl border border-gray-700/50 relative min-w-[500px]" ref={comboboxRef}>
              <Building2 size={18} className="text-gray-400" />
              <div className="flex flex-col w-full">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Industry Sector (4-digit)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fourDigitSearch}
                    onChange={handleFourDigitInputChange}
                    onFocus={() => setIsFourDigitOpen(true)}
                    onKeyDown={handleFourDigitKeyDown}
                    placeholder="Search industry (e.g., Dentists, 5613)..."
                    className="bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white w-full focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {fourDigitSearch && (
                    <button
                      onClick={() => { setFourDigitSearch(''); setIsFourDigitOpen(true); setSelectedFourDigit(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {isFourDigitOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                    {filteredFourDigitOptions.length === 0 ? (
                      <div className="p-3 text-sm text-gray-400 text-center">No matches found</div>
                    ) : (
                      filteredFourDigitOptions.map((opt, idx) => (
                        <div
                          key={opt.code}
                          onClick={() => handleSelectFourDigit(opt.code)}
                          className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center ${
                            idx === highlightedIndex ? 'bg-cyan-600 text-white' : 'text-gray-200 hover:bg-gray-700'
                          } ${opt.code === selectedFourDigit ? 'bg-gray-700/50' : ''}`}
                        >
                          <span>{opt.title}</span>
                          <span className="text-xs text-gray-400 font-mono ml-2">({opt.code})</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 6-Digit Select */}
            {sixDigitOptions.length > 0 && (
              <div className="flex items-center gap-3 bg-gray-800/60 p-3 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                <Building2 size={18} className="text-cyan-400" />
                <div className="flex flex-col">
                  <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Detailed Industry (6-digit)</label>
                  <select
                    value={selectedSixDigit}
                    onChange={(e) => setSelectedSixDigit(e.target.value)}
                    className="bg-gray-800 text-sm font-medium text-white focus:outline-none cursor-pointer min-w-[240px]"
                  >
                    {sixDigitOptions.map(({ code, title }) => (
                      <option key={code} value={code} className="bg-gray-800 text-white">
                        {title} ({code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-gray-800/60 p-3 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <Landmark size={18} className="text-gray-400" />
              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Location (Zip Code)</label>
                <input
                  type="text"
                  value={selectedZipCode}
                  onChange={(e) => setSelectedZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="Enter zip code"
                  className="bg-transparent text-sm font-medium text-white focus:outline-none min-w-[120px]"
                  maxLength={5}
                />
              </div>
            </div>

            {/* Home Office Square Footage Input - STEP 5 */}
            <div className="flex items-center gap-3 bg-gray-800/60 p-3 rounded-xl border border-gray-700/50 backdrop-blur-sm">
              <Building2 size={18} className="text-gray-400" />
              <div className="flex flex-col">
                <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Home Office Sq Ft (if applicable)</label>
                <input
                  type="number"
                  value={homeOfficeSqFt}
                  onChange={(e) => setHomeOfficeSqFt(Math.min(300, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="bg-transparent text-sm font-medium text-white focus:outline-none min-w-[100px]"
                  step="10"
                  min="0"
                  max="300"
                />
                <span className="text-[8px] text-gray-500">Simplified method ($5/sq ft, max 300 sq ft)</span>
              </div>
            </div>

          </div>
        </div>

        <HealthScoreCard metrics={displayMetrics} />
        <CashFlowForecastCard currentCash={baseMetrics.cash} monthlyBurnRate={displayMetrics.opex / 12} />
        <IRCAlertsPanel />
        <ExecutiveBriefingCard metrics={displayMetrics} alerts={alerts} goals={goals} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaxImpactBridgeCard alerts={taxAlerts} baseMetrics={baseMetrics} homeOfficeSqFt={homeOfficeSqFt} />
          <ComplianceCalendarCard />
        </div>

        <DynamicIndustryWidget naics={finalNaics} zipCode={selectedZipCode} />

        {/* Community Resources Panel */}
        <CommunityResourcesPanel naicsCode={finalNaics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PriorityActionsPanel metrics={displayMetrics} benchmarks={industryBenchmarks} />
          <BreakdownCard topCustomers={baseMetrics.topCustomers}  totalRevenue={baseMetrics.revenue} />
          <GoalProgressCard metrics={displayMetrics} benchmarks={industryBenchmarks} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScenarioSimulator baseMetrics={baseMetrics} onSimulate={setSimAdjustments} />
          <RiskRadar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricCard title="Months of Cash the Business has left" metric="cash_runway" value={displayMetrics.cash_runway} benchmark={4.2} naicsCode={selectedFourDigit} accentColor="#06b6d4" trend={simAdjustments.opexMult < 1 ? "↑" : "→"} trendDirection={simAdjustments.opexMult < 1 ? "up" : "neutral"} plainLanguage="You can cover monthly expenses for ~6.5 months at current spending. Industry avg: 4.2 months." sparklineData={[5.8, 6.0, 6.2, 6.1, 6.4, 6.5]} />

          <GrossMarginDetailCard
            businessGrossProfit={businessGrossProfit}
            businessNetSales={businessNetSales}
            industryGrossProfit={industryGrossProfit}
            industryNetSales={industryNetSales}
            trend="+3.2%"
            trendDirection="up"
            plainLanguage="This shows how much you charge for your products and services, and how much money you spend to make your products or prepare your services.  A decrease signals cost inflation or pricing pressure.  For every $1 of sales, you keep $0.55 after direct costs (materials, labor, cost of sales). The industry average is 48%."
            naicsCode={selectedFourDigit}
            userGrossMarginPercent={userGrossMarginPercent}
            industryGrossMarginPercent={48}
          />

          <OperatingMarginDetailCard
            businessEBIT={businessEBIT}
            businessNetSales={businessNetSales}
            industryEBIT={industryEBIT}
            industryNetSales={industryNetSales}
            trend="+1.1%"
            trendDirection="up"
            plainLanguage="After all operating expenses, you keep $0.18 of every dollar as profit. The industry average is 12%."
            naicsCode={selectedFourDigit}
            userOperatingMarginPercent={userOperatingMarginPercent}
            industryOperatingMarginPercent={12}
          />

          <DSODetailCard
            dsoYtd={baseMetrics.dso_ytd || baseMetrics.dso || 44}
            dsoTtm={baseMetrics.dso_ttm || baseMetrics.dso || 44}
            currentAR={currentAR}
            currentNetSales={currentNetSales}
            dsoTrendData={dsoTrendData}
            benchmark={37}
            naicsCode={selectedFourDigit}
            plainLanguage="Days to get paid after a sale measures how quickly you collect payments.  A high number of days to get paid after a sale ties up cash in unpaid invoices, increasing the need to borrow money.  YTD shows current period; TTM gives annualized view."
          />

          <CurrentRatioDetailCard
            businessCurrentAssets={baseMetrics.currentAssets}
            businessCurrentLiabilities={baseMetrics.currentLiabilities}
            industryCurrentAssets={industryCurrentAssets}
            industryCurrentLiabilities={industryCurrentLiabilities}
            trend="+0.1"
            trendDirection="up"
            plainLanguage="Cash and resources to be used within 12 months compared to debts to be paid within 12 months measures spendable cash. You have $1.80 in cash and resources to be used within 12 months for every $1.00 of debts to be paid within 12 months. The industry average is 1.5."
            naicsCode={selectedFourDigit}
            userCurrentRatio={userCurrentRatio}
            industryCurrentRatio={1.5}
          />

          <DebtToEquityDetailCard
            businessTotalLiabilities={baseMetrics.totalLiabilities}
            businessTotalEquity={baseMetrics.totalEquity}
            industryTotalLiabilities={industryTotalLiabilities}
            industryTotalEquity={industryTotalEquity}
            trend="-0.1"
            trendDirection="down"
            plainLanguage="Debt compared to company's value measures how much your business relies on borrowed money compared to using your own money to keep things running. You owe $0.60 in debt for every $1.00 of equity. The industry average is 0.9 (higher is riskier)."
            naicsCode={selectedFourDigit}
            userDebtToEquity={userDebtToEquity}
            industryDebtToEquity={0.9}
          />
        </div>

        <ContextualLearning />
      </div>
    </div>
  );
}