export type InsuranceCategory = "AUTO" | "LIFE" | "RESIDENTIAL" | "BUSINESS";

export type PolicyStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "RENEWED";

export interface InsuranceCompany {
  id: string;
  name: string;
}

export interface Policy {
  id: string;
  leadId?: string | null; // id do lead/cliente vinculado
  clientName: string;
  clientDocument: string; // CPF/CNPJ
  product: InsuranceCategory;
  company: InsuranceCompany;
  policyNumber: string;
  startDate: string; // ISO
  endDate: string; // ISO
  premium: number; // valor do prêmio
  status: PolicyStatus;
  notes?: string;
  updatedAt?: string;
  createdAt?: string;
}
