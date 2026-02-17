# Treinos PPL (React + Vite + shadcn/ui)

App de treino PPL migrado do `index.html` legado para React com Tailwind e componentes shadcn/ui, mantendo:

- plano Push / Pull / Legs
- calendário semanal (modo 6x e 3x)
- logs por sessão com `IndexedDB`
- resumo semanal e histórico por dia

## Rodando localmente

```bash
pnpm install
pnpm dev
```

## Build estático

```bash
pnpm build
```

A saída estática é gerada em `dist/`.

## GitHub Pages

O projeto já está configurado para Pages:

- `vite.config.ts` define automaticamente o `base` em CI (usando o nome do repositório em `GITHUB_REPOSITORY`)
- `.github/workflows/action.yml` instala dependências, roda o build em `treinos-vite/` e publica `treinos-vite/dist`

Em repositórios de usuário (`<user>.github.io`), o `base` fica `/`.
