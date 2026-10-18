import React, { useEffect, useState } from "react";
import type { Policy, InsuranceCompany, InsuranceCategory } from "@/types/policy";
import { getInsuranceCompanies, createPolicy, updatePolicy, renewPolicy } from "@/services/policies";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  open: boolean;
  initial?: Partial<Policy>;
  onClose: () => void;
  onSaved: (policy: Policy) => void;
  mode?: "create" | "edit" | "renew";
};

type FormState = {
  clientName: string;
  clientDocument: string;
  product: InsuranceCategory;
  companyId: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  premium: string;
  notes?: string;
};

const defaultState = (initial?: Partial<Policy>): FormState => ({
  clientName: initial?.clientName ?? "",
  clientDocument: initial?.clientDocument ?? "",
  product: (initial?.product ?? "AUTO") as InsuranceCategory,
  companyId: initial?.company?.id ?? "",
  policyNumber: initial?.policyNumber ?? "",
  startDate: initial?.startDate ? initial.startDate.slice(0, 10) : "",
  endDate: initial?.endDate ? initial.endDate.slice(0, 10) : "",
  premium: initial?.premium != null ? String(initial.premium) : "",
  notes: initial?.notes ?? "",
});

export default function PolicyForm({ open, initial, onClose, onSaved, mode = "create" }: Props) {
  const [form, setForm] = useState<FormState>(defaultState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getInsuranceCompanies().then(setCompanies);
    setForm(defaultState(initial));
    setErrors({});
  }, [open, initial]);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.clientName.trim()) e.clientName = "Nome do cliente é obrigatório";
    if (!form.clientDocument.trim()) e.clientDocument = "CPF/CNPJ é obrigatório";
    if (!form.policyNumber.trim()) e.policyNumber = "Número da apólice é obrigatório";
    if (!form.startDate) e.startDate = "Data de início é obrigatória";
    if (!form.endDate) e.endDate = "Data de vigência final é obrigatória";
    if (form.startDate && form.endDate && form.startDate > form.endDate) e.endDate = "Data final deve ser posterior à inicial";
    if (!form.companyId) e.companyId = "Selecione uma seguradora";
    if (!form.premium || Number.isNaN(Number(form.premium))) e.premium = "Valor do prêmio inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Partial<Policy> = {
        clientName: form.clientName.trim(),
        clientDocument: form.clientDocument.trim(),
        product: form.product,
        company: companies.find((c) => c.id === form.companyId) ?? { id: form.companyId, name: form.companyId },
        policyNumber: form.policyNumber.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        premium: Number(form.premium),
        notes: form.notes,
      };

      let saved: Policy;
      if (mode === "create") {
        saved = await createPolicy(payload);
      } else if (mode === "renew" && initial?.id) {
        saved = await renewPolicy(initial.id, { endDate: form.endDate, premium: Number(form.premium) });
      } else if (mode === "edit" && initial?.id) {
        saved = await updatePolicy(initial.id, payload);
      } else {
        throw new Error("Modo inválido ou faltando policy id");
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error("save policy error", err);
      setErrors({ form: err?.message ?? "Erro ao salvar apólice" });
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <Card className="policy-modal-card">
        <CardContent>
          <div className="modal-header">
            <h3>{mode === "create" ? "Nova Apólice" : mode === "edit" ? "Editar Apólice" : "Renovar Apólice"}</h3>
            <button className="close-btn" onClick={onClose} aria-label="Fechar">✕</button>
          </div>

          <form className="policy-form" onSubmit={submit} noValidate>
            {errors.form && <div className="form-error">{errors.form}</div>}

            <label>
              Nome do Segurado
              <input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} />
              {errors.clientName && <small className="field-error">{errors.clientName}</small>}
            </label>

            <label>
              CPF / CNPJ
              <input value={form.clientDocument} onChange={(e) => setField("clientDocument", e.target.value)} />
              {errors.clientDocument && <small className="field-error">{errors.clientDocument}</small>}
            </label>

            <label>
              Seguradora
              <select value={form.companyId} onChange={(e) => setField("companyId", e.target.value)}>
                <option value="">— selecione —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.companyId && <small className="field-error">{errors.companyId}</small>}
            </label>

            <label>
              Ramos / Produto
              <select value={form.product} onChange={(e) => setField("product", e.target.value as InsuranceCategory)}>
                <option value="AUTO">Auto</option>
                <option value="LIFE">Vida</option>
                <option value="RESIDENTIAL">Residencial</option>
                <option value="BUSINESS">Empresarial</option>
              </select>
            </label>

            <label>
              Nº da Apólice
              <input value={form.policyNumber} onChange={(e) => setField("policyNumber", e.target.value)} />
              {errors.policyNumber && <small className="field-error">{errors.policyNumber}</small>}
            </label>

            <div className="row">
              <label>
                Vigência início
                <input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
                {errors.startDate && <small className="field-error">{errors.startDate}</small>}
              </label>

              <label>
                Vigência fim
                <input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
                {errors.endDate && <small className="field-error">{errors.endDate}</small>}
              </label>
            </div>

            <label>
              Valor do prêmio (R$)
              <input type="number" min="0" step="0.01" value={form.premium} onChange={(e) => setField("premium", e.target.value)} />
              {errors.premium && <small className="field-error">{errors.premium}</small>}
            </label>

            <label>
              Observações
              <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Salvando..." : mode === "renew" ? "Confirmar Renovação" : "Salvar Apólice"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
