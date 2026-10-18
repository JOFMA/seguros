export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskType = 'CALL' | 'MEETING' | 'PROPOSAL' | 'WHATSAPP' | 'AFTER_SALES' | 'OTHER';
export type TaskStatus = 'PENDING' | 'DONE' | 'CANCELLED';

export interface Task {
  id: string;
  title: string;
  leadId?: string | null;
  leadName?: string | null;
  dueDate: string; // ISO
  type: TaskType;
  priority: TaskPriority;
  assignee?: string | null;
  status: TaskStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
