# Segs — atualização de atividades e interface

## O que foi adicionado
- Módulo de Atividades com agenda, indicadores, filtros, criação, conclusão, cancelamento e exclusão.
- Atividades relacionadas a um lead e à corretora.
- Endpoints `GET/POST /api/activities`, `PATCH/DELETE /api/activities/:id`.
- Refinamento visual da aplicação e navegação para Atividades.

## Antes de começar
1. Faça uma cópia da pasta atual do projeto.
2. Mantenha seu arquivo `backend/.env` original. Ele não é incluído neste pacote por conter credenciais.
3. Confirme que `DATABASE_URL` aponta para o banco MySQL existente.

## Aplicar no Windows / PowerShell
Abra um terminal:
```powershell
cd C:\segs\corretora-saas\backend
npm install
npx prisma validate
npx prisma migrate dev --name add_activities
npx prisma generate
npm run dev
```

Em outro terminal:
```powershell
cd C:\segs\corretora-saas\frontend
npm install
npm run dev
```
Abra `http://localhost:5173` e clique em **Atividades**.

Se o Prisma solicitar configuração de conexão, confira `backend/.env` e `backend/prisma.config.ts`. Não apague o banco nem execute `prisma migrate reset`.

## Observações importantes
- O MVP ainda usa o ID de corretora de teste que já existia no Kanban. Para cadastrar atividades, esse ID precisa existir na tabela `Corretora` e os leads devem pertencer a ela.
- O backend atual ainda não tem autenticação nem isolamento seguro por usuário/tenant. Não exponha à internet nem use dados reais sensíveis antes de implementar autenticação, autorização e validação de tenant.
- O endpoint de webhook Meta continua sendo protótipo e não valida assinatura.
