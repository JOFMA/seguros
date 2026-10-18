import React from 'react';
import type { Task } from '@/types/task';
import './Tasks.css';

type Props = { tasks: Task[] };

export default function TaskCalendar({ tasks }: Props) {
  // Simple agenda by day for the next 7 days
  const days: { date: Date; tasks: Task[] }[] = [];
  const start = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 0, 0, 0);
    days.push({ date: d, tasks: tasks.filter(t => new Date(t.dueDate).toDateString() === d.toDateString()) });
  }

  return (
    <div className="task-calendar">
      {days.map((d) => (
        <section key={d.date.toDateString()} className="calendar-day">
          <div className="calendar-day-header">{d.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          <ul>
            {d.tasks.length === 0 ? <li className="empty">—</li> : d.tasks.map(t => (
              <li key={t.id} className={`cal-task ${t.status === 'DONE' ? 'done' : ''}`}>
                <div className="cal-task-time">{new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="cal-task-title">{t.title}</div>
                <div className="cal-task-meta">{t.leadName}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
