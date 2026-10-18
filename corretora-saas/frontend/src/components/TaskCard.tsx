import React from 'react';
import './Tasks.css';
import { CheckSquare, Clock, User, Tag, Trash } from 'lucide-react';
import type { Task } from '@/types/task';

type Props = {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  const due = new Date(task.dueDate);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const overdue = task.status !== 'DONE' && due.getTime() < now.getTime();

  return (
    <article className={`task-card ${task.status === 'DONE' ? 'done' : ''} ${overdue ? 'overdue' : ''}`}>
      <div className="task-left">
        <label className="task-checkbox">
          <input type="checkbox" checked={task.status === 'DONE'} onChange={() => onToggle(task)} />
          <span className="check-ui"><CheckSquare size={16} /></span>
        </label>
      </div>

      <div className="task-main">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {task.leadName && <span className="meta-item"><User size={14}/> {task.leadName}</span>}
          <span className="meta-item"><Clock size={14}/> {due.toLocaleString()}</span>
          <span className={`badge priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
          <span className="meta-item"><Tag size={14}/> {task.type}</span>
        </div>
      </div>

      <div className="task-actions">
        <button className="icon-btn" title="Editar" onClick={() => onEdit(task)}>✎</button>
        <button className="icon-btn destructive" title="Excluir" onClick={() => onDelete(task)}><Trash size={14}/></button>
      </div>
    </article>
  );
}
