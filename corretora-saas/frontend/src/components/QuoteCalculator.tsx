import React, { useState } from 'react';
import type { QuoteRequest, QuoteComparison, InsuranceOption } from '@/types/quote';
import { getMockComparison } from '@/services/quotes';
import QuoteCard from '@/components/QuoteCard';
import '../Quotes.css';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function generateWhatsAppText(option: InsuranceOption, req: QuoteRequest) {
  const lines = [] as string[];
  lines.push(`🛡️ *Simulação de seguro - ${option.insurerName}*`);
  lines.push(`👉 Coberturas: ${option.coverages.join(', ')}`);
  lines.push(`💰 Prêmio anual: ${formatCurrency(option.annualPremium)}`);
  if (option.installments) lines.push(`💳 Parcelamento: ${option.installments.count}x · Juros: ${option.installments.interest}%`);
  lines.push(`🔧 Franquia: ${option.franchise}`);
  lines.push('');
  lines.push(`📌 *Resumo do risco:* ${req.category} — Valor: ${formatCurrency(req.value)} · Perfil: ${req.profile ?? 'N/A'}`);
  lines.push('');
  lines.push('Se desejar, posso vincular essa cotação ao seu atendimento e seguir com o processo.');
  return lines.join('\n');
}

export default function QuoteCalculator() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<QuoteComparison | null>(null);
  const [request, setRequest] = useState<QuoteRequest>({ category: 'AUTO', value: 20000, cep: '', profile: 'MEDIUM' });

  async function runSimulation() {
    setLoading(true);
    try {
      const comp = await getMockComparison(request);
      setComparison(comp);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar simulação');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyWhats(option: InsuranceOption) {
    const text = generateWhatsAppText(option, comparison?.request ?? request);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => alert('Resumo copiado para a área de transferência'));
    } else {
      alert(text);
    }
  }

  function handleLinkToLead(option: InsuranceOption) {
    // placeholder: in real app you'd open a modal to select lead / attach
    alert(`(simulação) Cotação ${option.insurerName} vinculada ao lead (mock)`);
  }

  return (
    <div className="quote-page">
      <header className="quote-header-top">
        <h2>Comparador Rápido de Prêmios</h2>
        <p>Simule e compare estimativas antes de gerar a cotação oficial.</p>
      </header>

      <div className="quote-wizard">
        <nav className="wizard-steps">
          <button className={`step ${step === 1 ? 'active' : ''}`}>1. Dados do Risco</button>
          <button className={`step ${step === 2 ? 'active' : ''}`} disabled={!comparison}>2. Comparativo</button>
        </nav>

        {step === 1 && (
          <section className="step-panel">
            <div className="form-grid">
              <label>
                Categoria
                <select value={request.category} onChange={(e) => setRequest({ ...request, category: e.target.value as any })}>
                  <option value="AUTO">Auto</option>
                  <option value="LIFE">Vida</option>
                  <option value="HOME">Residencial</option>
                </select>
              </label>

              <label>
                Nome do Cliente
                <input value={request.clientName ?? ''} onChange={(e) => setRequest({ ...request, clientName: e.target.value })} />
              </label>

              <label>
                CEP
                <input value={request.cep ?? ''} onChange={(e) => setRequest({ ...request, cep: e.target.value })} />
              </label>

              <label>
                Valor do bem (R$)
                <input type="number" value={request.value} onChange={(e) => setRequest({ ...request, value: Number(e.target.value) })} />
              </label>

              <label>
                Perfil
                <select value={request.profile} onChange={(e) => setRequest({ ...request, profile: e.target.value as any })}>
                  <option value="LOW">Baixo</option>
                  <option value="MEDIUM">Médio</option>
                  <option value="HIGH">Alto</option>
                </select>
              </label>

              <label className="full">
                Observações / Metadata
                <input value={JSON.stringify(request.metadata ?? '')} onChange={(e) => setRequest({ ...request, metadata: { raw: e.target.value } })} />
              </label>
            </div>

            <div className="actions-row">
              <button className="secondary-button" onClick={() => { setRequest({ category: 'AUTO', value: 20000, cep: '', profile: 'MEDIUM' }); setComparison(null); }}>Limpar</button>
              <button className="primary-button" onClick={runSimulation} disabled={loading}>{loading ? 'Simulando...' : 'Gerar Comparativo'}</button>
            </div>
          </section>
        )}

        {step === 2 && comparison && (
          <section className="step-panel">
            <div className="comparison-grid">
              {comparison.options.map((opt) => (
                <QuoteCard key={opt.id} option={opt} onCopyWhats={() => handleCopyWhats(opt)} onLink={() => handleLinkToLead(opt)} />
              ))}
            </div>

            <div className="actions-row">
              <button className="secondary-button" onClick={() => setStep(1)}>Voltar</button>
              <button className="primary-button" onClick={() => { setComparison(null); setStep(1); }}>Nova Simulação</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
