import { useEffect, useState, type FormEvent, type CSSProperties, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { api } from "./services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type LeadStatus =
  | "NOVO"
  | "CONTATADO"
  | "EM_ATENDIMENTO"
  | "PROPOSTA_ENVIADA"
  | "EM_NEGOCIACAO"
  | "CONVERTIDO"
  | "PERDIDO";

type Lead = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  produto: string | null;
  origem: string;
  status: LeadStatus;
  recebidoEm: string;
  proximaAcao: string | null;
  observacoes?: string | null;
};

type FormularioLead = {
  nome: string;
  telefone: string;
  email: string;
  produto: string;
  origem: string;
  observacoes: string;
};

type FormularioEdicao = FormularioLead & {
  proximaAcao: string;
};

const CORRETORA_TESTE_ID = "cmv5wnky90000wf303vwflplu";

const formularioInicial: FormularioLead = {
  nome: "",
  telefone: "",
  email: "",
  produto: "",
  origem: "MANUAL",
  observacoes: "",
};

const colunas: { status: LeadStatus; titulo: string }[] = [
  { status: "NOVO", titulo: "Leads recebidos" },
  { status: "CONTATADO", titulo: "Tentativa de contato" },
  { status: "EM_ATENDIMENTO", titulo: "Em atendimento" },
  { status: "PROPOSTA_ENVIADA", titulo: "Cotação / proposta enviada" },
  { status: "EM_NEGOCIACAO", titulo: "Em negociação" },
  { status: "CONVERTIDO", titulo: "Venda concluída" },
];

const nomesStatus: Record<LeadStatus, string> = {
  NOVO: "Leads recebidos",
  CONTATADO: "Tentativa de contato",
  EM_ATENDIMENTO: "Em atendimento",
  PROPOSTA_ENVIADA: "Cotação / proposta enviada",
  EM_NEGOCIACAO: "Em negociação",
  CONVERTIDO: "Venda concluída",
  PERDIDO: "Lead perdido",
};

const estiloCampo: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #d9e0e9",
  borderRadius: 8,
  background: "#fff",
  color: "#27364a",
  fontSize: 13,
  outlineColor: "#2563eb",
};

const estiloBotaoPrimario: CSSProperties = {
  padding: "11px 17px",
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const estiloBotaoSecundario: CSSProperties = {
  padding: "11px 15px",
  border: "1px solid #d9e0e9",
  borderRadius: 8,
  background: "#fff",
  color: "#344256",
  cursor: "pointer",
};

function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#344256" }}>
      <span style={{ fontWeight: 600 }}>{rotulo}</span>
      {children}
    </label>
  );
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não definida";
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "Data inválida";
  return valor.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paraDataHoraLocal(data: string | null) {
  if (!data) return "";
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "";
  const ajustarFuso = new Date(valor.getTime() - valor.getTimezoneOffset() * 60000);
  return ajustarFuso.toISOString().slice(0, 16);
}

function CartaoLead({
  lead,
  aoAbrir,
}: {
  lead: Lead;
  aoAbrir: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lead.id,
    data: { status: lead.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <Card className="kanban-lead-card">
        <CardContent style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            {...attributes}
            {...listeners}
            aria-label={`Arrastar lead ${lead.nome}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 8,
              minWidth: 0,
              cursor: "grab",
              touchAction: "none",
            }}
          >
            <strong
              style={{
                display: "block",
                width: "100%",
                color: "#1e293b",
                fontSize: 14,
                lineHeight: 1.4,
                overflowWrap: "anywhere",
              }}
            >
              {lead.nome}
            </strong>
            <span
              style={{
                display: "block",
                width: "100%",
                color: "#64748b",
                fontSize: 13,
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {lead.produto || "Produto não informado"}
            </span>
            {lead.telefone && (
              <span
                style={{
                  display: "block",
                  color: "#64748b",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                {lead.telefone}
              </span>
            )}
            <div style={{ marginTop: 2 }}>
              <Badge variant="secondary">{lead.origem}</Badge>
            </div>
          </div>
          <button
            type="button"
            onPointerDown={(evento) => evento.stopPropagation()}
            onClick={() => aoAbrir(lead)}
            style={{
              marginTop: 0,
              padding: "9px 10px",
              width: "100%",
              border: "1px solid #d9e0e9",
              borderRadius: 7,
              background: "#fff",
              color: "#2563eb",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ver detalhes
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function ColunaKanban({
  status,
  titulo,
  leads,
  aoAbrirLead,
}: {
  status: LeadStatus;
  titulo: string;
  leads: Lead[];
  aoAbrirLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <section
      ref={setNodeRef}
      className="kanban-column"
      style={{
        flex: "0 0 252px",
        width: 252,
        minWidth: 252,
        maxWidth: 252,
        boxSizing: "border-box",
        scrollSnapAlign: "start",
        background: isOver ? "#dce8fa" : "#edf2f8",
        border: "1px solid #e0e7f0",
        borderRadius: 14,
        padding: 12,
        transition: "background 0.15s ease",
      }}
    >
      <header className="kanban-column-header">
        <h2>{titulo}</h2>
        <span>{leads.length}</span>
      </header>
      <div
        className="kanban-cards"
        style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}
      >
        {leads.length === 0 ? (
          <p className="kanban-empty">
            {isOver ? "Solte o lead aqui" : "Nenhum lead nesta etapa."}
          </p>
        ) : (
          leads.map((lead) => (
            <CartaoLead key={lead.id} lead={lead} aoAbrir={aoAbrirLead} />
          ))
        )}
      </div>
    </section>
  );
}

function AreaLeadsPerdidos({
  leads,
  aoAbrirLead,
}: {
  leads: Lead[];
  aoAbrirLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "PERDIDO",
    data: { status: "PERDIDO" },
  });

  return (
    <section
      ref={setNodeRef}
      className="kanban-lost-section"
      style={{
        background: isOver ? "#fff1f0" : "#fff",
        transition: "background 0.15s ease",
      }}
    >
      <h2>Leads perdidos ({leads.length})</h2>
      <p>Arraste um lead para esta área quando a oportunidade for perdida.</p>
      {leads.length > 0 && (
        <div className="kanban-lost-list">
          {leads.map((lead) => (
            <CartaoLead key={lead.id} lead={lead} aoAbrir={aoAbrirLead} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Kanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [leadArrastado, setLeadArrastado] = useState<Lead | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioLead>(formularioInicial);
  const [salvandoNovoLead, setSalvandoNovoLead] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [formularioEdicao, setFormularioEdicao] = useState<FormularioEdicao | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function carregarLeads() {
    const resposta = await api.get<Lead[]>("/leads");
    setLeads(resposta.data);
  }

  useEffect(() => {
    carregarLeads()
      .then(() => setErro(""))
      .catch(() => {
        setErro("Não foi possível carregar os leads. Verifique se a API está rodando.");
      })
      .finally(() => setCarregando(false));
  }, []);

  function abrirDetalhes(lead: Lead) {
    setLeadSelecionado(lead);
    setFormularioEdicao({
      nome: lead.nome ?? "",
      telefone: lead.telefone ?? "",
      email: lead.email ?? "",
      produto: lead.produto ?? "",
      origem: lead.origem ?? "MANUAL",
      observacoes: lead.observacoes ?? "",
      proximaAcao: paraDataHoraLocal(lead.proximaAcao),
    });
    setErroEdicao("");
    setMensagemSucesso("");
  }

  function fecharDetalhes() {
    if (salvandoEdicao) return;
    setLeadSelecionado(null);
    setFormularioEdicao(null);
    setErroEdicao("");
  }

  function aoIniciarArraste(evento: DragStartEvent) {
    const lead = leads.find((item) => item.id === evento.active.id);
    setLeadArrastado(lead ?? null);
  }

  async function aoFinalizarArraste(evento: DragEndEvent) {
    setLeadArrastado(null);
    const { active, over } = evento;
    if (!over) return;

    const leadId = String(active.id);
    const novoStatus = over.data.current?.status as LeadStatus | undefined;
    if (!novoStatus) return;

    const leadAtual = leads.find((lead) => lead.id === leadId);
    if (!leadAtual || leadAtual.status === novoStatus) return;

    const statusAnterior = leadAtual.status;
    setLeads((atuais) =>
      atuais.map((lead) => lead.id === leadId ? { ...lead, status: novoStatus } : lead)
    );
    setSalvando(leadId);
    setErro("");
    setMensagemSucesso("");

    try {
      await api.patch(`/leads/${leadId}/status`, { status: novoStatus });
      setMensagemSucesso("Etapa do lead atualizada.");
    } catch {
      setLeads((atuais) =>
        atuais.map((lead) => lead.id === leadId ? { ...lead, status: statusAnterior } : lead)
      );
      setErro("Não foi possível salvar a mudança. O lead voltou para a etapa anterior.");
    } finally {
      setSalvando(null);
    }
  }

  function atualizarCampo(campo: keyof FormularioLead, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  async function cadastrarLead(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroFormulario("");
    setMensagemSucesso("");

    const nome = formulario.nome.trim();
    if (!nome) {
      setErroFormulario("Informe o nome do lead.");
      return;
    }

    setSalvandoNovoLead(true);
    try {
      await api.post("/leads", {
        nome,
        telefone: formulario.telefone.trim() || null,
        email: formulario.email.trim() || null,
        produto: formulario.produto.trim() || null,
        origem: formulario.origem,
        observacoes: formulario.observacoes.trim() || null,
        corretoraId: CORRETORA_TESTE_ID,
      });
      await carregarLeads();
      setFormulario(formularioInicial);
      setModalAberto(false);
      setMensagemSucesso("Lead cadastrado com sucesso!");
      setErro("");
    } catch (erro) {
      console.error("Erro ao cadastrar lead:", erro);
      setErroFormulario("Não foi possível cadastrar o lead. Confira se a API está funcionando e tente novamente.");
    } finally {
      setSalvandoNovoLead(false);
    }
  }

  function atualizarCampoEdicao(campo: keyof FormularioEdicao, valor: string) {
    setFormularioEdicao((atual) => atual ? { ...atual, [campo]: valor } : atual);
  }

  async function salvarEdicao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!leadSelecionado || !formularioEdicao) return;

    const nome = formularioEdicao.nome.trim();
    if (!nome) {
      setErroEdicao("O nome do cliente é obrigatório.");
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao("");
    setMensagemSucesso("");

    try {
      const payload = {
        nome,
        telefone: formularioEdicao.telefone.trim() || null,
        email: formularioEdicao.email.trim() || null,
        produto: formularioEdicao.produto.trim() || null,
        origem: formularioEdicao.origem.trim() || "MANUAL",
        observacoes: formularioEdicao.observacoes.trim() || null,
        proximaAcao: formularioEdicao.proximaAcao
          ? new Date(formularioEdicao.proximaAcao).toISOString()
          : null,
      };

      const resposta = await api.patch<Lead>(`/leads/${leadSelecionado.id}`, payload);
      setLeads((atuais) =>
        atuais.map((lead) => lead.id === leadSelecionado.id ? { ...lead, ...resposta.data } : lead)
      );
      setLeadSelecionado((atual) => atual ? { ...atual, ...resposta.data } : atual);
      setFormularioEdicao({
        nome: resposta.data.nome,
        telefone: resposta.data.telefone ?? "",
        email: resposta.data.email ?? "",
        produto: resposta.data.produto ?? "",
        origem: resposta.data.origem ?? "MANUAL",
        observacoes: resposta.data.observacoes ?? "",
        proximaAcao: paraDataHoraLocal(resposta.data.proximaAcao),
      });
      setMensagemSucesso("Dados do lead salvos com sucesso.");
    } catch (erro) {
      console.error("Erro ao editar lead:", erro);
      setErroEdicao("Não foi possível salvar as alterações. Verifique se a API está funcionando e tente novamente.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  const leadsPerdidos = leads.filter((lead) => lead.status === "PERDIDO");

  return (
    <section className="kanban-page">
      <header className="kanban-header">
        <div>
          <p className="eyebrow">GESTÃO COMERCIAL</p>
          <h1>Funil de vendas</h1>
          <p className="kanban-description">Acompanhe e organize as oportunidades da sua corretora.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Badge variant="secondary">{leads.length} {leads.length === 1 ? "lead" : "leads"}</Badge>
          <button
            type="button"
            onClick={() => {
              setErroFormulario("");
              setMensagemSucesso("");
              setModalAberto(true);
            }}
            style={{ ...estiloBotaoPrimario, display: "flex", alignItems: "center", gap: 7 }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            Novo lead
          </button>
        </div>
      </header>

      {mensagemSucesso && (
        <p role="status" style={{ color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {mensagemSucesso}
        </p>
      )}

      {carregando ? (
        <p>Carregando leads...</p>
      ) : erro && leads.length === 0 ? (
        <p role="alert">{erro}</p>
      ) : (
        <>
          {erro && <p role="alert" style={{ color: "#b42318", marginBottom: 16 }}>{erro}</p>}
          {salvando && <p style={{ color: "#53647a", marginBottom: 16, fontSize: 12 }}>Salvando alteração do lead...</p>}
          <DndContext sensors={sensores} onDragStart={aoIniciarArraste} onDragEnd={aoFinalizarArraste}>
            <div
              className="kanban-board"
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 16,
                width: "100%",
                maxWidth: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                padding: "4px 2px 16px",
                boxSizing: "border-box",
                scrollSnapType: "x proximity",
              }}
            >
              {colunas.map((coluna) => (
                <ColunaKanban
                  key={coluna.status}
                  status={coluna.status}
                  titulo={coluna.titulo}
                  leads={leads.filter((lead) => lead.status === coluna.status)}
                  aoAbrirLead={abrirDetalhes}
                />
              ))}
            </div>
            <AreaLeadsPerdidos leads={leadsPerdidos} aoAbrirLead={abrirDetalhes} />
            <DragOverlay>
              {leadArrastado ? (
                <Card className="kanban-lead-card">
                  <CardContent>
                    <strong>{leadArrastado.nome}</strong>
                    <span>{leadArrastado.produto || "Produto não informado"}</span>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {modalAberto && (
        <div
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvandoNovoLead) setModalAberto(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15, 23, 42, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-novo-lead" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
              <div>
                <h2 id="titulo-novo-lead" style={{ margin: 0, color: "#27364a", fontSize: 21, fontWeight: 700 }}>Novo lead</h2>
                <p style={{ color: "#748094", fontSize: 13, marginTop: 7 }}>Preencha os dados da nova oportunidade.</p>
              </div>
              <button type="button" aria-label="Fechar formulário" disabled={salvandoNovoLead} onClick={() => setModalAberto(false)} style={{ border: "none", background: "transparent", color: "#64748b", fontSize: 24, cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={cadastrarLead} style={{ display: "grid", gap: 16 }}>
              <Campo rotulo="Nome *">
                <input style={estiloCampo} value={formulario.nome} onChange={(evento) => atualizarCampo("nome", evento.target.value)} placeholder="Nome do cliente" required maxLength={150} autoFocus />
              </Campo>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
                <Campo rotulo="Telefone">
                  <input style={estiloCampo} type="tel" value={formulario.telefone} onChange={(evento) => atualizarCampo("telefone", evento.target.value)} placeholder="(00) 00000-0000" maxLength={30} />
                </Campo>
                <Campo rotulo="E-mail">
                  <input style={estiloCampo} type="email" value={formulario.email} onChange={(evento) => atualizarCampo("email", evento.target.value)} placeholder="cliente@exemplo.com" maxLength={254} />
                </Campo>
              </div>
              <Campo rotulo="Produto de interesse">
                <select style={estiloCampo} value={formulario.produto} onChange={(evento) => atualizarCampo("produto", evento.target.value)}>
                  <option value="">Selecione um produto</option>
                  <option value="Seguro Auto">Seguro Auto</option>
                  <option value="Seguro de Vida">Seguro de Vida</option>
                  <option value="Seguro Residencial">Seguro Residencial</option>
                  <option value="Seguro Empresarial">Seguro Empresarial</option>
                  <option value="Seguro Saúde">Seguro Saúde</option>
                  <option value="Seguro de Vida e Acidentes Pessoais">Vida e acidentes pessoais</option>
                  <option value="Seguro Viagem">Seguro Viagem</option>
                  <option value="Seguro Rural">Seguro Rural</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>
              <Campo rotulo="Origem do lead">
                <select style={estiloCampo} value={formulario.origem} onChange={(evento) => atualizarCampo("origem", evento.target.value)}>
                  <option value="MANUAL">Cadastro manual</option>
                  <option value="SITE">Site</option>
                  <option value="META">Meta Ads / Instagram / Facebook</option>
                  <option value="INDICACAO">Indicação</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="OUTRO">Outra origem</option>
                </select>
              </Campo>
              <Campo rotulo="Observações">
                <textarea style={{ ...estiloCampo, minHeight: 90, resize: "vertical", fontFamily: "inherit" }} value={formulario.observacoes} onChange={(evento) => atualizarCampo("observacoes", evento.target.value)} placeholder="Informações importantes sobre o lead..." maxLength={2000} />
              </Campo>
              {erroFormulario && <p role="alert" style={{ margin: 0, padding: 11, borderRadius: 8, background: "#fef2f2", color: "#b42318", fontSize: 13 }}>{erroFormulario}</p>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button type="button" disabled={salvandoNovoLead} onClick={() => setModalAberto(false)} style={estiloBotaoSecundario}>Cancelar</button>
                <button type="submit" disabled={salvandoNovoLead} style={{ ...estiloBotaoPrimario, background: salvandoNovoLead ? "#93b4f8" : "#2563eb", cursor: salvandoNovoLead ? "wait" : "pointer" }}>{salvandoNovoLead ? "Salvando..." : "Cadastrar lead"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {leadSelecionado && formularioEdicao && (
        <div
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) fecharDetalhes();
          }}
          style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(15, 23, 42, 0.58)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes-lead" style={{ width: "100%", maxWidth: 650, maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#64748b" }}>DETALHES DO LEAD</p>
                <h2 id="titulo-detalhes-lead" style={{ margin: 0, color: "#27364a", fontSize: 22 }}>{leadSelecionado.nome}</h2>
                <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 13 }}>
                  Etapa: <strong>{nomesStatus[leadSelecionado.status]}</strong>
                </p>
              </div>
              <button type="button" aria-label="Fechar detalhes" disabled={salvandoEdicao} onClick={fecharDetalhes} style={{ border: "none", background: "transparent", color: "#64748b", fontSize: 25, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, padding: 14, marginBottom: 20, borderRadius: 10, background: "#f8fafc" }}>
              <div>
                <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 12 }}>Recebido em</p>
                <strong style={{ color: "#27364a", fontSize: 13 }}>{formatarData(leadSelecionado.recebidoEm)}</strong>
              </div>
              <div>
                <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 12 }}>Status atual</p>
                <Badge variant="secondary">{nomesStatus[leadSelecionado.status]}</Badge>
              </div>
            </div>

            <form onSubmit={salvarEdicao} style={{ display: "grid", gap: 15 }}>
              <Campo rotulo="Nome *">
                <input style={estiloCampo} value={formularioEdicao.nome} onChange={(evento) => atualizarCampoEdicao("nome", evento.target.value)} required maxLength={150} />
              </Campo>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
                <Campo rotulo="Telefone">
                  <input style={estiloCampo} type="tel" value={formularioEdicao.telefone} onChange={(evento) => atualizarCampoEdicao("telefone", evento.target.value)} maxLength={30} placeholder="(00) 00000-0000" />
                </Campo>
                <Campo rotulo="E-mail">
                  <input style={estiloCampo} type="email" value={formularioEdicao.email} onChange={(evento) => atualizarCampoEdicao("email", evento.target.value)} maxLength={254} placeholder="cliente@exemplo.com" />
                </Campo>
              </div>
              <Campo rotulo="Produto de interesse">
                <select style={estiloCampo} value={formularioEdicao.produto} onChange={(evento) => atualizarCampoEdicao("produto", evento.target.value)}>
                  <option value="">Selecione um produto</option>
                  <option value="Seguro Auto">Seguro Auto</option>
                  <option value="Seguro de Vida">Seguro de Vida</option>
                  <option value="Seguro Residencial">Seguro Residencial</option>
                  <option value="Seguro Empresarial">Seguro Empresarial</option>
                  <option value="Seguro Saúde">Seguro Saúde</option>
                  <option value="Seguro de Vida e Acidentes Pessoais">Vida e acidentes pessoais</option>
                  <option value="Seguro Viagem">Seguro Viagem</option>
                  <option value="Seguro Rural">Seguro Rural</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>
              <Campo rotulo="Origem do lead">
                <select style={estiloCampo} value={formularioEdicao.origem} onChange={(evento) => atualizarCampoEdicao("origem", evento.target.value)}>
                  <option value="MANUAL">Cadastro manual</option>
                  <option value="SITE">Site</option>
                  <option value="META">Meta Ads / Instagram / Facebook</option>
                  <option value="INDICACAO">Indicação</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="OUTRO">Outra origem</option>
                </select>
              </Campo>
              <Campo rotulo="Próxima ação / retorno">
                <input style={estiloCampo} type="datetime-local" value={formularioEdicao.proximaAcao} onChange={(evento) => atualizarCampoEdicao("proximaAcao", evento.target.value)} />
              </Campo>
              <Campo rotulo="Observações">
                <textarea style={{ ...estiloCampo, minHeight: 100, resize: "vertical", fontFamily: "inherit" }} value={formularioEdicao.observacoes} onChange={(evento) => atualizarCampoEdicao("observacoes", evento.target.value)} maxLength={2000} placeholder="Histórico ou informações importantes sobre o cliente..." />
              </Campo>

              {erroEdicao && <p role="alert" style={{ margin: 0, padding: 11, borderRadius: 8, background: "#fef2f2", color: "#b42318", fontSize: 13 }}>{erroEdicao}</p>}
              {mensagemSucesso && <p role="status" style={{ margin: 0, padding: 11, borderRadius: 8, background: "#f0fdf4", color: "#166534", fontSize: 13 }}>{mensagemSucesso}</p>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 5 }}>
                <button type="button" disabled={salvandoEdicao} onClick={fecharDetalhes} style={estiloBotaoSecundario}>Fechar</button>
                <button type="submit" disabled={salvandoEdicao} style={{ ...estiloBotaoPrimario, background: salvandoEdicao ? "#93b4f8" : "#2563eb", cursor: salvandoEdicao ? "wait" : "pointer" }}>{salvandoEdicao ? "Salvando..." : "Salvar alterações"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
