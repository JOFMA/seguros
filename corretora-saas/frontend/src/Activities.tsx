import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./services/api";
import { CalendarClock, Check, CircleAlert, Clock3, ListTodo, Plus, RefreshCw, Trash2, X } from "lucide-react";
import "./Activities.css";

const CORRETORA_ID = "cmv5wnky90000wf303vwflplu";
type Lead = { id: string; nome: string; telefone: string | null; produto: string | null };
type Activity = { id: string; titulo: string; descricao: string | null; tipo: string; status: "PENDENTE" | "CONCLUIDA" | "CANCELADA"; agendadaPara: string; concluidaEm: string | null; lead: Lead };
const tipos: Record<string, string> = { LIGACAO: "Ligação", WHATSAPP: "WhatsApp", EMAIL: "E-mail", REUNIAO: "Reunião", ENVIO_PROPOSTA: "Envio de proposta", RETORNO: "Retorno", OUTRO: "Outro" };
const dateLocal = (value: Date) => { const d = new Date(value.getTime() - value.getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
const fmt = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", tipo: "RETORNO", leadId: "", agendadaPara: dateLocal(new Date(Date.now() + 60 * 60 * 1000)) });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [a, l] = await Promise.all([api.get<Activity[]>("/activities"), api.get<Lead[]>("/leads")]); setActivities(a.data); setLeads(l.data); }
    catch { setError("Não foi possível carregar as atividades. Confira se o backend e o banco estão funcionando."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const now = new Date();
  const pending = activities.filter(a => a.status === "PENDENTE");
  const overdue = pending.filter(a => new Date(a.agendadaPara) < now);
  const today = pending.filter(a => { const d = new Date(a.agendadaPara); return d.toDateString() === now.toDateString(); });
  const done = activities.filter(a => a.status === "CONCLUIDA");
  const visible = useMemo(() => activities.filter(a => filter === "TODAS" || (filter === "ATRASADAS" && a.status === "PENDENTE" && new Date(a.agendadaPara) < new Date()) || (filter === "HOJE" && a.status === "PENDENTE" && new Date(a.agendadaPara).toDateString() === new Date().toDateString()) || a.status === filter), [activities, filter]);

  async function create(e: FormEvent) { e.preventDefault(); if (!form.leadId) { setError("Selecione o lead relacionado."); return; } setSaving(true); setError(""); try { await api.post("/activities", { ...form, corretoraId: CORRETORA_ID, agendadaPara: new Date(form.agendadaPara).toISOString() }); setOpen(false); setForm({ titulo: "", descricao: "", tipo: "RETORNO", leadId: "", agendadaPara: dateLocal(new Date(Date.now() + 60 * 60 * 1000)) }); await load(); } catch (err: any) { setError(err?.response?.data?.message || "Não foi possível criar a atividade."); } finally { setSaving(false); } }
  async function changeStatus(item: Activity, status: Activity["status"]) { try { const response = await api.patch<Activity>(`/activities/${item.id}`, { status }); setActivities(old => old.map(a => a.id === item.id ? response.data : a)); } catch { setError("Não foi possível atualizar esta atividade."); } }
  async function remove(item: Activity) { if (!window.confirm(`Excluir a atividade “${item.titulo}”?`)) return; try { await api.delete(`/activities/${item.id}`); setActivities(old => old.filter(a => a.id !== item.id)); } catch { setError("Não foi possível excluir a atividade."); } }

  return <div className="activities-page">
    <header className="activities-heading"><div><div className="activities-kicker"><CalendarClock size={15}/> ROTINA COMERCIAL</div><h1>Atividades</h1><p>Organize os retornos e mantenha cada oportunidade em movimento.</p></div><button className="activity-primary" onClick={() => setOpen(true)}><Plus size={17}/> Nova atividade</button></header>
    {error && <div className="activity-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Fechar"><X size={16}/></button></div>}
    <section className="activity-stats">
      <article><span className="activity-stat-icon violet"><ListTodo size={19}/></span><div><small>Pendentes</small><strong>{pending.length}</strong><span>Na sua fila</span></div></article>
      <article><span className="activity-stat-icon red"><CircleAlert size={19}/></span><div><small>Atrasadas</small><strong>{overdue.length}</strong><span>Precisam de atenção</span></div></article>
      <article><span className="activity-stat-icon blue"><Clock3 size={19}/></span><div><small>Para hoje</small><strong>{today.length}</strong><span>Na agenda de hoje</span></div></article>
      <article><span className="activity-stat-icon green"><Check size={19}/></span><div><small>Concluídas</small><strong>{done.length}</strong><span>Histórico registrado</span></div></article>
    </section>
    <section className="activity-panel"><div className="activity-panel-head"><div><h2>Sua agenda</h2><p>Atividades ligadas aos leads da corretora.</p></div><button className="activity-icon-button" onClick={() => void load()} title="Atualizar"><RefreshCw size={16}/></button></div>
      <div className="activity-filters">{[["TODAS","Todas"],["ATRASADAS","Atrasadas"],["HOJE","Hoje"],["PENDENTE","Pendentes"],["CONCLUIDA","Concluídas"],["CANCELADA","Canceladas"]].map(([value,label]) => <button key={value} className={filter===value?"selected":""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {loading ? <div className="activity-empty">Carregando sua agenda…</div> : visible.length === 0 ? <div className="activity-empty"><span><CalendarClock size={24}/></span><strong>Nada por aqui</strong><p>Não há atividades nesta visualização. Crie uma para organizar o próximo contato.</p><button className="activity-primary" onClick={() => setOpen(true)}><Plus size={16}/> Agendar atividade</button></div> : <div className="activity-list">{visible.map(item => { const late = item.status === "PENDENTE" && new Date(item.agendadaPara) < new Date(); return <article className={`activity-row ${late?"is-late":""}`} key={item.id}><div className={`activity-date ${late?"late":""}`}><strong>{new Date(item.agendadaPara).toLocaleDateString("pt-BR",{day:"2-digit"})}</strong><span>{new Date(item.agendadaPara).toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}</span></div><div className="activity-main"><div className="activity-row-top"><span className={`activity-type type-${item.tipo.toLowerCase()}`}>{tipos[item.tipo] || item.tipo}</span><span className={`activity-status status-${item.status.toLowerCase()}`}>{late?"Atrasada":item.status === "PENDENTE"?"Pendente":item.status === "CONCLUIDA"?"Concluída":"Cancelada"}</span></div><h3>{item.titulo}</h3><p>{item.lead.nome}{item.lead.produto?` · ${item.lead.produto}`:""}</p>{item.descricao && <p className="activity-description">{item.descricao}</p>}<span className="activity-time"><Clock3 size={13}/>{fmt(item.agendadaPara)}</span></div><div className="activity-actions">{item.status === "PENDENTE" && <><button className="activity-complete" onClick={() => void changeStatus(item,"CONCLUIDA")}><Check size={15}/> Concluir</button><button className="activity-icon-button" title="Cancelar" onClick={() => void changeStatus(item,"CANCELADA")}><X size={16}/></button></>}<button className="activity-icon-button danger" title="Excluir" onClick={() => void remove(item)}><Trash2 size={15}/></button></div></article>})}</div>}
    </section>
    {open && <div className="activity-modal-backdrop" onMouseDown={e => { if(e.target===e.currentTarget) setOpen(false); }}><form className="activity-modal" onSubmit={create}><div className="activity-modal-head"><div><span className="activities-kicker">NOVO COMPROMISSO</span><h2>Agendar atividade</h2><p>Defina o próximo passo para essa oportunidade.</p></div><button type="button" className="activity-icon-button" onClick={() => setOpen(false)}><X size={18}/></button></div><label>Título<input autoFocus required maxLength={120} placeholder="Ex.: Retornar cotação do seguro auto" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}/></label><div className="activity-form-grid"><label>Tipo<select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{Object.entries(tipos).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Data e horário<input required type="datetime-local" value={form.agendadaPara} onChange={e=>setForm({...form,agendadaPara:e.target.value})}/></label></div><label>Lead relacionado<select required value={form.leadId} onChange={e=>setForm({...form,leadId:e.target.value})}><option value="">Selecione um lead</option>{leads.map(l=><option key={l.id} value={l.id}>{l.nome}{l.produto?` — ${l.produto}`:""}</option>)}</select></label><label>Observações <span>(opcional)</span><textarea rows={3} maxLength={2000} placeholder="Contexto do contato, detalhes da proposta…" value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></label><div className="activity-modal-actions"><button type="button" className="activity-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="activity-primary" disabled={saving}>{saving?"Salvando…":"Salvar atividade"}</button></div></form></div>}
  </div>;
}
