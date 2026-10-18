import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Lead } from './types/lead';

export type Client = {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  produto?: string | null;
};

export async function getClients(): Promise<Client[]> {
  try {
    const resp = await api.get<Client[]>('/clients');
    return resp.data;
  } catch (err) {
    // fallback mock data for development
    return [
      { id: 'c1', nome: 'João Silva', telefone: '11999990000', email: 'joao@example.com', cidade: 'São Paulo', produto: 'Auto' },
      { id: 'c2', nome: 'Maria Oliveira', telefone: '21988881111', email: 'maria@example.com', cidade: 'Rio de Janeiro', produto: 'Residencial' },
      { id: 'c3', nome: 'Carlos Pereira', telefone: null, email: 'carlos@example.com', cidade: 'Belo Horizonte', produto: 'Vida' },
    ];
  }
}
