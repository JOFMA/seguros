import { useEffect, useState, useRef } from "react";
import { api } from "./services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Kanban from "./Kanban";
import Activities from "./Activities";
import Policies from "./Policies";
import "./App.css";

type HealthResponse = {
  status: string;
  message: string;
};

type Lead = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  produto: string | null;
  origem: string;
  status:
    | "NOVO"
    | "CONTATADO"
    | "EM_ATENDIMENTO"
    | "PROPOSTA_ENVIADA"
    | "EM_NEGOCIACAO"
    | "CONVERTIDO"
    | "PERDIDO";
  recebidoEm: string;
  proximaAcao: string | null;
  responsavel: {
    id: string;
    nome: string;
    email: string;
  } | null;
};

function formatStatus(status: Lead["status"]) {
  const labels: Record<Lead["status"], string> = {
    NOVO: "Novo",
    CONTATADO: "Tentativa de contato",
    EM_ATENDIMENTO: "Em atendimento",
    PROPOSTA_ENVIADA: "Proposta enviada",
    EM_NEGOCIACAO: "Em negociação",
    CONVERTIDO: "Venda concluída",
    PERDIDO: "Perdido",
  };

  return labels[status];
}

function App() {
  const [apiStatus, setApiStatus] = useState("Verificando...");
  const [apiMessage, setApiMessage] = useState("");
  const [paginaAtual, setPaginaAtual] = useState<
    "dashboard" | "pipeline" | "activities" | "policies"
  >(window.location.hash === "#pipeline" ? "pipeline" : window.location.hash === "#activities" ? "activities" : window.location.hash === "#policies" ? "policies" : "dashboard");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadsError, setLeadsError] = useState("");

  // refs for dynamic sidebar indicator (kept for compatibility)
  const menuRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sincronizarPagina = () => {
      setPaginaAtual(
        window.location.hash === "#pipeline"
          ? "pipeline"
          : window.location.hash === "#activities" ? "activities" : window.location.hash === "#policies" ? "policies" : "dashboard"
      );
    };

    window.addEventListener("hashchange", sincronizarPagina);

    return () => {
      window.removeEventListener("hashchange", sincronizarPagina);
    };
  }, []);

  useEffect(() => {
    api
      .get<HealthResponse>("/health")
      .then((response) => {
        setApiStatus(response.data.status);
        setApiMessage(response.data.message);
      })
      .catch(() => {
        setApiStatus("indisponível");
        setApiMessage("Não foi possível conectar à API.");
      });

    api
      .get<Lead[]>("/leads")
      .then((response) => {
        setLeads(response.data);
        setLeadsError("");
      })
      .catch(() => {
        setLeadsError(
          "Não foi possível carregar os leads. Verifique se a API está funcionando."
        );
      })
      .finally(() => {
        setLoadingLeads(false);
      });
  }, []);

  const totalLeads = leads.length;
  const leadsEmNegociacao = leads.filter((lead) => lead.status === "EM_NEGOCIACAO").length;
  const leadsConvertidos = leads.filter((lead) => lead.status === "CONVERTIDO").length;
  const leadsAbertos = leads.filter((lead) => lead.status !== "CONVERTIDO" && lead.status !== "PERDIDO").length;

  function navegarPara(pagina: "dashboard" | "pipeline" | "activities" | "policies") {
    setPaginaAtual(pagina);
    window.location.hash = pagina;
  }

  // minimal indicator placement (no heavy logic here)
  function placeIndicator(el: HTMLElement | null) {
    if (!el || !menuRef.current || !indicatorRef.current) return;
    const rect = el.getBoundingClientRect();
    const parentRect = menuRef.current.getBoundingClientRect();
    const top = rect.top - parentRect.top + menuRef.current.scrollTop;
    indicatorRef.current.style.top = `${top}px`;
    indicatorRef.current.style.height = `${rect.height}px`;
    indicatorRef.current.style.opacity = "1";
  }

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const active = (menu.querySelector('.nav-item.active') as HTMLElement) ?? (menu.querySelector('.nav-item') as HTMLElement);
    placeIndicator(active ?? null);
    const onResize = () => placeIndicator((menu.querySelector('.nav-item.active') as HTMLElement) ?? (menu.querySelector('.nav-item') as HTMLElement));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paginaAtual]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <strong>Segs</strong>
            <span>Gestão de corretoras</span>
          </div>
        </div>

        <p className="nav-label">MENU PRINCIPAL</p>

        <nav className="nav-menu" ref={menuRef} role="navigation" aria-label="Menu Principal" tabIndex={0}>
          <a className={`nav-item ${paginaAtual === "dashboard" ? "active" : ""}`} href="#dashboard" onClick={() => navegarPara("dashboard")} onMouseEnter={(e) => placeIndicator(e.currentTarget as HTMLElement)} onFocus={(e) => placeIndicator(e.currentTarget as HTMLElement)} aria-current={paginaAtual === "dashboard" ? "page" : undefined}>
            ▦ <span>Dashboard</span>
          </a>

          <a className={`nav-item ${paginaAtual === "pipeline" ? "active" : ""}`} href="#pipeline" onClick={() => navegarPara("pipeline")} onMouseEnter={(e) => placeIndicator(e.currentTarget as HTMLElement)} onFocus={(e) => placeIndicator(e.currentTarget as HTMLElement)} aria-current={paginaAtual === "pipeline" ? "page" : undefined}>
            ⇄ <span>Funil de vendas</span>
          </a>

          <a className={`nav-item ${paginaAtual === "activities" ? "active" : ""}`} href="#activities" onClick={() => navegarPara("activities")} onMouseEnter={(e) => placeIndicator(e.currentTarget as HTMLElement)} onFocus={(e) => placeIndicator(e.currentTarget as HTMLElement)} aria-current={paginaAtual === "activities" ? "page" : undefined}>
            ◷ <span>Atividades</span>
          </a>

          <a className={`nav-item ${paginaAtual === "policies" ? "active" : ""}`} href="#policies" onClick={() => navegarPara("policies")} onMouseEnter={(e) => placeIndicator(e.currentTarget as HTMLElement)} onFocus={(e) => placeIndicator(e.currentTarget as HTMLElement)} aria-current={paginaAtual === "policies" ? "page" : undefined}>
            📄 <span>Apólices</span>
          </a>

          <a className="nav-item" href="#clientes" onMouseEnter={(e) => placeIndicator(e.currentTarget as HTMLElement)} onFocus={(e) => placeIndicator(e.currentTarget as HTMLElement)} aria-current={undefined}>
            ♧ <span>Clientes</span>
          </a>

          <a className="nav-item" href="#relatorios" onMouseEnter={(e) => placeIndicator(e.currentTarget as HTMLElement)} onFocus={(e) => placeIndicator(e.currentTarget as HTMLElement)} aria-current={undefined}>
            ▤ <span>Relatórios</span>
          </a>

          <div ref={indicatorRef} className="sidebar-indicator" aria-hidden="true" />
        </nav>

        <div className="sidebar-bottom">
          <p>AMBIENTE DE DESENVOLVIMENTO</p>
          <span className="connection-dot" />
          API: {apiStatus}
        </div>
      </aside>

      <main className="main-content" id={paginaAtual}>
        {paginaAtual === "policies" ? (
          <Policies />
        ) : paginaAtual === "pipeline" ? (
          <Kanban />
        ) : paginaAtual === "activities" ? (
          <Activities />
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">VISÃO GERAL</p>
                <h1>Dashboard</h1>
              </div>

              <div className="user-profile">
                <div className="avatar">CO</div>
                <div>
                  <strong>Minha corretora</strong>
                  <span>Administrador</span>
                </div>
              </div>
            </header>

            <section className="welcome">
              <div>
                <p className="eyebrow">SEJA BEM-VINDO</p>
                <h2>Vamos vender mais hoje?</h2>
                <p>
                  Acompanhe os leads e as oportunidades da sua corretora
                  em um só lugar.
                </p>
              </div>

              <div className="welcome-symbol">↗</div>
            </section>

            <section className="metrics-grid" aria-label="Indicadores">
              <Card className="metric-card">
                <CardContent>
                  <span className="metric-label">Leads cadastrados</span>
                  <strong className="metric-number">{totalLeads}</strong>
                  <span className="metric-note">Total retornado pela API</span>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardContent>
                  <span className="metric-label">Em negociação</span>
                  <strong className="metric-number">{leadsEmNegociacao}</strong>
                  <span className="metric-note">Leads nessa etapa</span>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardContent>
                  <span className="metric-label">Em andamento</span>
                  <strong className="metric-number">{leadsAbertos}</strong>
                  <span className="metric-note">Oportunidades ainda não concluídas</span>
                </CardContent>
              </Card>

              <Card className="metric-card">
                <CardContent>
                  <span className="metric-label">Vendas concluídas</span>
                  <strong className="metric-number">{leadsConvertidos}</strong>
                  <span className="metric-note">Leads convertidos</span>
                </CardContent>
              </Card>
            </section>

            <section className="leads-section" id="leads">
              <div className="section-heading">
                <div>
                  <h2>Leads recentes</h2>
                  <p>Acompanhe as oportunidades mais recentes.</p>
                </div>
              </div>

              <Card className="table-card">
                <CardContent>
                  {loadingLeads ? (
                    <p>Carregando leads...</p>
                  ) : leadsError ? (
                    <p role="alert">{leadsError}</p>
                  ) : leads.length === 0 ? (
                    <p>Nenhum lead cadastrado ainda.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Interesse</th>
                            <th>Responsável</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {leads.map((lead) => (
                            <tr key={lead.id}>
                              <td className="lead-name">{lead.nome}</td>

                              <td>{lead.produto || "Não informado"}</td>

                              <td>{lead.responsavel?.nome || "Não atribuído"}</td>

                              <td>
                                <Badge variant="secondary">{formatStatus(lead.status)}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <footer className="dashboard-footer">
              <span>Segs · Gestão de corretoras</span>
              <span>{apiMessage || "Verificando API..."}</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
