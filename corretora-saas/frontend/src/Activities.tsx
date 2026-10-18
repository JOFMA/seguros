import React, { useEffect, useMemo, useState } from 'react';
import './Tasks.css';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import TaskCalendar from '@/components/TaskCalendar';
import { getTasks, createTask, patchTaskStatus, updateTask, deleteTask } from '@/services/tasks';
import type { Task } from '@/types/task';
import { Plus, CalendarClock, ListTodo } from 'lucide-react';

export default function Activities() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getTasks().then(data => { if (mounted) setTasks(data); }).catch(err => { console.error(err); setError('Falha ao carregar tarefas'); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function handleSaveLocal(task: Task) {
    // try to persist to backend, fallback to optimistic local update
    try {
      const saved = task.id?.startsWith('local-') ? await createTask(task) : await updateTask(task.id, task);
      setTasks(old => [saved, ...old.filter(t => t.id !== saved.id)]);
    } catch (err) {
      // optimistic local only
      setTasks(old => [task, ...old.filter(t => t.id !== task.id)]);
    }
  }

  async function toggleDone(t: Task) {
    const nextStatus = t.status === 'DONE' ? 'PENDING' : 'DONE';
    try {
      const patched = await patchTaskStatus(t.id, nextStatus as Task['status']);
      setTasks(old => old.map(x => x.id === patched.id ? patched : x));
    } catch (err) {
      // optimistic local
      setTasks(old => old.map(x => x.id === t.id ? { ...x, status: nextStatus } : x));
    }
  }

  async function handleDelete(t: Task) {
    if (!window.confirm('Excluir tarefa?')) return;
    try {
      await deleteTask(t.id);
      setTasks(old => old.filter(x => x.id !== t.id));
    } catch (err) {
      // optimistic
      setTasks(old => old.filter(x => x.id !== t.id));
    }
  }

  const grouped = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 1000 * 60 * 60 * 24 - 1);
    const in7 = new Date(startOfToday.getTime() + 1000 * 60 * 60 * 24 * 7);

    const list = tasks.filter(t => filterType === 'ALL' || t.type === filterType);
    const overdue = list.filter(t => new Date(t.dueDate) < now && t.status !== 'DONE');
    const today = list.filter(t => new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfToday && t.status !== 'DONE');
    const week = list.filter(t => new Date(t.dueDate) > endOfToday && new Date(t.dueDate) <= in7 && t.status !== 'DONE');
    const done = list.filter(t => t.status === 'DONE');
    return { overdue, today, week, done };
  }, [tasks, filterType]);

  return (
    <div className="activities-page">
      <header className="activities-heading">
        <div>
          <div className="activities-kicker"><CalendarClock size={15}/> CENTRAL DE TAREFAS</div>
          <h1>Agenda e Follow-ups</h1>
          <p>Controle suas tarefas e follow-ups — mude entre Lista e Agenda semanal.</p>
        </div>

        <div className="activities-controls">
          <div className="view-toggle">
            <button className={`toggle ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><ListTodo size={14}/> Lista</button>
            <button className={`toggle ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}><CalendarClock size={14}/> Agenda</button>
          </div>

          <div className="filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="ALL">Todos os tipos</option>
              <option value="CALL">Ligação</option>
              <option value="MEETING">Reunião</option>
              <option value="PROPOSAL">Envio de Proposta</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="AFTER_SALES">Pós-venda</option>
            </select>

            <button className="primary-button" onClick={() => { setEditTask(undefined); setShowModal(true); }}><Plus size={14}/> Nova Tarefa</button>
          </div>
        </div>
      </header>

      <main className="tasks-main">
        {view === 'list' ? (
          <div className="tasks-columns">
            <section className="tasks-column">
              <h3>Vencidas</h3>
              {grouped.overdue.map(t => <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={(x) => { setEditTask(x); setShowModal(true); }} onDelete={handleDelete} />)}
              {grouped.overdue.length === 0 && <div className="empty">Sem tarefas vencidas</div>}
            </section>

            <section className="tasks-column">
              <h3>Para Hoje</h3>
              {grouped.today.map(t => <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={(x) => { setEditTask(x); setShowModal(true); }} onDelete={handleDelete} />)}
              {grouped.today.length === 0 && <div className="empty">Nenhuma para hoje</div>}
            </section>

            <section className="tasks-column">
              <h3>Próximas</h3>
              {grouped.week.map(t => <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={(x) => { setEditTask(x); setShowModal(true); }} onDelete={handleDelete} />)}
              {grouped.week.length === 0 && <div className="empty">Nenhuma</div>}
            </section>

            <section className="tasks-column">
              <h3>Concluídas</h3>
              {grouped.done.map(t => <TaskCard key={t.id} task={t} onToggle={toggleDone} onEdit={(x) => { setEditTask(x); setShowModal(true); }} onDelete={handleDelete} />)}
              {grouped.done.length === 0 && <div className="empty">Nenhuma concluída</div>}
            </section>
          </div>
        ) : (
          <TaskCalendar tasks={tasks} />
        )}
      </main>

      <TaskModal open={showModal} initial={editTask} onClose={() => setShowModal(false)} onSaved={handleSaveLocal} mode={editTask ? 'edit' : 'create'} />
    </div>
  );
}
