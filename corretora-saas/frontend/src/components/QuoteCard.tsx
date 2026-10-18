import React from 'react';
import type { InsuranceOption } from '@/types/quote';

type Props = {
  option: InsuranceOption;
  onLink?: (opt: InsuranceOption) => void;
  onCopyWhats?: (opt: InsuranceOption) => void;
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function QuoteCard({ option, onLink, onCopyWhats }: Props) {
  return (
    <article className={`quote-card ${option.recommended ? 'recommended' : ''}`}>
      <header className="quote-header">
        <div className="insurer">
          <div className="insurer-logo" aria-hidden>{option.logoUrl ? <img src={option.logoUrl} alt={option.insurerName}/> : option.insurerName.charAt(0)}</div>
          <div className="insurer-name">{option.insurerName}</div>
        </div>
        {option.recommended && <div className="recommended-badge">Melhor Custo‑Benefício</div>}
      </header>

      <div className="quote-body">
        <div className="quote-row">
          <strong className="premium">{formatCurrency(option.annualPremium)}</strong>
          <small className="subtitle">Prêmio anual</small>
        </div>

        <div className="quote-row">
          <span className="installments">{option.installments ? `${option.installments.count}x • ${option.installments.interest}%` : 'À vista'}</span>
          <small className="subtitle">Parcelamento</small>
        </div>

        <div className="quote-row">
          <span className="franchise">Franquia: {option.franchise}</span>
        </div>

        <ul className="coverages">
          {option.coverages.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      </div>

      <footer className="quote-actions">
        <button className="link-btn" onClick={() => onLink?.(option)}>Vincular Cotação ao Lead</button>
        <button className="copy-btn" onClick={() => onCopyWhats?.(option)}>Copiar resumo (WhatsApp)</button>
      </footer>
    </article>
  );
}
