import React, { useEffect, useState } from 'react';
import type { Task, TaskPriority, TaskType } from '@/types/task';
import { formatISO, addHours, addDays } from 'date-fns';
import './Tasks.css';

type Props = {
  open: boolean;
  initial?: Partial<Task>;
  onClose: () => void;
  onSaved: (task: Task) => void;
  mode?: 'create' | 'edit';
};

const nowISO = () => new Date().toISOString();

export default function TaskModal({ open, initial, onClose, onSaved, mode = 'create' }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [leadName, setLeadName] = useState(initial?.leadName ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? formatISO(new Date()));
  const [type, setType] = useState<TaskType>((initial?.type ?? 'CALL') as TaskType);
  const [priority, setPriority] = useState<TaskPriority>((initial?.priority ?? 'MEDIUM') as TaskPriority);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setLeadName(initial?.leadName ?? '');
    setDueDate(initial?.dueDate ?? formatISO(new Date()));
    setType((initial?.type ?? 'CALL') as TaskType);
    setPriority((initial?.priority ?? 'MEDIUM') as TaskPriority);
    setSaving(false);
    const t = setTimeout(() => {
      const el = document.querySelector('.activity-modal input');
      (el as HTMLElement | null)?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open, initial]);

  if (!open) return null;

  function pickQuick(option: string) {
    if (option === '+1h') setDueDate(formatISO(addHours(new Date(), 1)));
    if (option === 'tomorrow') setDueDate(formatISO(addDays(new Date(), 1)));
    if (option === '3days') setDueDate(formatISO(addDays(new Date(), 3)));
    if (option === 'week') setDueDate(formatISO(addDays(new Date(), 7)));
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      // build minimal Task-like object — actual persistence handled by caller/service
      const task: Task = {
        id: initial?.id ?? `local-${Date.now()}`,
        title: title.trim() || 'Nova tarefa',
        leadName: leadName || undefined,
        dueDate,
        type,
        priority,
        status: initial?.status ?? 'PENDING',
        createdAt: initial?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task;

      onSaved(task);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="activity-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="activity-modal" onSubmit={submit}>
        <div className="modal-header">
          <h3>{mode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa'}</h3>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="policy-form-grid">
          <label>
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            Lead / Cliente
            <input value={leadName} onChange={(e) => setLeadName(e.target.value)} />
          </label>

          <label>
            Prazo (data e hora)
            <input type="datetime-local" value={new Date(dueDate).toISOString().slice(0,16)} onChange={(e) => setDueDate(new Date(e.target.value).toISOString())} />
            <div className="quick-picks">
              <button type="button" onClick={() => pickQuick('+1h')}>+1h</button>
              <button type="button" onClick={() => pickQuick('tomorrow')}>Amanhã</button>
              <button type="button" onClick={() => pickQuick('3days')}>Em 3 dias</button>
              <button type="button" onClick={() => pickQuick('week')}>Próxima semana</button>
            </div>
          </label>

          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value as Task['type'])}>
              <option value="CALL">Ligação</option>
              <option value="MEETING">Reunião</option>
              <option value="PROPOSAL">Envio de Proposta</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="AFTER_SALES">Pós-venda</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>

          <label>
            Prioridade
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>
          </label>

          <label className="full">
            Observações
            <textarea />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  );
}
