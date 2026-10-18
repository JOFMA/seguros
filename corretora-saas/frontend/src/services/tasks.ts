import { api } from "./api";
import type { Task } from "@/types/task";

export async function getTasks() {
  const resp = await api.get<Task[]>('/tasks');
  return resp.data;
}

export async function createTask(payload: Partial<Task>) {
  const resp = await api.post<Task>('/tasks', payload);
  return resp.data;
}

export async function updateTask(id: string, payload: Partial<Task>) {
  const resp = await api.put<Task>(`/tasks/${id}`, payload);
  return resp.data;
}

export async function patchTaskStatus(id: string, status: Task['status']) {
  const resp = await api.patch<Task>(`/tasks/${id}`, { status });
  return resp.data;
}

export async function deleteTask(id: string) {
  const resp = await api.delete(`/tasks/${id}`);
  return resp.status === 204;
}
