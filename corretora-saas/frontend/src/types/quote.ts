export type Category = 'AUTO' | 'LIFE' | 'HOME';

export type QuoteRequest = {
  category: Category;
  clientName?: string;
  clientDocument?: string;
  cep?: string;
  value: number; // valor do bem / importância segurada
  profile?: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, any>;
};

export type InsuranceOption = {
  id: string;
  insurerName: string;
  logoUrl?: string | null;
  annualPremium: number; // valor anual estimado
  installments?: {
    count: number;
    interest: number; // percentual total
  } | null;
  franchise: 'BASIC' | 'REDUCED' | 'NONE' | string;
  coverages: string[];
  recommended?: boolean;
  notes?: string;
};

export type QuoteComparison = {
  request: QuoteRequest;
  options: InsuranceOption[];
  generatedAt: string; // ISO
};
