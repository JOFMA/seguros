import React, { useEffect, useState } from 'react';
import { getReportsSummary } from '@/services/reports';
import '../App.css';

export default function Reports() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getReportsSummary().then((s) => {
      if (!mounted) return;
      setSummary(s);
    }).catch(console.error).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <p>Gerando relatórios…</p>;

  return (
    <div>
      <header className="section-heading">
        <div>
          <h2>Relatórios</h2>
          <p>Visão resumida de performance e indicadores.</p>
        </div>
      </header>

      <section className="metrics-grid">
        <div className="metric-card table-card">
          <div data-slot="card-content">
            <span className="metric-label">Leads totais</span>
            <strong className="metric-number">{summary.totalLeads}</strong>
            <span className="metric-note">Total acumulado</span>
          </div>
        </div>

        <div className="metric-card table-card">
          <div data-slot="card-content">
            <span className="metric-label">Leads este mês</span>
            <strong className="metric-number">{summary.leadsThisMonth}</strong>
            <span className="metric-note">Novos leads no mês</span>
          </div>
        </div>

        <div className="metric-card table-card">
          <div data-slot="card-content">
            <span className="metric-label">Conversões</span>
            <strong className="metric-number">{summary.conversions}</strong>
            <span className="metric-note">Vendas concluídas</span>
          </div>
        </div>

        <div className="metric-card table-card">
          <div data-slot="card-content">
            <span className="metric-label">Receita estimada</span>
            <strong className="metric-number">{summary.revenueEstimate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            <span className="metric-note">Estimativa anual</span>
          </div>
        </div>
      </section>
    </div>
  );
}
