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
  try {
    const resp = await api.post<Policy>('/policies', payload);
    return resp.data;
  } catch (err: any) {
    // If backend isn't available or endpoint not implemented, fall back to a local mock so the UI can continue
    if (err?.response?.status === 404) {
      console.warn('[policies] POST /policies returned 404 — returning optimistic mock object for frontend development');
      const mock: Policy = {
        id: `local-${Date.now()}`,
        clientName: payload.clientName ?? 'Sem nome',
        clientDocument: payload.clientDocument ?? '',
        product: (payload.product as any) ?? 'AUTO',
        company: (payload.company as any) ?? { id: payload.company?.id ?? 'local-co', name: payload.company?.name ?? 'Local Co' },
        policyNumber: payload.policyNumber ?? `LOCAL-${Math.floor(Math.random() * 100000)}`,
        startDate: payload.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: payload.endDate ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
        premium: typeof payload.premium === 'number' ? payload.premium : Number(payload.premium ?? 0),
        status: (payload.status as any) ?? 'ACTIVE',
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return mock;
    }
    throw err;
  }
}

export async function updatePolicy(id: string, payload: Partial<Policy>) {
  try {
    const resp = await api.put<Policy>(`/policies/${id}`, payload);
    return resp.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      console.warn(`[policies] PUT /policies/${id} returned 404 — returning optimistic merged object`);
      const mock: Policy = {
        id,
        clientName: payload.clientName ?? 'Sem nome',
        clientDocument: payload.clientDocument ?? '',
        product: (payload.product as any) ?? 'AUTO',
        company: (payload.company as any) ?? { id: payload.company?.id ?? 'local-co', name: payload.company?.name ?? 'Local Co' },
        policyNumber: payload.policyNumber ?? `LOCAL-${Math.floor(Math.random() * 100000)}`,
        startDate: payload.startDate ?? new Date().toISOString().slice(0, 10),
        endDate: payload.endDate ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
        premium: typeof payload.premium === 'number' ? payload.premium : Number(payload.premium ?? 0),
        status: (payload.status as any) ?? 'ACTIVE',
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return mock;
    }
    throw err;
  }
}

export async function renewPolicy(id: string, payload: { endDate: string; premium?: number }) {
  try {
    const resp = await api.post<Policy>(`/policies/${id}/renew`, payload);
    return resp.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      console.warn(`[policies] POST /policies/${id}/renew returned 404 — returning optimistic renewed object`);
      // naive optimistic renewal
      const mock: Policy = {
        id,
        clientName: 'Sem nome',
        clientDocument: '',
        product: 'AUTO' as any,
        company: { id: 'local-co', name: 'Local Co' },
        policyNumber: `LOCAL-${Math.floor(Math.random() * 100000)}`,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: payload.endDate,
        premium: typeof payload.premium === 'number' ? payload.premium : 0,
        status: 'RENEWED',
        notes: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return mock;
    }
    throw err;
  }
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
