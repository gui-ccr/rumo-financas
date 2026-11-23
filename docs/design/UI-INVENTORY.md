# Inventário Visual — Rumo (App Finanças)

Documento de referência da arquitetura visual, primitivos de UI, mapeamento completo de rotas, inventário de débitos visuais (cores hardcoded e estilos inline) e funcionamento do sistema de temas (dark/light mode).

---

## 1. Primitivos de `src/shared/ui`

Resumo dos componentes base da camada de design system compartilhada, suas propriedades, variantes e contagem de uso na aplicação (excluindo arquivos de definição interna).

| Primitivo | Arquivo de Origem | Props / Variantes | Onde Usado (Contagem) |
|---|---|---|---|
| **Button** | `src/shared/ui/button.tsx` | **Props:** `className`, `variant`, `size`, `loading`, `haptic`, `disabled`, `onPress`, `children`<br>**Variantes:** `variant`: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`<br>`size`: `default` (h-11), `sm` (h-9), `lg` (h-12), `icon` (h-10 w-10) | **10 arquivos** (42 refs / 14 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `bills-screen.tsx`<br>• `pay-bill-sheet.tsx`<br>• `invoice-screen.tsx`<br>• `pay-invoice-sheet.tsx`<br>• `moto-screen.tsx`<br>• `edit-transaction-screen.tsx`<br>• `new-transaction-screen.tsx` |
| **Text** | `src/shared/ui/text.tsx` | **Props:** `variant`, `asChild`, `className`, RN Text props<br>**Variantes:** `default` (15px body), `title` (24px bold), `heading` (17px bold), `section` (13px semibold muted), `label` (13px semibold), `muted` (13px regular muted), `caption` (12px regular muted) | **23 arquivos** (151 refs / 63 JSX): presente em todas as telas, formulários e componentes visuais do app |
| **Input** | `src/shared/ui/input.tsx` | **Props:** `TextInputProps` (`className`, `onFocus`, `onBlur`, `editable`, etc.)<br>**Estados:** focus ring com `border-accent`, desfoque com `border-input`, desabilitado `opacity-50` | **6 arquivos** (12 refs / 6 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `transactions-screen.tsx`<br>• `edit-transaction-screen.tsx`<br>• `new-transaction-screen.tsx` |
| **MoneyInput** | `src/shared/ui/money-input.tsx` | **Props:** `value` (number \| null em centavos), `onChange` (cents => void), `placeholder`, `autoFocus`<br>**Visual:** Prefixo "R$", formatação BRL, dígitos tabulares | **4 arquivos** (8 refs / 4 JSX):<br>• `account-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `pay-bill-sheet.tsx`<br>• `pay-invoice-sheet.tsx` |
| **Money** | `src/shared/ui/money.tsx` | **Props:** `cents` (number), `tone` (`default`, `income`, `expense`, `muted`, `onBrand`), `size` (`sm`, `md`, `lg`, `xl`), `sign` (boolean)<br>**Visual:** Formatação BRL tabular-nums, centavos reduzidos em `md`/`lg`/`xl` | **14 arquivos** (37 refs / 23 JSX):<br>• `balance-panel.tsx`<br>• `spend-breakdown.tsx`<br>• `moto-snapshot.tsx`<br>• `occurrence-row.tsx`<br>• `transaction-row.tsx`<br>• `bills-screen.tsx`<br>• `invoice-screen.tsx`<br>• `moto-screen.tsx`<br>• `transactions-screen.tsx`<br>• `settings-screen.tsx`<br>• `new-transaction-screen.tsx`<br>• `edit-transaction-screen.tsx`<br>• `pay-bill-sheet.tsx` |
| **CategoryBadge** | `src/shared/ui/category-badge.tsx` | **Props:** `icon` (string), `color` (string), `size` (`sm`, `md`, `lg`), `className`<br>**Visual:** Fundo tint com opacidade `${color}24`, bordas contínuas, ícone Lucide | **7 arquivos** (15 refs / 8 JSX):<br>• `category-form-screen.tsx`<br>• `settings-screen.tsx`<br>• `occurrence-row.tsx`<br>• `pay-bill-sheet.tsx`<br>• `moto-screen.tsx`<br>• `category-picker.tsx`<br>• `transaction-row.tsx` |
| **IconTile** | `src/shared/ui/category-badge.tsx` | **Props:** `children` (ReactNode), `size` (`sm`, `md`, `lg`), `className`<br>**Visual:** Footprint idêntico a `CategoryBadge`, fundo `bg-muted` neutro | **6 arquivos** (30 refs / 11 JSX):<br>• `moto-snapshot.tsx`<br>• `occurrence-row.tsx`<br>• `bills-screen.tsx`<br>• `pay-invoice-sheet.tsx`<br>• `settings-screen.tsx`<br>• `transaction-row.tsx` |
| **CategoryGlyph** | `src/shared/ui/icon.tsx` | **Props:** `name` (string), `LucideProps` (`size`, `color`, `strokeWidth`)<br>**Catálogo:** 43 ícones Lucide mapeados em `CATEGORY_ICONS` | **1 arquivo** (usado internamente em `CategoryBadge`; e `CATEGORY_ICON_KEYS` em `category-form-screen.tsx`) |
| **ListSection** | `src/shared/ui/list.tsx` | **Props:** `title` (string), `action` (ReactNode), `children` (ReactNode), `className`<br>**Visual:** Agrupador de linhas em superfície `bg-card` com divisores hairline e recuo | **6 arquivos** (32 refs / 13 JSX):<br>• `home-screen.tsx`<br>• `bills-screen.tsx`<br>• `invoice-screen.tsx`<br>• `moto-screen.tsx`<br>• `transactions-screen.tsx`<br>• `settings-screen.tsx` |
| **ListRow** | `src/shared/ui/list.tsx` | **Props:** `leading`, `title`, `subtitle`, `trailing`, `onPress`, `accessibilityLabel`<br>**Visual:** Linha agrupada min-h-[56px] com toque interativo `active:bg-muted` | **5 arquivos** (16 refs / 10 JSX):<br>• `bills-screen.tsx`<br>• `invoice-screen.tsx`<br>• `moto-screen.tsx`<br>• `settings-screen.tsx`<br>• `occurrence-row.tsx`<br>• `transaction-row.tsx` |
| **SectionLink** | `src/shared/ui/list.tsx` | **Props:** `label` (string), `onPress` (() => void)<br>**Visual:** Link textual de ação em cabeçalho de seção (ex.: "Ver todos") | **1 arquivo** (3 refs / 2 JSX):<br>• `home-screen.tsx` |
| **Screen** | `src/shared/ui/screen.tsx` | **Props:** `title`, `header`, `actions`, `children`, `onRefresh`, `refreshing`, `contentClassName`<br>**Visual:** Shell de abas com scroll, pull-to-refresh e safe area top/bottom | **4 telas principais** (27 refs / 4 JSX):<br>• `home-screen.tsx`<br>• `transactions-screen.tsx`<br>• `bills-screen.tsx`<br>• `moto-screen.tsx` |
| **HeaderIconButton** | `src/shared/ui/screen.tsx` | **Props:** `onPress`, `label`, `children`<br>**Visual:** Botão de ícone 40×40 (44px hit slop) para ações de cabeçalho | **2 arquivos** (6 refs / 2 JSX):<br>• `home-screen.tsx` (Ajustes)<br>• `bills-screen.tsx` (Nova conta) |
| **ModalHeader** | `src/shared/ui/modal-header.tsx` | **Props:** `title` (string), `right` (ReactNode), `children` (ReactNode)<br>**Visual:** Cabeçalho com botão fechar (X), título ou custom content e safe area top | **5 telas modais** (14 refs / 5 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `edit-transaction-screen.tsx`<br>• `new-transaction-screen.tsx` |
| **Segmented** | `src/shared/ui/segmented.tsx` | **Props:** `options` (`{ value, label }[]`), `value`, `onChange`, `className`<br>**Visual:** Controle segmentado com polegar animado via Reanimated (`motion.fast`) e háptico | **6 arquivos** (12 refs / 6 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `moto-screen.tsx`<br>• `new-transaction-screen.tsx`<br>• `transactions-screen.tsx` |
| **Surface** | `src/shared/ui/surface.tsx` | **Props:** `tone` (`plain`, `raised`, `brand`), `className`, `children`, `style`, ViewProps<br>**Visual:** `plain` (card sólido), `raised` (gradiente top-lit cardTop/cardBottom + sombra), `brand` (gradiente índigo com highlight hairline em dark mode) | **2 arquivos** (6 refs / 2 JSX):<br>• `balance-panel.tsx` (tone="brand")<br>• `bills-screen.tsx` (tone="raised") |
| **Pill** | `src/shared/ui/surface.tsx` | **Props:** `label` (string), `tone` (`neutral`, `income`, `expense`, `warning`, `accent`), `className`<br>**Visual:** Chip compacto h-6 arredondado com fundo suave e texto semântico | **4 arquivos** (8 refs / 4 JSX):<br>• `balance-panel.tsx`<br>• `bills-screen.tsx`<br>• `occurrence-row.tsx`<br>• `invoice-tone.ts` |
| **EmptyState** | `src/shared/ui/feedback.tsx` | **Props:** `icon` (LucideIcon), `title`, `description`, `action`, `className`<br>**Visual:** Card centralizado informativo para coleções ou buscas vazias | **5 arquivos** (11 refs / 5 JSX):<br>• `home-screen.tsx`<br>• `transactions-screen.tsx`<br>• `bills-screen.tsx`<br>• `invoice-screen.tsx`<br>• `moto-screen.tsx` |
| **Skeleton** | `src/shared/ui/feedback.tsx` | **Props:** `className`<br>**Visual:** Bloco `bg-muted` para transições de primeiro carregamento | **9 arquivos** (23 refs / 13 JSX):<br>• Em todas as telas com queries assíncronas do TanStack Query |
| **ErrorNote** | `src/shared/ui/feedback.tsx` | **Props:** `message` (string \| null \| undefined)<br>**Visual:** Alerta `bg-destructive/10 text-destructive` com acessibilidade viva polida | **8 arquivos** (17 refs / 9 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx`<br>• `settings-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `pay-bill-sheet.tsx`<br>• `pay-invoice-sheet.tsx`<br>• `edit-transaction-screen.tsx`<br>• `new-transaction-screen.tsx` |
| **Field** | `src/shared/ui/form.tsx` | **Props:** `label`, `hint`, `children`<br>**Visual:** Agrupador de formulário com rótulo semibold e texto de dica auxiliar | **5 arquivos** (43 refs / 19 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `pay-bill-sheet.tsx`<br>• `pay-invoice-sheet.tsx` |
| **NumberStepper** | `src/shared/ui/form.tsx` | **Props:** `value`, `onChange`, `min`, `max`, `format`, `label`<br>**Visual:** Stepper horizontal [- Valor +] para números pequenos (dia de vencimento/fechamento) | **2 arquivos** (5 refs / 3 JSX):<br>• `account-form-screen.tsx`<br>• `bill-form-screen.tsx` |
| **Chip** | `src/shared/ui/form.tsx` | **Props:** `label`, `selected`, `onPress`, `leading`, `color`<br>**Visual:** Botão estilo chip selecionável com dot de cor opcional | **4 arquivos** (8 refs / 4 JSX):<br>• `category-form-screen.tsx`<br>• `bill-form-screen.tsx`<br>• `invoice-screen.tsx`<br>• `pickers.tsx` |
| **MonthSwitcher** | `src/shared/ui/month-switcher.tsx` | **Props:** `month` ("YYYY-MM"), `onChange`<br>**Visual:** Stepper de mês com setas laterais e botão central de reset para o mês atual | **4 arquivos** (8 refs / 4 JSX):<br>• `home-screen.tsx`<br>• `transactions-screen.tsx`<br>• `bills-screen.tsx`<br>• `bill-form-screen.tsx` |
| **SwatchPicker** | `src/shared/ui/swatches.tsx` | **Props:** `value` (hex), `onChange`<br>**Visual:** Grid de 12 amostras de cor com ícone Check na selecionada | **2 arquivos** (4 refs / 2 JSX):<br>• `account-form-screen.tsx`<br>• `category-form-screen.tsx` |
| **RumoLogo** / **RumoMark** | `src/shared/ui/brand.tsx` | **Props:** `RumoMark` (`size`: number), `RumoLogo` (sem props)<br>**Visual:** Marca gráfica vetorial (SVG) do "R" e logo tipográfico da marca | **1 arquivo** (2 refs / 1 JSX):<br>• `home-screen.tsx` |
| **Sheet** / **SheetScrollView** / **SheetTextInput** | `src/shared/ui/sheet.tsx` | **Props:** `snapPoints`, `enableDynamicSizing`, `title`, `children`, `ref` (`SheetRef`: `present`, `dismiss`)<br>**Visual:** Bottom sheet imperativo construído sobre `@gorhom/bottom-sheet` | **0 arquivos** no app (débito / oportunidade: telas de formulário e pagamento usam rotas modais/formSheet ao invés deste primitivo) |

---

## 2. Inventário por Rota (`src/app/**`)

Mapeamento completo de todas as 13 rotas do app, seus arquivos de implementação real, blocos visuais e primitivos utilizados.

### 2.1. Navegação Base e Layouts
* **Layout Raiz:** `src/app/_layout.tsx`
  * **Blocos:** `GestureHandlerRootView`, `BottomSheetModalProvider`, `ThemeProvider` (`useNavTheme()`), `SQLiteProvider` (migrações automáticas), `QueryClientProvider`, `ContainerProvider`, `StatusBar`, Stack de rotas e `PortalHost`.
  * **Primitivos:** `useThemeColors`, `useIsDark`, `useNavTheme`, `applyStoredThemePreference`.
* **Layout das Abas:** `src/app/(tabs)/_layout.tsx`
  * **Tela Real:** `src/core/navigation/tab-bar.tsx` (`TabBar`)
  * **Blocos:** Barra de navegação inferior com 4 destinos (`Início`, `Lançamentos`, `Contas`, `Moto`), indicador de rota ativa com dot de destaque e botão flutuante central (+) para novo lançamento.
  * **Primitivos:** `Text`, `cn`, `useThemeColors`, `useIsDark`, `elevation`.

---

### 2.2. Telas Principais (Tabs)

#### 1. Rota: `(tabs)/index` (`src/app/(tabs)/index.tsx`)
* **Arquivo Real:** `src/features/dashboard/presentation/screens/home-screen.tsx` (`HomeScreen`)
* **Blocos Visuais:**
  * **Header:** Logo oficial `RumoLogo` à esquerda e botão de atalho para Ajustes (`HeaderIconButton` + `Settings`) à direita.
  * **Controle de Mês:** Linha com título de seção "Resumo do mês" e `MonthSwitcher`.
  * **Painel de Saldo (`BalancePanel`):** Superfície `Surface tone="brand"` destacando Saldo Disponível (`Money size="xl"`), faturas em aberto e grade de 3 colunas (Entradas, Saídas, Resultado do mês).
  * **Ações Rápidas (`QuickActions`):** 4 cartões com toque tátil para lançamento direto (`Gasto`, `Entrada`, `Transferir`, `Conta`).
  * **Vence em Breve:** `ListSection` com lista mista de faturas de cartão (`InvoiceRow`) e contas recorrentes (`OccurrenceRow`), ou card neutro de aviso quando não há vencimentos em 7 dias.
  * **Resumo da Moto (`MotoSnapshot`):** Card clicável exibindo o lucro semanal da moto e dias rodados, com link para `/moto`.
  * **Distribuição de Gastos (`SpendBreakdown`):** Seção "Para onde foi" com barra horizontal proporcional animada (`Animated.View`) e legenda de fatias por categoria com percentuais e valores.
  * **Últimos Lançamentos:** `ListSection` com as 5 transações mais recentes (`TransactionRow`) e link "Ver todos", ou `EmptyState` com ícone de carteira.
* **Primitivos Usados:** `Screen`, `HeaderIconButton`, `RumoLogo`, `Text`, `MonthSwitcher`, `Skeleton`, `ListSection`, `SectionLink`, `EmptyState`, `Surface`, `Money`, `Pill`, `IconTile`, `CategoryBadge`, `ListRow`.

#### 2. Rota: `(tabs)/lancamentos` (`src/app/(tabs)/lancamentos.tsx`)
* **Arquivo Real:** `src/features/transactions/presentation/screens/transactions-screen.tsx` (`TransactionsScreen`)
* **Blocos Visuais:**
  * **Header:** Título "Lançamentos" e seletor `MonthSwitcher` no topo.
  * **Barra de Busca e Filtros:** Input de busca textual com ícone de lupa e controle segmentado (`Segmented`: 'Tudo', 'Saídas', 'Entradas').
  * **Painel de Totais:** Cartão bipartido com totais consolidados de Entradas (verde) e Saídas para o período/filtro selecionado.
  * **Lista Cronológica Agrupada:** Transações agrupadas por dia (`ListSection` por data com total líquido do dia no cabeçalho e `TransactionRow` para cada item).
  * **Estados Vazios e Carregamento:** `Skeleton` duplo para carregamento inicial e `EmptyState` com sugestão quando nenhum lançamento é encontrado.
* **Primitivos Usados:** `Screen`, `MonthSwitcher`, `Input`, `Segmented`, `Skeleton`, `ListSection`, `Money`, `Text`, `EmptyState`, `TransactionRow`, `CategoryBadge`, `IconTile`, `ListRow`.

#### 3. Rota: `(tabs)/contas` (`src/app/(tabs)/contas.tsx`)
* **Arquivo Real:** `src/features/bills/presentation/screens/bills-screen.tsx` (`BillsScreen`)
* **Blocos Visuais:**
  * **Header:** Título "Contas", `MonthSwitcher` e botão de ação `HeaderIconButton` (+) para cadastrar nova conta.
  * **Card de Totais (`Surface tone="raised"`):** Resumo bipartido com "Falta pagar" (com contador em destaque de contas atrasadas) e "Já pago".
  * **Seção "Atrasadas":** `ListSection` destacando em vermelho faturas e contas com vencimento expirado (`InvoiceRow` e `OccurrenceRow`).
  * **Seção "A vencer":** `ListSection` com contas pendentes no prazo.
  * **Seção "Pagas":** `ListSection` com contas já liquidadas no mês.
  * **Seção "Cartões":** `ListSection` listando cada cartão de crédito, fatura aberta e data de fechamento.
  * **Empty State:** `EmptyState` com botão de ação rápida para cadastrar contas recorrentes.
* **Primitivos Usados:** `Screen`, `MonthSwitcher`, `HeaderIconButton`, `Money`, `Text`, `Skeleton`, `ListSection`, `EmptyState`, `Button`, `ListRow`, `IconTile`, `CategoryBadge`, `Surface`, `Pill`.

#### 4. Rota: `(tabs)/moto` (`src/app/(tabs)/moto.tsx`)
* **Arquivo Real:** `src/features/moto/presentation/screens/moto-screen.tsx` (`MotoScreen`)
* **Blocos Visuais:**
  * **Header:** Título "Moto" com pull-to-refresh.
  * **Seletor de Período:** `Segmented` com 3 opções ('Dia', 'Semana', 'Mês').
  * **Card de Lucro e Estatísticas:** Card com lucro líquido em destaque (`Money size="lg"`), total de ganhos, total de custos e métrica "Por dia rodado".
  * **Botões de Ação Rápida:** Par de botões (`Button variant="secondary"` para "Registrar ganho" e `Button variant="outline"` para "Registrar custo"), pré-selecionando o grupo 'moto'.
  * **Gráfico de Barras Diário (`DailyBars`):** Gráfico customizado com barras verticais animadas via Reanimated (vermelho para dias deficitários e primary para lucrativos) e dias da semana.
  * **Listas de Composição:** `ListSection` para "Ganhos por app" (iFood, Uber, etc.) e "Custos da moto" (Combustível, Manutenção, etc.) com percentuais e valores.
  * **Empty State:** `EmptyState` com ícone de moto quando o período não possui corridas.
* **Primitivos Usados:** `Screen`, `Segmented`, `Skeleton`, `Text`, `Money`, `Button`, `DailyBars`, `ListSection`, `ListRow`, `CategoryBadge`, `EmptyState`.

---

### 2.3. Configurações e Ajustes

#### 5. Rota: `ajustes` (`src/app/ajustes.tsx`)
* **Arquivo Real:** `src/features/accounts/presentation/screens/settings-screen.tsx` (`SettingsScreen`)
* **Blocos Visuais:**
  * **Lista de Contas e Cartões:** `ListSection` com saldo atual de cada conta/cartão, ícone correspondente ao tipo (`checking`, `credit_card`, `cash`) e linha para "Adicionar conta ou cartão".
  * **Listas de Categorias por Grupo:** Seções independentes para cada grupo de categorias ('Moto', 'Dev', 'Casa', 'Pessoal') com badge visual e indicação de Gasto/Entrada, mais linha "Nova categoria".
  * **Gestão de Backup:** `ListSection` com linhas de ação para "Exportar backup" (gera arquivo JSON) e "Restaurar backup" (com diálogo nativo de confirmação).
  * **Tratamento de Erros e Notas:** `ErrorNote` para falhas de I/O de backup e legenda informativa sobre privacidade dos dados locais.
* **Primitivos Usados:** `ListSection`, `ListRow`, `IconTile`, `CategoryBadge`, `Money`, `Text`, `ErrorNote`.

#### 6. Rota: `ajustes/conta/[id]` (`src/app/ajustes/conta/[id].tsx`)
* **Arquivo Real:** `src/features/accounts/presentation/screens/account-form-screen.tsx` (`AccountFormScreen`)
* **Modo de Apresentação:** Modal em tela cheia (`presentation: 'modal'`).
* **Blocos Visuais:**
  * **Header:** `ModalHeader` ("Nova conta" / "Editar conta").
  * **Tipo de Conta:** `Segmented` ('Banco', 'Cartão', 'Dinheiro').
  * **Campos:** `Field` + `Input` de nome, `NumberStepper` para dia de fechamento e dia de vencimento (apenas cartão), ou `MoneyInput` para saldo inicial (banco/dinheiro).
  * **Paleta de Cor:** `Field` + seletor `SwatchPicker`.
  * **Ação Destrutiva:** Botão `Button variant="ghost"` para arquivar conta existente.
  * **Barra Fixada Inferior:** Botão principal `Button size="lg"` com indicador de loading e `ErrorNote`.
* **Primitivos Usados:** `ModalHeader`, `Segmented`, `Field`, `Input`, `NumberStepper`, `MoneyInput`, `SwatchPicker`, `Button`, `ErrorNote`, `Text`.

#### 7. Rota: `ajustes/categoria/[id]` (`src/app/ajustes/categoria/[id].tsx`)
* **Arquivo Real:** `src/features/accounts/presentation/screens/category-form-screen.tsx` (`CategoryFormScreen`)
* **Modo de Apresentação:** Modal em tela cheia (`presentation: 'modal'`).
* **Blocos Visuais:**
  * **Header:** `ModalHeader` ("Nova categoria" / "Editar categoria").
  * **Preview:** `CategoryBadge size="lg"` em destaque centralizado.
  * **Tipo:** `Segmented` ('Gasto', 'Entrada').
  * **Nome:** `Field` + `Input`.
  * **Grupo:** `Field` com chips seletores (`Chip`: Moto, Dev, Casa, Pessoal).
  * **Seletor de Ícone:** Grid com mais de 40 ícones Lucide interativos (`Pressable` + `CategoryBadge`).
  * **Seletor de Cor:** `SwatchPicker`.
  * **Ação Destrutiva:** Botão `Button variant="ghost"` para arquivar categoria.
  * **Barra Fixada Inferior:** Botão principal `Button size="lg"` e `ErrorNote`.
* **Primitivos Usados:** `ModalHeader`, `CategoryBadge`, `Segmented`, `Field`, `Input`, `Chip`, `SwatchPicker`, `Button`, `ErrorNote`, `Text`.

---

### 2.4. Contas a Pagar e Faturas

#### 8. Rota: `conta/[id]` (`src/app/conta/[id].tsx`)
* **Arquivo Real:** `src/features/bills/presentation/screens/bill-form-screen.tsx` (`BillFormScreen`)
* **Modo de Apresentação:** Modal em tela cheia (`presentation: 'modal'`).
* **Blocos Visuais:**
  * **Header:** `ModalHeader` ("Nova conta" / "Editar conta").
  * **Recorrência:** `Segmented` ('Todo mês', 'Só uma vez').
  * **Nome da Conta:** `Field` + `Input`.
  * **Valor:** `Field` + `MoneyInput` e chip "Valor muda todo mês" para desabilitar valor fixo.
  * **Vencimento:** `Field` + `NumberStepper` (dia 1 a 31).
  * **Início:** `Field` + `MonthSwitcher` para mês de início.
  * **Seletores Horizontais:** `CategoryPicker` e `AccountPicker` ("Costuma pagar com").
  * **Ação Destrutiva:** `Button variant="ghost"` para remover conta.
  * **Barra Fixada Inferior:** `Button size="lg"` e `ErrorNote`.
* **Primitivos Usados:** `ModalHeader`, `Segmented`, `Field`, `Input`, `MoneyInput`, `Chip`, `NumberStepper`, `MonthSwitcher`, `CategoryPicker`, `AccountPicker`, `Button`, `ErrorNote`, `Text`, `Skeleton`.

#### 9. Rota: `conta/pagar/[id]` (`src/app/conta/pagar/[id].tsx`)
* **Arquivo Real:** `src/features/bills/presentation/screens/pay-bill-sheet.tsx` (`PayBillSheet`)
* **Modo de Apresentação:** `presentation: 'formSheet'` nativo iOS/Android (`sheetAllowedDetents: 'fitToContents'`).
* **Blocos Visuais:**
  * **Cabeçalho:** `CategoryBadge size="lg"`, nome da conta e data de vencimento relativa.
  * **Formulário de Pagamento (Pendente):** `MoneyInput` para valor efetivamente pago, `AccountPicker` horizontal para selecionar de onde saiu o dinheiro, `DateStepper` para data do pagamento, `Button size="lg"` "Marcar como paga" e botão de atalho para "Editar conta".
  * **Visão de Conta Paga:** Card de confirmação verde com `CircleCheck` e `Money tone="income"`, botão `Button variant="outline"` para "Desfazer pagamento" e texto de aviso.
* **Primitivos Usados:** `CategoryBadge`, `Text`, `Field`, `MoneyInput`, `AccountPicker`, `DateStepper`, `ErrorNote`, `Button`, `Money`, `Skeleton`.

#### 10. Rota: `fatura/[cardId]` (`src/app/fatura/[cardId].tsx`)
* **Arquivo Real:** `src/features/cards/presentation/screens/invoice-screen.tsx` (`InvoiceScreen`)
* **Modo de Apresentação:** Stack screen padrão com título dinâmico do cartão no header.
* **Blocos Visuais:**
  * **Timeline de Meses:** Carrossel horizontal de chips (`Chip`) com os meses das faturas (aberta, fechadas e futuras).
  * **Card Resumo da Fatura (`InvoiceSummary`):** Cabeçalho com mês e badge `Pill` de status (Aberta, Fechada, Paga), valor total em destaque (`Money size="lg"`), datas de fechamento e vencimento, total já pago e botão de ação `Button` "Pagar fatura".
  * **Lista de Compras da Fatura (`InvoiceTransactions`):** `ListSection` "Compras e pagamentos" com cada transação (`TransactionRow`) ou `EmptyState`.
* **Primitivos Usados:** `Chip`, `Text`, `Money`, `Button`, `ListSection`, `TransactionRow`, `EmptyState`, `Skeleton`, `Pill`.

#### 11. Rota: `fatura/pagar` (`src/app/fatura/pagar.tsx`)
* **Arquivo Real:** `src/features/cards/presentation/screens/pay-invoice-sheet.tsx` (`PayInvoiceSheet`)
* **Modo de Apresentação:** `presentation: 'formSheet'` nativo (`sheetAllowedDetents: 'fitToContents'`).
* **Blocos Visuais:**
  * **Cabeçalho:** `IconTile size="lg"` com ícone `CreditCard` na cor do cartão, título com nome do cartão e mês da fatura.
  * **Valor do Pagamento:** `Field` + `MoneyInput` com hint explicando a possibilidade de pagamento parcial.
  * **Conta Pagadora:** `Field` + `AccountPicker` filtrado apenas para contas com saldo real (ignora outros cartões de crédito).
  * **Data:** `DateStepper` para data do pagamento.
  * **Confirmação:** Botão principal `Button size="lg"` "Pagar fatura" e `ErrorNote`.
* **Primitivos Usados:** `IconTile`, `Text`, `Field`, `MoneyInput`, `AccountPicker`, `DateStepper`, `ErrorNote`, `Button`, `Skeleton`.

---

### 2.5. Lançamentos

#### 12. Rota: `lancamento/novo` (`src/app/lancamento/novo.tsx`)
* **Arquivo Real:** `src/features/transactions/presentation/screens/new-transaction-screen.tsx` (`NewTransactionScreen`)
* **Modo de Apresentação:** Modal em tela cheia (`presentation: 'modal'`).
* **Blocos Visuais:**
  * **Header:** `ModalHeader` contendo `Segmented` para alternar tipo ('Gasto', 'Entrada', 'Transferir').
  * **Display de Valor Animado:** `Money size="xl"` centralizado com micro-interação de pop-scale (`Animated.View` via Reanimated) a cada dígito digitado.
  * **Seletores de Conta:** `AccountPicker` ("Pago com" / "Entrou em" / "Sai de") e, em transferências, segundo picker ("Vai para").
  * **Seletor de Categoria:** `CategoryPicker` em grade horizontal de 2 linhas, ordenando categorias mais frequentes primeiro (e priorizando o grupo focado caso acionado via Moto).
  * **Controles Auxiliares:** `DateStepper` de dia e `InstallmentStepper` (caso a conta selecionada seja cartão de crédito).
  * **Descrição:** `Input` opcional de texto livre.
  * **Teclado Numérico Fixo:** `AmountKeypad` estilo caixa registradora (os centavos entram da direita para a esquerda) com tecla "00" e tecla de backspace com toque longo para zerar.
  * **Rodapé:** Botão principal `Button size="lg"` ("Salvar gasto", "Salvar entrada", etc.) e `ErrorNote`.
* **Primitivos Usados:** `ModalHeader`, `Segmented`, `Money`, `Text`, `AccountPicker`, `CategoryPicker`, `DateStepper`, `InstallmentStepper`, `Input`, `AmountKeypad`, `ErrorNote`, `Button`.

#### 13. Rota: `lancamento/[id]` (`src/app/lancamento/[id].tsx`)
* **Arquivo Real:** `src/features/transactions/presentation/screens/edit-transaction-screen.tsx` (`EditTransactionScreen`)
* **Modo de Apresentação:** Modal em tela cheia (`presentation: 'modal'`).
* **Blocos Visuais:**
  * **Header:** `ModalHeader` com título do tipo de lançamento e botão à direita com ícone `Trash` (vermelho de exclusão, com confirmação específica caso faça parte de parcelamento).
  * **Display de Valor:** `Money size="xl"` com subtítulo de indicador de parcela caso aplicável.
  * **Seletores de Conta e Categoria:** `AccountPicker` e `CategoryPicker`.
  * **Data e Descrição:** `DateStepper` e `Input`.
  * **Teclado Numérico Fixo:** `AmountKeypad` sincronizado com o valor editado.
  * **Rodapé:** `Button size="lg"` "Salvar alterações" e `ErrorNote`.
* **Primitivos Usados:** `ModalHeader`, `Money`, `Text`, `AccountPicker`, `CategoryPicker`, `DateStepper`, `Input`, `AmountKeypad`, `ErrorNote`, `Button`, `Skeleton`.

---

## 3. Débito Visual

Inventário detalhado com arquivo:linha de todas as cores literais (hex/rgb/rgba), estilos inline relevantes, e análise de formulários em modal que deveriam migrar para bottom sheets.

### 3.1. Cores Hardcoded (Hex e RGB/RGBA) com `arquivo:linha`

#### A. Telas e Componentes de Apresentação (`src/features/**`)
* `src/features/accounts/presentation/screens/account-form-screen.tsx:33` → `#7C83FD` (cor padrão de fallback do estado inicial da conta)
* `src/features/accounts/presentation/screens/category-form-screen.tsx:39` → `#7C83FD` (cor padrão de fallback do estado inicial da categoria)

#### B. Componentes do Design System (`src/shared/ui/**`)
* `src/shared/ui/surface.tsx:37` → `#3745AF` e `#34449E` (cores de gradiente para `tone="brand"` em dark e light mode)
* `src/shared/ui/swatches.tsx:10-21` → 12 cores literais no array `SWATCHES`:
  * `src/shared/ui/swatches.tsx:10` → `#2B3A8C`
  * `src/shared/ui/swatches.tsx:11` → `#4F5BD5`
  * `src/shared/ui/swatches.tsx:12` → `#7C83FD`
  * `src/shared/ui/swatches.tsx:13` → `#3E7CB1`
  * `src/shared/ui/swatches.tsx:14` → `#2E8C88`
  * `src/shared/ui/swatches.tsx:15` → `#3F8F63`
  * `src/shared/ui/swatches.tsx:16` → `#9A8A3A`
  * `src/shared/ui/swatches.tsx:17` → `#B7862B`
  * `src/shared/ui/swatches.tsx:18` → `#C07A3D`
  * `src/shared/ui/swatches.tsx:19` → `#B4505E`
  * `src/shared/ui/swatches.tsx:20` → `#8A5DB0`
  * `src/shared/ui/swatches.tsx:21` → `#5E6A85`
* `src/shared/ui/swatches.tsx:41` → `#FFFFFF` (cor do ícone `Check` sobre a amostra selecionada)
* `src/shared/ui/theme.ts:9-14` → Cores literais no objeto estático `palette` da marca:
  * `src/shared/ui/theme.ts:9` → `#141B3A` (`navy`)
  * `src/shared/ui/theme.ts:10` → `#2B3A8C` (`indigo`)
  * `src/shared/ui/theme.ts:11` → `#7C83FD` (`periwinkle`)
  * `src/shared/ui/theme.ts:12` → `#C7D2FE` (`lavender`)
  * `src/shared/ui/theme.ts:13` → `#F5F6FF` (`snow`)
  * `src/shared/ui/theme.ts:14` → `#121212` (`ink`)
* `src/shared/ui/theme.ts:18-36` → 17 cores literais no tema `LIGHT`:
  * `src/shared/ui/theme.ts:18` → `#FFFFFF` (`background`)
  * `src/shared/ui/theme.ts:19` → `#121212` (`foreground`)
  * `src/shared/ui/theme.ts:20` → `#F2F2F4` (`card`)
  * `src/shared/ui/theme.ts:21` → `#FBFBFC` (`cardTop`)
  * `src/shared/ui/theme.ts:22` → `#EDEDF0` (`cardBottom`)
  * `src/shared/ui/theme.ts:25` → `#ECEEFF` (`secondary`)
  * `src/shared/ui/theme.ts:26` → `#F2F2F4` (`muted`)
  * `src/shared/ui/theme.ts:27` → `#6E6E73` (`mutedForeground`)
  * `src/shared/ui/theme.ts:28` → `#4C55E0` (`accent`)
  * `src/shared/ui/theme.ts:29` → `#FFFFFF` (`accentForeground`)
  * `src/shared/ui/theme.ts:30` → `#E4E4E8` (`border`)
  * `src/shared/ui/theme.ts:31` → `#B8B8BC` (`iconMuted`)
  * `src/shared/ui/theme.ts:32` → `#D9D9D9` (`track`)
  * `src/shared/ui/theme.ts:33` → `#16803C` (`income`)
  * `src/shared/ui/theme.ts:34` → `#D93036` (`expense`)
  * `src/shared/ui/theme.ts:35` → `#B26716` (`warning`)
  * `src/shared/ui/theme.ts:36` → `#121212` (`scrim`)
* `src/shared/ui/theme.ts:42-60` → 16 cores literais no tema `DARK`:
  * `src/shared/ui/theme.ts:42` → `#121212` (`background`)
  * `src/shared/ui/theme.ts:43` → `#F5F5F5` (`foreground`)
  * `src/shared/ui/theme.ts:44` → `#1D1D1F` (`card`)
  * `src/shared/ui/theme.ts:45` → `#2C2C2F` (`cardTop`)
  * `src/shared/ui/theme.ts:46` → `#1D1D1F` (`cardBottom`)
  * `src/shared/ui/theme.ts:47` → `#3745AF` (`primary`)
  * `src/shared/ui/theme.ts:49` → `#1E2142` (`secondary`)
  * `src/shared/ui/theme.ts:50` → `#2A2A2D` (`muted`)
  * `src/shared/ui/theme.ts:51` → `#8E8E93` (`mutedForeground`)
  * `src/shared/ui/theme.ts:53` → `#121212` (`accentForeground`)
  * `src/shared/ui/theme.ts:54` → `#2E2E31` (`border`)
  * `src/shared/ui/theme.ts:55` → `#6B6B70` (`iconMuted`)
  * `src/shared/ui/theme.ts:56` → `#3D3D3D` (`track`)
  * `src/shared/ui/theme.ts:57` → `#5FD38A` (`income`)
  * `src/shared/ui/theme.ts:58` → `#FF6B6B` (`expense`)
  * `src/shared/ui/theme.ts:59` → `#F0A04B` (`warning`)
  * `src/shared/ui/theme.ts:60` → `#000000` (`scrim`)
* `src/shared/ui/theme.ts:78-79` → Sombra de elevação com alpha em light mode:
  * `src/shared/ui/theme.ts:78` → `boxShadow: '0 8px 24px rgba(18, 18, 18, 0.08)'`
  * `src/shared/ui/theme.ts:79` → `boxShadow: '0 -6px 18px rgba(18, 18, 18, 0.06)'`

#### C. Configuração e Infraestrutura
* `tailwind.config.js:33-39` → Cores literais de marca no tema Tailwind:
  * `tailwind.config.js:33` → `#141B3A` (`navy`)
  * `tailwind.config.js:34` → `#2B3A8C` (`indigo`)
  * `tailwind.config.js:35` → `#7C83FD` (`periwinkle`)
  * `tailwind.config.js:36` → `#C7D2FE` (`lavender`)
  * `tailwind.config.js:37` → `#F5F6FF` (`snow`)
  * `tailwind.config.js:38` → `#121212` (`ink`)
* `src/features/dashboard/domain/month-overview.ts:48` → `#C7D2FE` (fallback de cor de categoria inexistente)
* `src/shared/infrastructure/database/migrations.ts:85-119` → 35 cores literais hex inseridas no seed inicial do SQLite para categorias e contas padrão.
* `src/shared/infrastructure/database/seed.ts:10-64` → 41 cores literais hex em dados de exemplo de desenvolvimento.

---

### 3.2. Estilos Inline (`style={{...}}`) Relevantes com `arquivo:linha`

Total de 37 ocorrências no projeto, categorizadas por motivo técnico:

#### 1. Compensação de Safe Area e Insets Dinâmicos (Padding Bottom / Top)
* `src/app/_layout.tsx:60` → `style={{ flex: 1, backgroundColor: colors.background }}`
* `src/core/navigation/tab-bar.tsx:59` → `style={[{ paddingBottom: Math.max(insets.bottom, 8), height: 68 + Math.max(insets.bottom, 8) }, !dark && { boxShadow: elevation.sheet }]}`
* `src/shared/ui/modal-header.tsx:17` → `style={{ paddingTop: insets.top + 6 }}`
* `src/shared/ui/sheet.tsx:86` → `style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: insets.bottom + space.lg }}`
* `src/shared/ui/sheet.tsx:91` → `style={{ marginBottom: space.md }}`
* `src/features/accounts/presentation/screens/account-form-screen.tsx:102` → `style={{ paddingBottom: insets.bottom + 10 }}`
* `src/features/accounts/presentation/screens/category-form-screen.tsx:108` → `style={{ paddingBottom: insets.bottom + 10 }}`
* `src/features/bills/presentation/screens/bill-form-screen.tsx:151` → `style={{ paddingBottom: insets.bottom + 10 }}`
* `src/features/bills/presentation/screens/pay-bill-sheet.tsx:74` → `style={{ paddingBottom: insets.bottom + 12 }}`
* `src/features/bills/presentation/screens/pay-bill-sheet.tsx:124` → `style={{ paddingBottom: insets.bottom + 12 }}`
* `src/features/cards/presentation/screens/pay-invoice-sheet.tsx:53` → `style={{ paddingBottom: insets.bottom + 12 }}`
* `src/features/transactions/presentation/screens/edit-transaction-screen.tsx:131` → `style={{ paddingBottom: insets.bottom + 8 }}`
* `src/features/transactions/presentation/screens/new-transaction-screen.tsx:178` → `style={{ paddingBottom: insets.bottom + 8 }}`

#### 2. Curvatura Contínua iOS (`borderCurve: 'continuous'`)
* `src/shared/ui/category-badge.tsx:28` → `style={{ backgroundColor: `${color}24`, borderCurve: 'continuous' }}`
* `src/shared/ui/category-badge.tsx:45` → `style={{ borderCurve: 'continuous' }}`
* `src/shared/ui/list.tsx:31` → `style={{ borderCurve: 'continuous' }}`
* `src/shared/ui/surface.tsx:30` → `style={[{ borderCurve: 'continuous' }, style]}`
* `src/shared/ui/surface.tsx:41` → `style={[{ borderCurve: 'continuous' }, !dark && tone === 'raised' ? { boxShadow: elevation.card } : null, style]}`

#### 3. Cores Dinâmicas Baseadas em Dados da Entidade (Conta, Categoria ou Fatia)
* `src/shared/ui/category-badge.tsx:28` → `style={{ backgroundColor: `${color}24`, borderCurve: 'continuous' }}`
* `src/shared/ui/form.tsx:92` → `style={{ backgroundColor: color }}`
* `src/shared/ui/swatches.tsx:40` → `style={{ backgroundColor: c }}`
* `src/features/dashboard/presentation/components/spend-breakdown.tsx:31` → `style={{ backgroundColor: s.color }}`
* `src/features/dashboard/presentation/components/spend-breakdown.tsx:62` → `style={[{ backgroundColor: slice.color, flexBasis: 0 }, style]}`
* `src/features/moto/presentation/components/daily-bars.tsx:66` → `style={[style, { backgroundColor: negative ? colors.expense : colors.primary, borderRadius: rounded }]}`

#### 4. Tipografia Tabular (`fontVariant: ['tabular-nums']`)
* `src/shared/ui/money.tsx:54` → `style={TABULAR}`
* `src/shared/ui/money.tsx:65` → `style={TABULAR}`
* `src/shared/ui/money.tsx:68` → `style={TABULAR}`
* `src/shared/ui/money-input.tsx:50` → `style={{ fontVariant: ['tabular-nums'] }}`
* `src/shared/ui/form.tsx:51` → `style={{ fontVariant: ['tabular-nums'] }}`
* `src/features/transactions/presentation/components/amount-keypad.tsx:35` → `style={{ fontVariant: ['tabular-nums'] }}`

#### 5. Valores Animados e Layout Dinâmico Reanimated
* `src/shared/ui/segmented.tsx:47` → `style={thumb}`
* `src/shared/ui/surface.tsx:43` → `style={{ position: 'absolute', inset: 0 }}`
* `src/features/moto/presentation/components/daily-bars.tsx:32` → `style={{ gap }}`
* `src/features/moto/presentation/components/daily-bars.tsx:37` → `style={{ gap }}`
* `src/features/moto/presentation/components/daily-bars.tsx:64` → `style={{ height: '100%' }}`
* `src/features/transactions/presentation/components/pickers.tsx:64` → `style={{ opacity: isToday ? 0.3 : 1 }}`
* `src/features/transactions/presentation/screens/new-transaction-screen.tsx:136` → `style={amountStyle}`

---

### 3.3. Usos de Modal / Telas de Formulário que Seriam Melhores como Bottom Sheet

Atualmente, o projeto possui 5 rotas configuradas como `presentation: 'modal'` em tela cheia e 2 rotas configuradas com `presentation: 'formSheet'` nativo do Expo Router:

| Rota Atual | Configuração de Navegação (`_layout.tsx`) | Conteúdo do Formulário | Diagnóstico / Por que seria melhor como Bottom Sheet |
|---|---|---|---|
| `ajustes/conta/[id]` | `options={modal}` | Nome, Tipo (3 opções), Dia fechamento/vencimento ou saldo inicial, SwatchPicker | **Candidato prioritário para Bottom Sheet (`Sheet`).** O formulário é extremamente curto (cabe em 50-60% da tela). Apresentar como modal full-screen quebra o contexto da lista de Ajustes. Um sheet dinâmico (`enableDynamicSizing`) é ideal. |
| `ajustes/categoria/[id]` | `options={modal}` | Nome, Tipo (Gasto/Entrada), Grupo (4 chips), Seletor de Ícone (grid), SwatchPicker | **Candidato para Bottom Sheet com snap point alto (75% ou 90%).** Embora tenha o grid de ícones, o formulário é autocontido e não precisa cobrir a tela inteira com animação de slide vertical pesada. |
| `conta/[id]` | `options={modal}` | Nome, Valor, Dia vencimento, Mês inicial, Seletor de Categoria e Conta | **Candidato para Bottom Sheet (70-85%).** Permite cadastrar uma conta rápida enquanto o usuário visualiza a lista de contas ao fundo, reforçando a sensação de ação pontual. |
| `conta/pagar/[id]` | `options={sheet}` (`presentation: 'formSheet'`) | Valor pago, Conta de saída, Data | **Migrar de `formSheet` do Expo Router para o primitivo `Sheet` (`@gorhom/bottom-sheet`).** No iOS, `formSheet` nativo funciona, mas no Android degrada para um modal tradicional de tela cheia. O componente `@/shared/ui/sheet` garante comportamento de bottom sheet idêntico e consistente em ambas as plataformas. |
| `fatura/pagar` | `options={sheet}` (`presentation: 'formSheet'`) | Valor do pagamento, Conta pagadora, Data | **Migrar de `formSheet` para `Sheet`.** Mesma situação de `conta/pagar/[id]`: fluxo rápido de 3 campos que deve abrir como bottom sheet uniforme em Android e iOS. |
| `lancamento/[id]` | `options={modal}` | Valor, Teclado numérico, Categoria, Conta, Data, Descrição, Exclusão | **Manter como Modal ou avaliar sheet com 2 estados.** Como possui o teclado numérico estilo caixa registradora (`AmountKeypad`) fixado na parte inferior, exige altura vertical significativa para não colidir com o teclado virtual caso o campo de descrição seja focado. |
| `lancamento/novo` | `options={modal}` | Teclado numérico + 3 seletores horizontais + display gigante | **Manter como Modal.** O teclado numérico embutido e a densidade de seletores ocupam a altura total da tela, justificando a tela cheia. |

---

## 4. Como o Tema Claro/Escuro é Aplicado Hoje

O sistema de temas do Rumo foi desenhado para ter **Dark como identidade primária** e **Light como alternativo**, funcionando em quatro camadas integradas:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Persistência (expo-sqlite/kv-store: themePreference)      │
│    'dark' (default) | 'light' | 'system'                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Sincronização NativeWind (colorScheme.set / useIsDark)    │
│    Aplica a classe `.dark` no container raiz                 │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ 3. Variáveis CSS (Tailwind)  │ │ 4. Cores JS (useThemeColors) │
│    src/global.css            │ │    src/shared/ui/theme.ts    │
│    :root       (Light HSL)   │ │    LIGHT object              │
│    .dark:root  (Dark HSL)    │ │    DARK object               │
└──────────────────────────────┘ └──────────────────────────────┘
```

### 4.1. Persistência e Preferência (`theme-preference.ts` vs `preferences.ts`)
* **Armazenamento:** A preferência de tema é persistida em `expo-sqlite/kv-store` sob a chave `'themePreference'` através de `src/shared/presentation/theme-preference.ts`.
* **Valores Aceitos:** `'dark'`, `'light'`, `'system'`. O padrão inicial do app é explicitamente `'dark'` (`DEFAULT = 'dark'`).
* **Inicialização:** Antes da montagem das rotas, `src/app/_layout.tsx:29` executa `applyStoredThemePreference()`, que lê o valor armazenado de forma síncrona e executa `colorScheme.set(pref)` do NativeWind.
* **Hook de Consumo:** `useThemePreference()` fornece a tupla `[value, setValue]` para alternância em telas de configurações.
* **Nota sobre `preferences.ts`:** O arquivo `src/shared/presentation/preferences.ts` guarda apenas conveniências de uso frequente (atualmente `useLastAccountId`). A gestão de tema foi modularizada exclusivamente em `theme-preference.ts`.

### 4.2. Ativação via NativeWind e Tailwind (`global.css` e `tailwind.config.js`)
* Em `tailwind.config.js`, está configurado `darkMode: 'class'`. O NativeWind controla dinamicamente a presença da classe `dark` no nó raiz da árvore React Native quando `colorScheme` muda.
* Em `src/global.css`:
  * Bloco `:root` define as variáveis HSL do modo claro: fundo `#FFFFFF` (`0 0% 100%`), texto escuro (`0 0% 7%`), cartões `#F2F2F4` (`240 7% 95%`), bordas `#E4E4E8` (`240 8% 90%`).
  * Bloco `.dark:root` define as variáveis HSL do modo escuro grafite: fundo `#121212` (`0 0% 7%`), texto claro `#F5F5F5` (`0 0% 96%`), cartões `#1D1D1F` (`240 3% 12%`), bordas `#2E2E31` (`240 3% 19%`).
* Os tokens estendidos no Tailwind (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-accent`, etc.) usam a função `hsl(var(--token))`, respondendo instantaneamente à classe `.dark`.

### 4.3. Camada JS-Side (`src/shared/ui/theme.ts`)
* Para elementos que não aceitam classes do Tailwind (props de componentes como `size`/`color` do Lucide, `colors` do React Navigation, gradientes do `expo-linear-gradient` e estilos dinâmicos do Reanimated), existe o espelho JS:
  * Objetos estáticos `LIGHT` e `DARK` tipados por `ThemeColors`.
  * `useIsDark()`: verifica se `colorScheme !== 'light'` via hook do NativeWind.
  * `useThemeColors()`: retorna o objeto `DARK` ou `LIGHT` reativamente conforme o tema ativo.
  * `useNavTheme()`: gera dinamicamente a estrutura de `Theme` do React Navigation (`DarkTheme` ou `DefaultTheme`), eliminando flashes brancos na navegação nativa.
* **Estratégia de Elevação:** Em dark mode, a separação visual de superfícies é feita por contraste tonal (`cardTop`/`cardBottom` e highlight hairline de `bg-white/5` no topo dos cartões). Sombras suaves de elevação (`elevation.card` e `elevation.sheet`) são ativadas exclusivamente em light mode (`!dark && tone === 'raised'`).
