
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import type { Prisma } from "@prisma/client";
import { LeadStatus } from "@prisma/client";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// Verifica se a API está funcionando
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "API do Segs funcionando!",
  });
});

// Verifica a conexão com o banco de dados
app.get("/api/db-check", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      message: "Conexão com o banco de dados funcionando!",
    });
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);

    res.status(500).json({
      status: "error",
      message: "Não foi possível conectar ao banco de dados.",
    });
  }
});

// Verificação do webhook da Meta
app.get("/api/webhooks/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const tokenEsperado = process.env.META_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    tokenEsperado &&
    token === tokenEsperado
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Recebe notificações do webhook da Meta
app.post("/api/webhooks/meta", (req, res) => {
  console.log(
    "Webhook da Meta recebido:",
    JSON.stringify(req.body, null, 2)
  );

  // Protótipo: apenas registra o payload recebido.
  // A validação da assinatura e o processamento dos leads
  // deverão ser implementados antes de usar em produção.

  return res.sendStatus(200);
});

// Lista os leads
app.get("/api/leads", async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: {
        recebidoEm: "desc",
      },
      include: {
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return res.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);

    return res.status(500).json({
      message: "Erro ao buscar os leads.",
    });
  }
});

// Cadastra um novo lead
app.post("/api/leads", async (req, res) => {
  try {
    const {
      nome,
      telefone,
      email,
      produto,
      origem,
      observacoes,
      corretoraId,
    } = req.body;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof corretoraId !== "string" ||
      !corretoraId.trim()
    ) {
      return res.status(400).json({
        message: "Nome e corretoraId são obrigatórios.",
      });
    }

    const corretora = await prisma.corretora.findUnique({
      where: {
        id: corretoraId,
      },
    });

    if (!corretora) {
      return res.status(404).json({
        message: "Corretora não encontrada.",
      });
    }

    const lead = await prisma.lead.create({
      data: {
        nome: nome.trim(),
        telefone: typeof telefone === "string" && telefone.trim()
          ? telefone.trim()
          : null,
        email: typeof email === "string" && email.trim()
          ? email.trim()
          : null,
        produto: typeof produto === "string" && produto.trim()
          ? produto.trim()
          : null,
        origem: typeof origem === "string" && origem.trim()
          ? origem.trim()
          : "MANUAL",
        observacoes:
          typeof observacoes === "string" && observacoes.trim()
            ? observacoes.trim()
            : null,
        status: LeadStatus.NOVO,
        corretoraId,
      },
    });

    return res.status(201).json(lead);
  } catch (error) {
    console.error("Erro ao cadastrar lead:", error);

    return res.status(500).json({
      message: "Erro ao cadastrar o lead.",
    });
  }
});

// Atualiza o status de um lead no funil
app.patch("/api/leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = Object.values(LeadStatus);

    if (
      typeof status !== "string" ||
      !statusPermitidos.includes(status as LeadStatus)
    ) {
      return res.status(400).json({
        message: "Status inválido.",
        statusPermitidos,
      });
    }

    const leadExistente = await prisma.lead.findUnique({
      where: { id },
    });

    if (!leadExistente) {
      return res.status(404).json({
        message: "Lead não encontrado.",
      });
    }

    const leadAtualizado = await prisma.lead.update({
      where: { id },
      data: {
        status: status as LeadStatus,
      },
    });

    return res.json(leadAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar status:", error);

    return res.status(500).json({
      message: "Erro ao atualizar o status do lead.",
    });
  }
});

// Edita os dados de um lead
app.patch("/api/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      telefone,
      email,
      produto,
      origem,
      observacoes,
      proximaAcao,
    } = req.body;

    const leadExistente = await prisma.lead.findUnique({
      where: { id },
    });

    if (!leadExistente) {
      return res.status(404).json({
        message: "Lead não encontrado.",
      });
    }

    const data: Prisma.LeadUpdateInput = {};

    if (nome !== undefined) {
      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          message: "O nome não pode ficar vazio.",
        });
      }

      data.nome = nome.trim();
    }

    if (telefone !== undefined) {
      if (telefone !== null && typeof telefone !== "string") {
        return res.status(400).json({
          message: "Telefone inválido.",
        });
      }

      data.telefone =
        typeof telefone === "string" && telefone.trim()
          ? telefone.trim()
          : null;
    }

    if (email !== undefined) {
      if (email !== null && typeof email !== "string") {
        return res.status(400).json({
          message: "E-mail inválido.",
        });
      }

      data.email =
        typeof email === "string" && email.trim()
          ? email.trim()
          : null;
    }

    if (produto !== undefined) {
      if (produto !== null && typeof produto !== "string") {
        return res.status(400).json({
          message: "Produto inválido.",
        });
      }

      data.produto =
        typeof produto === "string" && produto.trim()
          ? produto.trim()
          : null;
    }

    if (origem !== undefined) {
      if (typeof origem !== "string" || !origem.trim()) {
        return res.status(400).json({
          message: "Origem inválida.",
        });
      }

      data.origem = origem.trim();
    }

    if (observacoes !== undefined) {
      if (
        observacoes !== null &&
        typeof observacoes !== "string"
      ) {
        return res.status(400).json({
          message: "Observações inválidas.",
        });
      }

      data.observacoes =
        typeof observacoes === "string" && observacoes.trim()
          ? observacoes.trim()
          : null;
    }

    if (proximaAcao !== undefined) {
      if (proximaAcao === null || proximaAcao === "") {
        data.proximaAcao = null;
      } else if (typeof proximaAcao === "string") {
        const dataAcao = new Date(proximaAcao);

        if (Number.isNaN(dataAcao.getTime())) {
          return res.status(400).json({
            message: "Data da próxima ação inválida.",
          });
        }

        data.proximaAcao = dataAcao;
      } else {
        return res.status(400).json({
          message: "Data da próxima ação inválida.",
        });
      }
    }

    const leadAtualizado = await prisma.lead.update({
      where: { id },
      data,
    });

    return res.json(leadAtualizado);
  } catch (error) {
    console.error("Erro ao editar lead:", error);

    return res.status(500).json({
      message: "Erro ao editar os dados do lead.",
    });
  }
});

// ATIVIDADES / FOLLOW-UPS
const tiposAtividade = ["LIGACAO", "WHATSAPP", "EMAIL", "REUNIAO", "ENVIO_PROPOSTA", "RETORNO", "OUTRO"] as const;
const statusAtividade = ["PENDENTE", "CONCLUIDA", "CANCELADA"] as const;

app.get("/api/activities", async (req, res) => {
  try {
    const { status, leadId, periodo } = req.query;
    const where: Prisma.AtividadeWhereInput = {};
    if (typeof status === "string" && statusAtividade.includes(status as typeof statusAtividade[number])) where.status = status as typeof statusAtividade[number];
    if (typeof leadId === "string" && leadId) where.leadId = leadId;
    if (typeof periodo === "string") {
      const now = new Date();
      if (periodo === "atrasadas") { where.status = "PENDENTE"; where.agendadaPara = { lt: now }; }
      if (periodo === "hoje") { const start = new Date(now); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate()+1); where.agendadaPara = { gte:start, lt:end }; }
    }
    const items = await prisma.atividade.findMany({ where, orderBy: [{ status: "asc" }, { agendadaPara: "asc" }], include: { lead: { select: { id:true, nome:true, telefone:true, produto:true } } } });
    res.json(items);
  } catch (error) { console.error("Erro ao listar atividades", error); res.status(500).json({ message: "Erro ao buscar atividades." }); }
});

app.post("/api/activities", async (req, res) => {
  try {
    const { titulo, descricao, tipo, agendadaPara, leadId, corretoraId } = req.body;
    if (typeof titulo !== "string" || !titulo.trim() || typeof leadId !== "string" || !leadId || typeof corretoraId !== "string" || !corretoraId || typeof agendadaPara !== "string" || Number.isNaN(new Date(agendadaPara).getTime())) return res.status(400).json({ message: "Título, lead, corretora e data válida são obrigatórios." });
    const lead = await prisma.lead.findFirst({ where: { id: leadId, corretoraId } });
    if (!lead) return res.status(404).json({ message: "Lead não encontrado nesta corretora." });
    const tipoFinal = typeof tipo === "string" && tiposAtividade.includes(tipo as typeof tiposAtividade[number]) ? tipo as typeof tiposAtividade[number] : "RETORNO";
    const item = await prisma.atividade.create({ data: { titulo: titulo.trim(), descricao: typeof descricao === "string" && descricao.trim() ? descricao.trim() : null, tipo: tipoFinal, agendadaPara: new Date(agendadaPara), leadId, corretoraId }, include: { lead: { select: { id:true, nome:true, telefone:true, produto:true } } } });
    await prisma.lead.update({ where: { id: leadId }, data: { proximaAcao: new Date(agendadaPara) } });
    res.status(201).json(item);
  } catch (error) { console.error("Erro ao criar atividade", error); res.status(500).json({ message: "Erro ao criar atividade." }); }
});

app.patch("/api/activities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.atividade.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Atividade não encontrada." });
    const { titulo, descricao, tipo, agendadaPara, status } = req.body;
    const data: Prisma.AtividadeUpdateInput = {};
    if (titulo !== undefined) { if (typeof titulo !== "string" || !titulo.trim()) return res.status(400).json({ message: "Título obrigatório." }); data.titulo = titulo.trim(); }
    if (descricao !== undefined) data.descricao = typeof descricao === "string" && descricao.trim() ? descricao.trim() : null;
    if (tipo !== undefined) { if (typeof tipo !== "string" || !tiposAtividade.includes(tipo as typeof tiposAtividade[number])) return res.status(400).json({ message: "Tipo inválido." }); data.tipo = tipo as typeof tiposAtividade[number]; }
    if (agendadaPara !== undefined) { const date = new Date(agendadaPara); if (Number.isNaN(date.getTime())) return res.status(400).json({ message: "Data inválida." }); data.agendadaPara = date; }
    if (status !== undefined) { if (typeof status !== "string" || !statusAtividade.includes(status as typeof statusAtividade[number])) return res.status(400).json({ message: "Status inválido." }); data.status = status as typeof statusAtividade[number]; data.concluidaEm = status === "CONCLUIDA" ? new Date() : null; }
    const updated = await prisma.atividade.update({ where: { id }, data, include: { lead: { select: { id:true, nome:true, telefone:true, produto:true } } } });
    res.json(updated);
  } catch (error) { console.error("Erro ao atualizar atividade", error); res.status(500).json({ message: "Erro ao atualizar atividade." }); }
});

app.delete("/api/activities/:id", async (req, res) => {
  try { await prisma.atividade.delete({ where: { id: req.params.id } }); res.sendStatus(204); }
  catch (error) { console.error("Erro ao excluir atividade", error); res.status(500).json({ message: "Erro ao excluir atividade." }); }
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Segs API rodando em http://localhost:${PORT}`);
});
