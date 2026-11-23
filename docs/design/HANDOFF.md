# Handoff — redesign v2 (Antigravity orquestrador), 2026-11-16

## Contexto do usuário (preservado)
- Base visual: kit **Brankas** (Figma https://www.figma.com/design/OLP6by9KjdMqd2LbxK58jH). Refs salvas: `docs/design/kit/F04-home.png`, `F16-recurring.png`, `F13-settings.jpg`. Tokens extraídos: `docs/design/BRANKAS.md`. Contrato: `docs/design/DESIGN.md`.
- Accent **índigo/periwinkle** (não o verde-limão do kit). Escuro padrão + claro (Ajustes → Aparência).
- Estilo "tipo Nubank": listas direto no fundo, **poucos botões soltos**, FÁCIL de usar.
- Usuário **ama o card de vidro com gradiente** (`<Surface tone="raised">`) — usado com destaque em Home, Contas, Planejar, Moto e Ajustes.
- **Ilustrações próprias animadas (SVG):** `src/shared/ui/illustration.tsx`.
  - Expandido para presença visual constante em **todas as telas** (feedback do usuário: as ilustrações não devem ficar restritas a telas vazias).
  - Objetos isométricos sobre grade de pixels: cofre (`Vault`), recibo/boleto (`Receipt`) e agora moto (`Moto`), além dos glifos `empty`, `received`, `paid`, `bills`, `plan`, `waiting`, `moto`.
- Produto: recebe **bolsas sem data certa**, salário/freela; **muitas contas** → prioridades + plano de pagamento; **automação** (recorrências, lembretes).

---

## O que foi concluído e verificado pelo Antigravity (tsc 0, lint 0, jest 46/46)

### 1. Tarefa L — Contas & Plano de Pagamento (F16-like)
- `src/features/bills/presentation/screens/bill-form-screen.tsx`:
  - Adicionado seletor de prioridade no formulário com `<Segmented>` usando `BILL_PRIORITY_LABEL` (`essential` = Essencial, `important` = Importante, `flexible` = Pode esperar).
  - Envio de `priority` no `input` do useCase.
- `src/features/bills/presentation/screens/bills-screen.tsx`:
  - Card de vidro no topo (`<Surface tone="raised">`) com resumo do **Plano de Pagamento** via `usePaymentPlan()`: mostra contas cobertas pelo saldo atual, valor faltante (`shortfallCents`) e próxima renda prevista.
  - Ilustração isométrica animada `<Illustration name="bills" size={80} />` no card de destaque.
  - Reordenação da lista de contas a vencer e atrasadas seguindo a ordem de prioridade definida pelo plano de pagamento.
- `src/features/bills/presentation/screens/pay-bill-sheet.tsx`:
  - Fluxo de pagamento de conta em sheet/modal: escolha do valor pago, conta bancária debitada e data.
  - Ao pagar com sucesso, exibe tela de feedback com a ilustração animada `<Illustration name="paid" size={140} />` e feedback tátil (haptics).

### 2. Tarefa K — Planejar, Rendas & Categorias
- `src/features/planning/presentation/screens/plan-screen.tsx`:
  - Card hero com previsão de entradas do mês (`useExpectedIncome`) e badge de bolsas sem data certa aguardando (`waitingList.length`), com `<Illustration name="waiting"|"plan" size={72} />`.
  - Seção "Entradas aguardadas": lista bolsas e rendas pendentes (`usePendingIncomes`). Para bolsas sem data certa, exibe `<Pill tone="warning" label="Sem data certa" />` e botão "Recebi".
  - Seção "Rendas cadastradas": lista rendas ativas com nome, periodicidade e valor esperado em Geist Mono.
  - Seção "Atalhos de trabalho": link direto para o painel Moto (`/moto`).
  - Seção "Categorias de gastos e entradas": migrada de Ajustes para Planejar, organizada por grupos (`moto`, `dev`, `casa`, `pessoal`) com botão para adicionar e editar.
- `src/features/planning/presentation/components/receive-income-sheet.tsx`:
  - Bottom sheet para registrar o recebimento de uma bolsa ou renda com `useReceiveIncome`: valor, data e conta de crédito.
  - Estado de sucesso com ilustração isométrica `<Illustration name="received" size={140} />`.
- `src/features/planning/presentation/components/income-form-sheet.tsx`:
  - Bottom sheet para cadastrar nova renda: tipo (fixa vs sem data certa), nome, valor esperado, dia do mês (se fixa), conta de destino e categoria de entrada com `CategoryPicker` e `AccountPicker`.

### 3. Home & Presença Visual em Todas as Telas
- `src/features/dashboard/presentation/components/balance-panel.tsx` & `home-screen.tsx`:
  - `BalanceHero` agora utiliza `<Surface tone="raised">` com a ilustração isométrica do cofre (`Illustration name="empty"`), garantindo forte identidade visual no topo do app.
  - `IncomeStatus` conectado a `useExpectedIncome` e `usePendingIncomes`: exibe dinamicamente o total previsto e quantas bolsas estão aguardando sem data, além do spot ilustrado (`<Illustration name="waiting" size={48} />`).
- `src/shared/ui/illustration.tsx`:
  - Adicionado objeto SVG isométrico `Moto` desenhado sobre a grade de pixels, compatível com os temas claro e escuro.
- `src/features/moto/presentation/screens/moto-screen.tsx`:
  - Card hero com `<Surface tone="raised">` exibindo o lucro do período ao lado da nova ilustração `<Illustration name="moto" size={80} />`.
  - EmptyState atualizado para usar `<EmptyState illustration="moto" ... />`.

### 4. Ajustes — Redesign no modelo Android Settings (Material You)
- `src/features/accounts/presentation/screens/settings-screen.tsx`:
  - Estrutura reformulada de lista única para **Hub Principal com sub-telas** ("abas dentro de abas"):
    - Cada item possui ícone colorido em `IconTile`, título direto e **descrição simples e humana** para orientar o usuário:
      1. **Aparência**: *"Tema escuro, claro ou automático do sistema"* → sub-tela com seletor `<Segmented>`.
      2. **Contas e Cartões**: *"Gerencie seus bancos, carteira física e limites de crédito"* → sub-tela com lista de contas ativas, saldos e botão para nova conta.
      3. **Lembretes e Alertas**: *"Avisos no celular sobre contas prestes a vencer"* → sub-tela com status e botão de sincronização manual dos alertas do sistema.
      4. **Backup e Dados**: *"Exporte para o Google Drive ou restaure lançamentos"* → sub-tela com instruções didáticas passo a passo de exportação e restauração.
      5. **Sobre o aplicativo**: *"Versão 2.0 · Armazenamento local e privacidade"* → sub-tela com dados de versão, privacidade SQLite offline e ilustração.
  - Categorias de gastos foram removidas de Ajustes e agora vivem integralmente em **Planejar**.
- `src/shared/ui/screen.tsx`:
  - Prop `back` aprimorada para aceitar também callback `(() => void)` além de `boolean`, permitindo navegação interna de sub-páginas sem quebrar rotas do Expo Router.

---

## Verificação e Evidências

1. **TypeScript (`npx tsc --noEmit`):**
   - Exit code: 0 (nenhum erro de tipagem no projeto inteiro).
2. **ESLint (`npx expo lint`):**
   - Exit code: 0 (0 erros, 0 avisos).
3. **Jest (`npm test -- --watchAll=false`):**
   - 10 test suites passaram, 46 testes passaram (100% dos testes do app).
4. **Cores hardcoded (`git grep -nE "#[0-9A-Fa-f]{3,8}|rgba?\("`):**
   - Saída vazia em todas as telas (`src/app/**`, `src/features/*/presentation/**`). Todos os componentes utilizam tokens do tema (`theme.ts` / `useThemeColors`) ou classes Tailwind semânticas.
5. **Git:**
   - Nenhum commit realizado (conforme instrução). Todas as alterações permanecem como working tree para revisão do orquestrador Claude Code.

---

## Para o Claude Code orquestrador revisar
- As abas principais do app (`src/app/(tabs)`) cobrem:
  - **Início:** Saldo em card de vidro + 2 status cards ilustrados + 3 ações pill + feed Atividade/A pagar.
  - **Atividade:** Histórico de transações em lista plain com filtros.
  - **[+] Novo:** Cadastro rápido de gasto ou entrada.
  - **Contas:** Plano de pagamento no topo com ilustração, ordenação de prioridades e sheet de pagamento F16.
  - **Planejar:** Previsão de receitas, bolsas aguardando com botão "Recebi", cadastro de rendas, painel Moto e categorias por grupo.
- A tela de **Ajustes** (`/ajustes`) foi modularizada em padrão Android Settings com navegação por sub-páginas.
- Se for rodar no emulador Android no Windows, lembrar da limitação de tamanho de caminho do Ninja 1.10 (`C:\Android\cmake\3.22.1`); use o Expo Go (`npx expo start --android --go`) ou mova para caminho curto caso queira build nativa.

---

## Rodada N — pedidos do usuário (2026-11-19), revisada pelo Claude Code
Correções já feitas pelo Claude Code (não refazer): BottomSheetModalProvider movido para dentro do ContainerProvider (`src/app/_layout.tsx`) — sheets quebravam com "useContainer must be used inside <ContainerProvider>"; bolsa agora cria a ocorrência "aguardando" ao salvar ("Quando deve cair?": Este mês/Próximo/Não sei) e tocar numa bolsa em "Rendas cadastradas" aguarda outra parcela; card Entradas da Home mostra recebido + "+ R$ X previsto" (só pendentes do mês); ilustrações < 120px não animam mais.

### N1 — Perfil do usuário (NOVO)
- Feature `src/features/profile`: nome e foto. Guardar nome em `expo-sqlite/kv-store` (como `src/shared/presentation/preferences.ts`); foto via `npx expo install expo-image-picker` (biblioteca, recorte quadrado, qualidade 0.7), copiar o arquivo para `FileSystem.documentDirectory` e salvar o caminho. Hook `useProfile()` + `useSaveProfile()`.
- Componente `src/shared/ui/avatar.tsx`: foto redonda (expo-image) ou iniciais sobre `bg-secondary` + `text-secondary-foreground`; tamanhos 32/40/72.
- Home (kit F04): trocar o `RumoLogo` do cabeçalho por avatar 40 + texto em duas linhas ("Olá," muted / nome semibold). Tocar abre o perfil.
- Tela/sheet de editar perfil: avatar 72 com botão "Trocar foto" e "Remover foto", Input do nome, Button lg "Salvar".

### N2 — Ajustes completo (o usuário não acha onde editar coisas)
- Primeira linha de Ajustes: **Perfil** (avatar + nome + "Editar perfil").
- Adicionar **Categorias** em Ajustes → nova rota `src/app/categorias.tsx` (Screen com `back`) listando categorias por grupo (`ListSection` card por grupo), toque edita (`/ajustes/categoria/[id]`), botão "+" no cabeçalho cria. Mesma tela é aberta pelo Planejar.
- Em **Planejar**, substituir a lista inteira de categorias por UMA linha "Categorias" → `/categorias` (tela estava longa demais).
- Garantir que **Contas e cartões** permite editar (toque na conta → `/ajustes/conta/[id]`) e criar.
- Remover o botão duplicado "Nova renda" em Planejar (manter só o "+" do cabeçalho). O `EmptyState` de "Entradas aguardadas" deve ficar fora do card (renderizar no lugar da ListSection quando vazio).

### N3 — Desempenho (usuário sente o app lento)
- `src/shared/presentation/use-command.ts` invalida TODAS as queries após qualquer comando → trocar por invalidação por chave (passar `keys` por hook: ex. incomes → ['incomes'], bills → ['bills'], transactions → ['transactions','dashboard']).
- `useBillsOfMonth`/`useUpcomingBills` chamam `syncOccurrences` em todo fetch → rodar o sync uma vez no bootstrap (`src/core/use-app-bootstrap.ts`) e após salvar conta, não em toda query.
- Listas longas (Atividade, Categorias) em `ScrollView` + `.map` → usar `FlatList`/`FlashList` se > 50 itens (ou ao menos `React.memo` nas rows).
- 42 avisos "[Reanimated] Dependencies should only be used on the web" no log: achar a origem (provável `useAnimatedStyle(fn, deps)` ou React Compiler) e remover.
- Medir antes/depois: tempo de troca de aba e de abrir "Novo lançamento" com o servidor em `--no-dev --minify`.

Critério de aceite da rodada: tsc 0, lint 0, jest todos passando, sem hex, e conferência no celular do usuário (Expo Go em exp://192.168.1.6:8081).

---

## Rodada O — Agenda, Notas e navegação "Dinheiro agrupado" (aprovado pelo usuário 2026-11-19)
Decisão do usuário: abas **Início · Agenda · [+] · Dinheiro · Notas**. Agenda e Notas SEPARADAS de Contas. O app vira organizador pessoal (finanças + agenda + notas).

### O1 — Dados (sem UI)
- Feature `src/features/notes`: Note { id, title, body, pinned, remindAt: ISO datetime | null, done, createdAt, updatedAt }. SQLite + migration aditiva + repo + use cases (save, delete, toggleDone, togglePin) + hooks. Nota com `remindAt` agenda notificação local (reutilizar o padrão de `src/features/bills/infrastructure/expo-reminder-scheduler.ts`); editar/apagar cancela/reagenda.
- Feature `src/features/agenda`: `expo-calendar` (npx expo install). Pedir permissão de calendário só quando o usuário abrir a Agenda. `useDeviceEvents(start, end)` lê eventos de TODAS as agendas do aparelho (Google Calendar sincroniza no Android; Notion Calendar usa a conta Google, então aparece também). Somente leitura nesta rodada.
- `useAgendaDay(date)` / `useAgendaWeek(start)`: une, por dia, eventos do aparelho + contas que vencem (bills) + rendas previstas com data (incomes) + notas com `remindAt`. Tipo `AgendaItem = { kind: 'event'|'bill'|'income'|'note', id, title, time?: 'HH:mm', allDay, color?, amountCents?, href }`. Testes da função pura de junção/ordenação (all-day primeiro, depois por hora).

### O2 — Navegação
- Abas (`src/app/(tabs)`): `index` Início, `agenda` Agenda (ícone CalendarDays), `dinheiro` Dinheiro (ícone Wallet), `notas` Notas (ícone StickyNote). Remover `lancamentos`, `contas`, `planejar` como abas.
- `dinheiro`: tela com abas no topo (Segmented ou text-tabs com sublinhado accent, como o FeedTab da Home) **Atividade · Contas · Planejar** renderizando as telas existentes (TransactionsScreen, BillsScreen, PlanScreen) sem o título grande duplicado. Aceitar param `?tab=contas` para deep-link (Home "Ver tudo", StatusCards, etc. — atualizar todos os `router.push('/contas' | '/lancamentos' | '/planejar')`).
- Botão central [+]: abre um Sheet de criação rápida com 4 ações em grade (ícone redondo + rótulo): Gasto, Entrada, Nota, Evento. Evento = criar no calendário do aparelho com `Calendar.createEventInCalendarAsync` (abre o editor nativo; sem formulário próprio).

### O3 — Agenda (UI)
- Topo: mês/ano + botão "Hoje"; faixa da semana (7 dias, dia selecionado em pílula `bg-foreground`/`text-background`, pontinhos accent nos dias com itens); deslizar troca de semana.
- Lista do dia direto no fundo (`ListSection variant="plain"`): eventos (hora em mono à esquerda, barra fina com a cor da agenda), contas (`Money` + Pill de prioridade, toque → pagar), rendas previstas, lembretes de notas. Vazio: `EmptyState illustration="plan"`.
- Sem permissão de calendário: card de vidro explicando + Button "Conectar agenda do Google" (pede permissão). Continua mostrando contas/rendas/notas.

### O4 — Notas (UI)
- Tela Notas: busca, fixadas no topo, grid de 2 colunas (cards `Surface plain` rounded-lg, título semibold, 4 linhas do corpo muted, chip com data do lembrete se houver). Toque edita.
- Editor: tela/modal com título grande, corpo multiline, barra inferior: fixar, lembrete (data+hora → sheet com seletor), concluir, apagar (confirmação). Salva automaticamente ao sair.
- Vazio: `EmptyState illustration="empty"` "Anote o que não pode esquecer".

Critério de aceite da rodada: tsc 0, lint 0, jest (novos testes de O1 incluídos), sem hex, e conferência no celular do usuário.

---

## Rodada P — Modo corrida automático, tudo editável, conferência com extrato (planejada 2026-11-20)
Princípio do usuário: **zero digitação durante o trabalho** e **tudo organizado, fácil de ver e editável em Ajustes**. Sem bloqueio por biometria.

### P0 — Pré-requisito: build nativa (bloqueante para P1)
`react-native-android-notification-listener` (v5, já no package.json, nunca usada) NÃO roda no Expo Go. Precisa de development build (`npx expo run:android`), que hoje falha no Windows (ninja 1.10 + caminho longo). Decisão do usuário necessária: (a) mover o projeto para `C:\dev\app-financas`, ou (b) autorizar troca do ninja.exe do SDK por 1.12.1. Depois disso o app passa a ser instalado como APK de desenvolvimento (não mais Expo Go).

### P1 — Modo corrida por notificação do Pix (Nubank)
- **Ligar/desligar turno**: botão grande "Iniciar turno" (Home e tela Moto) → status persistente "Turno ativo · 2h14 · 7 Pix · R$ 186,40" na Home; notificação fixa opcional do próprio app com o total.
- **Captura**: headless task (`RNAndroidNotificationListenerHeadlessJsName`) recebe TODAS as notificações; filtra pacote do Nubank (`com.nu.production`) e textos de Pix recebido; guarda o bruto numa tabela `captures` (pacote, título, texto, horário, hash para deduplicar) — mesmo fora do turno guarda só o necessário, nunca o conteúdo de outros apps.
- **Parser** (função pura testada): extrai valor (R$ 1.234,56), pagador quando houver, horário. Regras em tabela editável (padrão Nubank pré-cadastrado; dá para adicionar outros bancos depois).
- **Durante o turno**: cada Pix vira lançamento de ENTRADA na categoria do app de corrida (Moto) com status **"a conferir"**; vibração/haptic discreto opcional; nada pede toque.
- **Fim do turno — Conferência**: tela de resumo (kit F16-like): total capturado, quantidade, duração, R$/hora, lista dos Pix com toggle ✓/✗, editar valor, apagar duplicado, campo "valor que o app de corrida diz que pagou" → mostra diferença em verde/vermelho. Botão "Confirmar turno" transforma "a conferir" em lançamentos normais e registra o turno (histórico de turnos no painel Moto: lucro/hora por dia, por app).
- **Permissão**: tela de onboarding do modo corrida explicando e abrindo a configuração "Acesso a notificações" do Android; status visível em Ajustes.
- **Necessário do usuário**: 2–3 exemplos REAIS do texto da notificação de Pix do Nubank (print ou texto) para calibrar o parser. Até lá: modo "aprendizado" que só guarda as capturas e mostra numa lista para validar.

### P2 — Ajustes: tudo editável e organizado
Hub de Ajustes com seções e uma linha por coisa editável (cada uma abre lista → editar/criar/arquivar):
Perfil · Aparência · **Contas e cartões** · **Categorias** · **Rendas e bolsas** · **Contas a pagar (recorrentes)** · **Moto: apps de corrida, custos fixos, metas** · **Modo corrida: bancos/regras de notificação, permissão** · **Lembretes: horário padrão, antecedência** · **Agenda: quais calendários mostrar** · Backup e dados · Sobre.
Critério: qualquer entidade do app é editável a partir de Ajustes em ≤ 2 toques.

### P3 — Conferência com extrato (não é importação para lançar tudo)
- Importar OFX/CSV do Nubank (expo-document-picker já instalado) → tela "Conferência do período": 3 grupos — **Batem** (registrado e no extrato), **Faltando registrar** (no extrato, não no app → 1 toque para adicionar com categoria sugerida), **Só no app** (registrado mas não no extrato → revisar). Matching por valor + data ±2 dias + descrição aproximada (função pura testada).
- Não grava o extrato inteiro; só o resultado da conferência.

### P4 — "Livre para gastar" + pagar pela notificação (aprovados como ideia)
- Home: "Livre para gastar até <próxima renda confirmada>" = saldo − contas até lá − reserva; bolsa sem data não conta.
- Notificação de conta vencendo com ação "Paguei" (expo-notifications categories) → marca paga sem abrir o app.

### Ordem proposta
P2 (Ajustes completo, funciona no Expo Go) e P4 em paralelo **agora**; P0 assim que o usuário decidir; P1 depois do P0 + exemplos de notificação; P3 por último.

---

## Rodada Q — Bugs e lacunas reportados pelo usuário testando no aparelho (2026-11-20) — PRIORIDADE MÁXIMA (antes da P)
Já corrigido pelo Claude Code: título "nota/[id]" (rota não registrada no Stack → `Stack.Screen name="nota/[id]" headerShown:false`).

### Q1 — Contas a pagar (quebrado)
- **Duplicação**: cadastrar UMA conta de internet gerou várias ocorrências. Hipóteses: sync de ocorrências agora roda no bootstrap + ao voltar ao primeiro plano + ao salvar (N3) sem idempotência (falta UNIQUE(bill_id, due_date) / INSERT OR IGNORE), ou geração de meses à frente exibidos como se fossem deste mês. Reproduzir com teste, corrigir na raiz, e criar migração que remove duplicadas já existentes (mantendo a paga, se houver).
- **Não consigo abrir uma conta**: tocar numa conta deve abrir DETALHE (valor, vencimento, recorrência, prioridade, histórico de pagamentos, próximas ocorrências) com ações Editar · Pagar · Arquivar.
- **Não consigo pagar**: fluxo Pagar (sheet: valor pré-preenchido editável, conta debitada, data hoje) funcionando a partir da lista, do detalhe, da Home ("A pagar") e da Agenda.
- **"Pagar 360 para cobrir tudo" incompreensível**: o card do plano precisa explicar em linguagem simples: "Seu saldo (R$ X) paga N de M contas deste mês. Faltam R$ Y para pagar todas." + toque abre a lista ordenada com o que cabe/não cabe. Verificar se o valor está certo (duplicadas inflando?).

### Q2 — Formatação monetária BRL automática em TODOS os inputs de dinheiro
- Máscara estilo banco: digitar só números, preenche da direita (1 → 0,01; 123456 → 1.234,56), prefixo "R$" fixo, teclado numérico, apagar funciona, valor inicial formatado. Um único componente `MoneyInput` em src/shared/ui usado em todo lugar (contas, rendas, lançamentos, pagar, metas, moto). Testes da função de máscara.

### Q3 — Descrições/ajuda
- Toda tela e todo campo não óbvio ganha uma linha de descrição curta (texto muted) dizendo o que é e para que serve (ex.: Prioridade: "Essencial = não pode atrasar (aluguel, luz)"). Seções de Ajustes com subtítulo. EmptyStates explicando o próximo passo.

### Q4 — Agenda: criar eventos e visão por horário (estilo Notion Calendar) + rotina em blocos
- **Visão Dia/Semana em grade de horas** (time grid 00–24h, rolagem até a hora atual, linha "agora"), blocos coloridos posicionados por início/fim, sobreposição lado a lado. Alternar Dia · Semana · Lista.
- **Criar no app**: toque/arrastar num horário vazio cria bloco (título, início/fim, cor, ícone, repetir: nenhum/diário/dias úteis/semanal em dias escolhidos, lembrete). Editar/apagar ao tocar no bloco.
- **Rotina em blocos (time blocking)**: tipos de bloco personalizáveis com cor + ícone do tema do app (Moto/Trabalho, Almoço, Descanso, Estudo, Exercício, Pessoal…), editáveis em Ajustes → Agenda → Tipos de bloco. Blocos recorrentes formam a semana-padrão.
- Eventos do Google/Notion continuam aparecendo (somente leitura), com a cor da agenda de origem; opção de escolher quais calendários mostrar.
- Visual: cores dos tipos tiradas de uma paleta do tema (sem hex solto nas telas — definir paleta em theme.ts), ícones lucide no estilo do app; ilustração no vazio.
