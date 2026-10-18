import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPolicies, getInsuranceCompanies } from "@/services/policies";
import type { Policy, InsuranceCompany, PolicyStatus } from "@/types/policy";
import PolicyForm from "@/components/PolicyForm";

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(s: PolicyStatus) {
  switch (s) {
    case "ACTIVE": return { text: "Ativa", variant: "secondary" };
    case "EXPIRING": return { text: "Vencendo", variant: "warning" };
    case "EXPIRED": return { text: "Vencida", variant: "destructive" };
    case "RENEWED": return { text: "Renovada", variant: "success" };
    default: return { text: s, variant: "secondary" };
  }
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "renew">("create");
  const [editing, setEditing] = useState<Policy | undefined>(undefined);

  useEffect(() => {
    fetchCompanies();
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCompanies() {
    const list = await getInsuranceCompanies();
    setCompanies(list);
  }

  async function fetchPolicies() {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (companyFilter) params.companyId = companyFilter;
      if (statusFilter && statusFilter !== "ALL") params.status = statusFilter;
      const data = await getPolicies(params);
      setPolicies(data);
    } catch (err) {
      console.error("fetch policies error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(fetchPolicies, 300);
    return () => clearTimeout(t);
  }, [search, companyFilter, statusFilter]);

  function openCreate() {
    setEditing(undefined);
    setFormMode("create");
    setShowForm(true);
  }

  function openEdit(p: Policy) {
    setEditing(p);
    setFormMode("edit");
    setShowForm(true);
  }

  function openRenew(p: Policy) {
    setEditing(p);
    setFormMode("renew");
    setShowForm(true);
  }

  async function onSaved(policy: Policy) {
    await fetchPolicies();
  }

  const rows = useMemo(() => policies, [policies]);

  return (
    <div className="policies-page">
      <div className="policies-header">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h1>Apólices</h1>
          <p className="sub">Visualize e renove apólices - filtros por status, seguradora e busca.</p>
        </div>

        <div className="policies-actions">
          <button className="primary-button" onClick={openCreate}>Nova Apólice</button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="policies-filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Todas</option>
              <option value="ACTIVE">Em Vigência</option>
              <option value="EXPIRING">Vencendo em Breve</option>
              <option value="EXPIRED">Vencidas</option>
              <option value="RENEWED">Renovadas</option>
            </select>

            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="">Todas seguradoras</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <input placeholder="Pesquisar por nome, CPF/CNPJ ou Nº da apólice" value={search} onChange={(e) => setSearch(e.target.value)} />

            <button className="secondary-button" onClick={() => { setSearch(""); setCompanyFilter(""); setStatusFilter("ALL"); }}>Limpar</button>
          </div>
        </CardContent>
      </Card>

      <section className="policies-table-section">
        <Card className="table-card">
          <CardContent>
            {loading ? (
              <p>Carregando apólices...</p>
            ) : rows.length === 0 ? (
              <p>Nenhuma apólice encontrada.</p>
            ) : (
              <div className="table-wrapper">
                <table className="policies-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Ramo / Produto</th>
                      <th>Seguradora</th>
                      <th>Nº Apólice</th>
                      <th>Vigência</th>
                      <th>Prêmio</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((p) => {
                      const end = new Date(p.endDate);
                      const now = new Date();
                      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isWarning = daysLeft <= 30 && daysLeft >= 0;
                      const status = statusLabel(p.status);
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="client-name">{p.clientName}</div>
                            <div className="client-doc">{p.clientDocument}</div>
                          </td>
                          <td>{p.product}</td>
                          <td>{p.company?.name}</td>
                          <td>{p.policyNumber}</td>
                          <td className={isWarning ? "vigencia-warning" : ""}>
                            <div>{p.startDate?.slice(0, 10)} → {p.endDate?.slice(0, 10)}</div>
                            {isWarning && <small className="muted">{daysLeft} dias</small>}
                          </td>
                          <td>{formatCurrency(p.premium)}</td>
                          <td><Badge variant={(status.variant as any)}>{status.text}</Badge></td>
                          <td className="actions-col">
                            <button className="secondary-button" onClick={() => openRenew(p)}>Iniciar Renovação</button>
                            <button className="secondary-button" onClick={() => openEdit(p)}>Editar</button>
                            <button className="secondary-button" onClick={() => alert(JSON.stringify(p, null, 2))}>Ver Detalhes</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <PolicyForm
        open={showForm}
        initial={editing}
        mode={formMode}
        onClose={() => setShowForm(false)}
        onSaved={onSaved}
      />
    </div>
  );
}
