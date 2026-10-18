import type { QuoteRequest, QuoteComparison } from '@/types/quote';

// returns a mocked comparison for a given request — simulates network latency
export async function getMockComparison(req: QuoteRequest): Promise<QuoteComparison> {
  await new Promise((r) => setTimeout(r, 600)); // simulate latency

  const base = Math.max(200, Math.round(req.value * (req.profile === 'HIGH' ? 0.02 : req.profile === 'LOW' ? 0.006 : 0.012)));

  const options = [
    {
      id: 'ins-porto',
      insurerName: 'Porto Seguro',
      logoUrl: null,
      annualPremium: Math.round(base * 1.05),
      installments: { count: 10, interest: 0 },
      franchise: 'BASIC',
      coverages: ['Carro Reserva', 'Guincho KM ilimitado', 'Danos a Terceiros'],
      recommended: false,
    },
    {
      id: 'ins-tokio',
      insurerName: 'Tokio Marine',
      logoUrl: null,
      annualPremium: Math.round(base * 0.95),
      installments: { count: 12, interest: 2.5 },
      franchise: 'REDUCED',
      coverages: ['Guincho KM ilimitado', 'Danos a Terceiros'],
      recommended: true,
    },
    {
      id: 'ins-sulamerica',
      insurerName: 'SulAmérica',
      logoUrl: null,
      annualPremium: Math.round(base * 1.2),
      installments: { count: 6, interest: 0 },
      franchise: 'BASIC',
      coverages: ['Carro Reserva', 'Danos a Terceiros'],
      recommended: false,
    },
  ];

  return {
    request: req,
    options,
    generatedAt: new Date().toISOString(),
  };
}
