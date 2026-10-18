export type ReportsSummary = {
  totalLeads: number;
  leadsThisMonth: number;
  conversions: number;
  revenueEstimate: number;
};

import { api } from '@/services/api';

export async function getReportsSummary(): Promise<ReportsSummary> {
  try {
    const resp = await api.get<ReportsSummary>('/reports/summary');
    return resp.data;
  } catch (err) {
    // fallback mock
    return {
      totalLeads: 342,
      leadsThisMonth: 42,
      conversions: 28,
      revenueEstimate: 123450,
    };
  }
}
