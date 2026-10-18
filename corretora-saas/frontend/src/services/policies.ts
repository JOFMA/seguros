import { api } from "./api";
import type { Policy } from "@/types/policy";

export type PoliciesListParams = {
  search?: string;
  status?: string;
  companyId?: string;
  daysToExpire?: number;
  page?: number;
  perPage?: number;
};

export async function getPolicies(params?: PoliciesListParams) {
  const resp = await api.get<Policy[]>('/policies', { params });
  return resp.data;
}

export async function getPolicy(id: string) {
  const resp = await api.get<Policy>(`/policies/${id}`);
  return resp.data;
}

export async function createPolicy(payload: Partial<Policy>) {
  const resp = await api.post<Policy>('/policies', payload);
  return resp.data;
}

export async function updatePolicy(id: string, payload: Partial<Policy>) {
  const resp = await api.put<Policy>(`/policies/${id}`, payload);
  return resp.data;
}

export async function renewPolicy(id: string, payload: { endDate: string; premium?: number }) {
  const resp = await api.post<Policy>(`/policies/${id}/renew`, payload);
  return resp.data;
}

export async function getInsuranceCompanies() {
  try {
    const resp = await api.get<{ id: string; name: string }[]>('/insurance-companies');
    return resp.data;
  } catch {
    return [
      { id: 'porto', name: 'Porto Seguro' },
      { id: 'tokio', name: 'Tokio Marine' },
      { id: 'sulamerica', name: 'SulAmérica' },
      { id: 'bradesco', name: 'Bradesco' },
    ];
  }
}
