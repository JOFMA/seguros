import React, { useEffect, useState } from 'react';
import { getClients } from '@/services/clients';
import '../App.css';

type Client = {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  produto?: string | null;
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getClients()
      .then((c) => {
        if (!mounted) return;
        setClients(c);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError('Falha ao carregar clientes');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <header className="section-heading">
        <div>
          <h2>Clientes</h2>
          <p>Lista de clientes e contatos cadastrados.</p>
        </div>
      </header>

      <section className="leads-section">
        {loading ? (
          <p>Carregando clientes…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : clients.length === 0 ? (
          <p>Nenhum cliente encontrado.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Cidade</th>
                  <th>Produto</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="lead-name">{c.nome}</td>
                    <td>{c.telefone ?? '—'}</td>
                    <td>{c.email ?? '—'}</td>
                    <td>{c.cidade ?? '—'}</td>
                    <td>{c.produto ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
