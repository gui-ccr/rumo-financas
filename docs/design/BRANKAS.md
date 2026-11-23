# Brankas — Crypto Wallet UI Kit: design system extraído

Fonte principal: `canvas.fig` do kit "Brankas — Crypto Wallet UI Kit" (Figma, exportado em 2026-11-12, `meta.json`). Extração feita a partir de `docs/design/_raw/` (ignorado pelo git).

**Método.** O `canvas.fig` é um container `fig-kiwi` com dois chunks: schema (deflate-raw) e dados (zstd). Decodifiquei com `kiwi-schema` + `fzstd` + `pako` em script próprio, fora do projeto. Resultado: **19.116 nós** (5.053 TEXT, 6.709 FRAME, 2.740 ROUNDED_RECTANGLE, 2.528 INSTANCE, 1.152 VECTOR, 721 ELLIPSE, 105 SYMBOL, 43 SECTION, 29 VARIABLE).

**Como ler os números.** "usos" = número de nós com aquele preenchimento/traço/texto visível. Não é área. Os valores vêm do arquivo; nada foi estimado.

**Tema escuro vs. claro.** Classificado pelo canvas: `🌙 Screens — Dark` = escuro; `📱 Screens — Light` = claro. As seções F14–F17 têm o mesmo nome nos dois canvas (sem sufixo "· Dark" no canvas escuro, embora as telas dentro delas tenham). Por isso o tema é atribuído pelo canvas, não pelo nome da seção.

---

## 1. Cores

### 1.1 Variáveis nomeadas (fonte de verdade)

Coleção **`Brankas/Color`** com modos `Light` e `Dark`, 29 variáveis. "Usos" = nós que referenciam a variável via alias (claro / escuro).

| Variável | Light | Dark | Usos claro / escuro | Papel |
|---|---|---|---|---|
| `accent/primary` | `#9aef6a` | `#9aef6a` | 23 / 29 | **Accent verde-limão** |
| `bg/base` | `#9aef6a` | `#9aef6a` | 0 / 0 | fundo de marca (sem uso direto) |
| `surface/primary` | `#ffffff` | `#121212` | 181 / 240 | **Fundo de tela / superfície** |
| `surface/avatar` | `#f2f2f4` | `#2a2a2d` | 155 / 200 | superfície de cartão / avatar |
| `surface/chip-up` | `#e4f6ea` | `#16301f` | 19 / 24 | fundo de chip positivo |
| `surface/button` | `#0f3b2d` | `#17503b` | 64 / 75 | **Botão primário** (verde-escuro) |
| `surface/danger` | `#fce8e9` | `#3a1d1f` | 10 / 10 | fundo de erro |
| `surface/scrim` | `#121212` | `#000000` | 7 / 7 | véu de overlay |
| `surface/card-top` | `#fbfbfc` | `#2c2c2f` | 0 / 0 | gradiente de card (topo) |
| `surface/card-bottom` | `#ededf0` | `#1d1d1f` | 0 / 0 | gradiente de card (base) |
| `text/primary` | `#121212` | `#f5f5f5` | 590 / 754 | **Texto primário** |
| `text/secondary` | `#8e8e93` | `#8e8e93` | 442 / 613 | **Texto secundário** |
| `text/on-button` | `#b6f58a` | `#b6f58a` | 16 / 20 | texto sobre botão escuro |
| `text/on-color` | `#121212` | `#121212` | 6 / 6 | texto sobre cor de destaque |
| `text/up` | `#16803c` | `#5fd38a` | 31 / 39 | **Sucesso / alta** |
| `text/chip-up` | `#16803c` | `#5fd38a` | 17 / 19 | texto de chip positivo |
| `text/down` | `#d93036` | `#ff6b6b` | 10 / 10 | **Erro / baixa** |
| `icon/inactive` | `#b8b8bc` | `#6b6b70` | 2 / 2 | ícone inativo |
| `icon/on-primary` | `#0f3b2d` | `#0f3b2d` | 6 / 11 | ícone sobre accent |
| `border/card` | `#e4e4e8` | `#2e2e31` | 0 / 0 | borda de card |
| `border/divider` | `#ebebeb` | `#262626` | 10 / 11 | divisor |
| `track/off` | `#d9d9d9` | `#3d3d3d` | 29 / 29 | trilho de toggle desligado |
| `palette/purple` | `#bdeb9a` | `#bdeb9a` | 0 / 0 | paleta (sem uso) |
| `palette/orange` | `#b3e98c` | `#b3e98c` | 0 / 0 | paleta (sem uso) |
| `palette/pink` | `#cdf1ae` | `#cdf1ae` | 0 / 0 | paleta (sem uso) |
| `palette/violet` | `#d6f4be` | `#d6f4be` | 1 / 1 | paleta |
| `palette/mint` | `#e7e7eb` | `#e7e7eb` | 4 / 4 | paleta |
| `palette/sky` | `#e1f7cf` | `#e1f7cf` | 5 / 5 | paleta |
| `palette/ink` | `#121212` | `#2e2e33` | 13 / 15 | tinta de ícone/traço |

Observação: `bg/base`, `palette/purple/orange/pink` e `surface/card-*` existem mas não são usados como fill sólido. `text/up` e `text/chip-up` têm o mesmo valor, assim como `text/primary` e `text/on-color`.

### 1.2 Top 25 hex por frequência (fills sólidos visíveis, sem variável)

**Tema escuro** (canvas `🌙 Screens — Dark`)

| # | Hex | Usos | Papel |
|---|---|---|---|
| 1 | `#f5f5f5` | 754 | text/primary (dark) |
| 2 | `#8e8e93` | 613 | text/secondary |
| 3 | `#121212` | 252 | surface/primary (dark) |
| 4 | `#2a2a2d` | 200 | surface/avatar (dark) |
| 5 | `#9aef6a` | 144 | accent/primary |
| 6 | `#2e2e33` | 89 | palette/ink |
| 7 | `#ffffff` | 77 | branco (sem variável) |
| 8 | `#17503b` | 75 | surface/button (dark) |
| 9 | `#5fd38a` | 58 | text/up (dark) |
| 10 | `#6fe08a` | 58 | verde (sem variável) |
| 11 | `#f5f5f7` | 53 | quase-branco (sem variável) |
| 12 | `#9a9aa0` | 50 | cinza médio (sem variável) |
| 13 | `#242428` | 43 | superfície alternativa (sem variável) |
| 14 | `#3d3d3d` | 29 | track/off (dark) |
| 15 | `#f2f2f4` | 27 | (sem variável) |
| 16 | `#b6f58a` | 24 | text/on-button |
| 17 | `#16301f` | 24 | surface/chip-up (dark) |
| 18 | `#6fdda8` | 23 | menta (sem variável) |
| 19 | `#2b2b2e` | 17 | (sem variável) |
| 20 | `#262626` | 11 | border/divider (dark) |
| 21 | `#0f3b2d` | 11 | icon/on-primary |
| 22 | `#3a1d1f` | 10 | surface/danger (dark) |
| 23 | `#ff6b6b` | 10 | text/down (dark) |
| 24 | `#1f4a33` | 10 | (sem variável) |
| 25 | `#cfe8d8` | 8 | (sem variável) |

**Tema claro** (canvas `📱 Screens — Light`)

| # | Hex | Usos | Papel |
|---|---|---|---|
| 1 | `#121212` | 646 | text/primary |
| 2 | `#8e8e93` | 461 | text/secondary |
| 3 | `#ffffff` | 272 | surface/primary |
| 4 | `#f2f2f4` | 165 | surface/avatar |
| 5 | `#9aef6a` | 136 | accent/primary |
| 6 | `#0f3b2d` | 70 | surface/button |
| 7 | `#16803c` | 64 | text/up |
| 8 | `#e7e7ed` | 48 | (sem variável) |
| 9 | `#d9d9d9` | 29 | track/off |
| 10 | `#e4f6ea` | 19 | surface/chip-up |
| 11 | `#e8e8ed` | 17 | (sem variável) |
| 12 | `#b6f58a` | 16 | text/on-button |
| 13 | `#eeeef1` | 15 | (sem variável) |
| 14 | `#6fdda8` | 14 | menta (sem variável) |
| 15 | `#ebebeb` | 10 | border/divider |
| 16 | `#fce8e9` | 10 | surface/danger |
| 17 | `#d93036` | 10 | text/down |
| 18 | `#e8f8db` | 10 | (sem variável) |
| 19 | `#f5f5f5` | 5 | (sem variável) |
| 20 | `#e1f7cf` | 5 | palette/sky |
| 21 | `#e7e7eb` | 4 | palette/mint |
| 22 | `#ee7148` | 3 | laranja (gradiente) |
| 23 | `#1f7a3d` | 2 | (sem variável) |
| 24 | `#b8b8bc` | 2 | icon/inactive |
| 25 | `#cfe8d8` | 2 | (sem variável) |

**Papéis identificados**
- **Accent:** `#9aef6a` (verde-limão), presente nos dois temas.
- **Fundos:** `#ffffff` (claro) e `#121212` (escuro). Superfícies: `#f2f2f4`/`#2a2a2d`.
- **Bordas:** `#e4e4e8`/`#2e2e31` (card) e `#ebebeb`/`#262626` (divisor).
- **Texto:** primário `#121212`/`#f5f5f5`; secundário `#8e8e93` nos dois temas.
- **Sucesso:** `#16803c` (claro) / `#5fd38a` (escuro). **Erro:** `#d93036` / `#ff6b6b`.

### 1.3 Traços (strokes) por frequência

- **Escuro:** `#3a3a41` 581 · `#f2f2f4` 166 · `#2e2e31` 108 · `#9aef6a` 58 · `#ffffff` 56 · `#262626` 53 · `#2e2e33` 46 · `#121212` 28 · `#000000` 16
- **Claro:** `#d3d3da` 581 · `#121212` 166 · `#e4e4e8` 95 · `#9aef6a` 57 · `#ebebeb` 39 · `#000000` 33 · `#ffffff` 14

`#d3d3da` (e `#3a3a41` no escuro) aparece sobretudo em retângulos chamados "Cell". Não verifiquei o papel visual desse elemento.

### 1.4 Gradientes (97 preenchimentos)

| Gradiente (início → fim) | Usos | Leitura |
|---|---|---|
| `#fbfbfc` → `#ededf0` | 8 (outros) + 1 (claro) | superfície de card claro (topo→base) |
| `#2c2c2f` → `#2a2a2d` | 8 (escuro) + 2 (`→#1d1d1f`) | superfície de card escuro |
| `#17503b` → `#0f3b2d` | 8 (escuro) + 2 (claro) + 4 (outros) | botão primário |
| `#ee7148` → `#ffd27a` | 6 (escuro) + 3 (claro) + 4 (outros) | laranja→amarelo (possível cor de ativo; não verificado) |
| `#121212` → `#9aef6a` | 4 (escuro) + 2 (outros) | preto→lima (destaque; não verificado) |
| `#f39bcb` → `#a9c8fb` | 4 (escuro) + 2 (outros) | rosa→azul (avatar/protocolo; não verificado) |
| `#16a34a` → `#d9f99d` | 4 (escuro) + 2 (outros) | verde (não verificado) |
| `#16803c24` → `#16803c00` | 3 (escuro) + 1 (claro) | verde de alta esmaecendo (área de gráfico; não verificado) |

"Outros" = páginas Foundations, Components, UI8 Previews e Cover.

---

## 2. Tipografia

**Famílias**
- **Plus Jakarta Sans** — texto de UI e títulos. 3.818 textos (SemiBold 1.778 · Regular 1.622 · Medium 361 · Bold 57).
- **Geist Mono** — valores, montantes e números. 993 textos (SemiBold 604 · Regular 366 · Medium 23).
- **Inter** (Regular) — 242 textos, **inconsistente com o sistema**. Aparece só em telas claras (F04, F07, F10, F11, F12, F13), em dados de mercado ("Market cap", "24h volume"). Não faz parte dos 40 estilos.

**Estilos de texto nomeados** (40 estilos `Brankas/...`; "usos" = nós que referenciam o estilo)

| Estilo | Família / peso | Tamanho / lh / tracking | Usos |
|---|---|---|---|
| Body/Title | Plus Jakarta Sans SemiBold | 15 / 20 / −2% | 409 |
| Body/Regular | Plus Jakarta Sans Regular | 15 / 22 / −2% | 305 |
| Body/Meta | Plus Jakarta Sans Regular | 13 / 18 / −1% | 247 |
| Caption/Small | Plus Jakarta Sans Regular | 12 / 16 / −1% | 200 |
| Label/Chip | Plus Jakarta Sans SemiBold | 12 / 16 / −1% | 195 |
| Mono/Regular 12 | Geist Mono Regular | 12 / 16 / −1.5% | 122 |
| Text/Regular 11 | Plus Jakarta Sans Regular | 11 / 100% / −1% | 95 |
| Mono/SemiBold 12 | Geist Mono SemiBold | 12 / 16 / −1% | 91 |
| Body/Medium | Plus Jakarta Sans Medium | 15 / 20 / −2% | 87 |
| Title/Large | Plus Jakarta Sans SemiBold | 28 / 34 / −4% | 85 |
| Text/Medium 12 | Plus Jakarta Sans Medium | 12 / 100% / −1% | 80 |
| Mono/SemiBold 15 | Geist Mono SemiBold | 15 / 20 / −2.5% | 77 |
| Heading/Tab | Plus Jakarta Sans SemiBold | 18 / 24 / −2% | 48 |
| Title/Section | Plus Jakarta Sans SemiBold | 20 / 26 / −2% | 42 |
| Title/Header | Plus Jakarta Sans SemiBold | 16 / 20 / −2% | 33 |
| Amount/Row | Geist Mono SemiBold | 14 / 18 / −2.5% | 33 |
| Mono/Regular 11 | Geist Mono Regular | 11 / 100% / −1.5% | 27 |
| Text/Regular 14 | Plus Jakarta Sans Regular | 14 / 100% / −2% | 24 |
| Body/Value | Geist Mono SemiBold | 18 / 24 / −2.5% | 22 |
| Number/Keypad | Geist Mono Medium | 28 / 32 / −4% | 21 |
| Display/Hero | Plus Jakarta Sans SemiBold | 44 / 50 / −4% | 17 |
| Text/Medium 13 | Plus Jakarta Sans Medium | 13 / 100% / −1% | 17 |
| Mono/Regular 13 | Geist Mono Regular | 13 / 18 / −1% | 17 |
| Display/Amount | Geist Mono SemiBold | 40 / 48 / −4% | 14 |
| Mono/Regular 15 | Geist Mono Regular | 15 / 22 / −2% | 12 |
| Mono/SemiBold 28 | Geist Mono SemiBold | 28 / 34 / −4% | 12 |
| Mono/SemiBold 64 | Geist Mono SemiBold | 64 / 50 / −4% | 12 |
| Label/Nav | Plus Jakarta Sans Medium | 11 / 14 / −1% | 10 |
| Mono/SemiBold 44 | Geist Mono SemiBold | 44 / 50 / −4% | 10 |
| Text/SemiBold 40 | Plus Jakarta Sans SemiBold | 40 / 48 / −4% | 6 |
| Text/SemiBold 14 | Plus Jakarta Sans SemiBold | 14 / 18 / −2% | 4 |
| Mono/SemiBold 20 | Geist Mono SemiBold | 20 / 26 / −2.5% | 2 |
| Mono/SemiBold 56 | Geist Mono SemiBold | 56 / 50 / −4% | 2 |
| Text/Bold 40 | Plus Jakarta Sans Bold | 40 / 100% / −4% | 1 |
| Text/Regular 16 | Plus Jakarta Sans Regular | 16 / 100% / −2% | 1 |
| Label/Card | Plus Jakarta Sans Regular | 13 / 16 / −1% | **0** |
| Button/Label | Plus Jakarta Sans SemiBold | 16 / 20 / −2% | **0** |
| Status/Time | Plus Jakarta Sans SemiBold | 16 / 20 / −2% | **0** |
| Text/Medium 28 | Plus Jakarta Sans Medium | 28 / 32 / −4% | **0** |
| Mono/Medium 15 | Geist Mono Medium | 15 / 20 / −2.5% | **0** |

Só 2.380 dos 5.053 nós de texto (47%) usam estilo nomeado. Os demais têm formatação solta.

**Padrões de uso observados**
- Tamanhos inteiros mais frequentes: 12 (978), 15 (875), 13 (271), 11 (186), 14 (118), 28 (128), 20 (75), 18 (70), 16 (44), 40 (32), 44 (31).
- Tracking dominante: −2% (1.557), −1% (1.510), 0 (955), −4% (316), −1.5% (278), −2.5% (217).
- Line-height: 100% (1.311), 16px (570), 20px (550), 22px (282), 18px (275).
- **Tamanhos fracionários:** 36% dos textos visíveis têm tamanho não inteiro (ex.: 3.6, 4.5, 7.156, 8.945). Parecem resultado de escala aplicada em instâncias, mas não confirmei a causa na fonte. Use os estilos nomeados (inteiros) como referência.

---

## 3. Raios, espaçamento, sombras e blur

### 3.1 Raios (cornerRadius, nós com raio > 0)
- **6** — 1.211
- **3** — 227 · **16** — 213 · **27** — 181 · **24** — 169 · **44** — 162 · **18** — 150 · **8** — 133 · **2** — 126 · **14** — 91 · **28** — 80 · **100** — 68
- **999** — 177 (valor de pill; não verifiquei o uso visual)
- Bottom sheet: frame "Sheet" com cantos superiores independentes, **topo = 36** (393 px de largura).

### 3.2 Espaçamento (auto-layout)
- Gap (`stackSpacing`) mais comum: **2** (350) · **12** (325) · **8** (237) · **10** (221) · **6** (169) · **3** (135) · **14** (115) · **4** (106) · **16** (55) · **20** (54).
- Padding horizontal mais comum: **20 px** (L20/R20 aparece na maioria dos blocos com padding: T8/B8, T18/B18, T16/B16, T20/B20 etc.). Esse é o gutter de tela.
- Padding inferior **34 px** (T0 R0 B34 L0 — 78 blocos): compatível com a área segura inferior do iPhone (home indicator). Não verifiquei na fonte.
- 3.254 blocos de auto-layout têm padding zero; ignore esse valor ao derivar tokens.

### 3.3 Sombras (DROP_SHADOW, nós visíveis)
- **Sombra grande (sheet / modal):** blur 48, offset y 24, `#00000038` (23 usos); blur 23.85, offset y 11.93, `#0000004d` (32 usos); blur 28.6, offset y 14.3 (4 usos).
- **Sombra de navegação (estilo nomeado `Brankas/Shadow/Nav`):** blur 18, offset y −6, `#1212120f` — 29 nós a referenciam. É a única EFFECT style do arquivo.
- **Sombra de card suave:** blur 24, offset y 8, `#12121214` (8 usos); blur 7.2, offset y 2.4, `#12121214` (4 usos).
- **Sombra superior (offset negativo):** blur 5.4 / 10.7 / 7.2, `#1212120f`, 14 / 14 / 12 usos.

### 3.4 Blur
- BACKGROUND_BLUR 14 (2 usos) e 4.2 (1 uso)
- FOREGROUND_BLUR 7 (2 usos) e 2.1 (1 uso)
- Uso pontual. Não é parte central do sistema.

---

## 4. Inventário

### 4.1 Páginas (canvas) — 9
| Página | Conteúdo |
|---|---|
| 🟦 Cover | capa (1 frame) |
| 📘 Read Me | leia-me (1 frame) |
| 🎨 Foundations | `Foundations — Light` (1280×2872) e `Foundations — Dark` |
| 📱 Screens — Light | 17 seções de fluxo (F01–F17), 81 telas 393×852 |
| 🌙 Screens — Dark | 17 seções de fluxo (F01–F17), 81 telas 393×852 |
| 🛍 UI8 Previews | 14 frames de apresentação (capa, "What's inside", "Ready-made flows", "Light & Dark", "Screen wall", features Send/Swap/Earn & DeFi/Buy & Sell/Security) |
| 🧩 Components | 9 seções de componentes |
| 🔀 User Flow | 1 frame de fluxo |
| Internal Only Canvas | interno (sem seções nem frames de topo) |

Total: **43 seções**, 3.204 frames dentro das seções F (1.602 por tema).

### 4.2 Telas (fluxos) — 162 telas 393×852 (81 claras + 81 escuras)

| Fluxo | Telas (claras / escuras) | Exemplos de nomes |
|---|---|---|
| F01 · Onboarding | 5 / 5 | Splash, Welcome · Keys, Welcome · Everything, Welcome · Safety, Set up your vault |
| F02 · Create wallet | 8 / 8 | Create passcode, Confirm passcode, Enable Face ID, Backup intro, Phrase hidden/revealed, Confirm phrase, Vault ready |
| F03 · Import wallet | 3 / 3 | Import options, Enter phrase, Restoring |
| F04 · Home & assets | 4 / 4 | Home, Home · New wallet, Crypto assets, Transaction details |
| F05 · Receive | 3 / 3 | Choose asset, QR code, Address copied |
| F06 · Send | 8 / 8 | Choose asset, Recipient, Amount, Review, Sending, Success, Failed, New address warning |
| F07 · Market & swap | 6 / 6 | Market · List, Market · Asset detail, Swap · Enter amount, Select token, Review, Success |
| F08 · Earn | 4 / 4 | Overview, Stake amount, Position, Staked |
| F09 · Security | 6 / 6 | Center, Passcode gate, Recovery phrase, Connected apps, Signature request, Locked |
| F10 · Buy crypto | 4 / 4 | Amount, Payment method, Review, Success |
| F11 · Notifications & alerts | 3 / 3 | Notifications, Price alerts, Create alert |
| F12 · Collectibles | 3 / 3 | Collectibles, Collectible detail, Send collectible |
| F13 · Vaults & settings | 3 / 3 | Switch vault, Settings, Address book |
| F14 · Sell crypto | 4 / 4 | Amount, Payout method, Review, Success |
| F15 · Activity | 4 / 4 | All, Sent, Received, Empty |
| F16 · Recurring buy | 5 / 5 | Set up, Pay with, Review, Active, Plans |
| F17 · DeFi | 8 / 8 | Explore, Protocol, Deposit amount, Review, Success, Position, Withdraw, Withdrawn |

As seções F14–F17 do canvas `🌙 Screens — Dark` não têm o sufixo "· Dark" no nome da seção (as telas dentro dela têm). Conferi isso no arquivo.

### 4.3 Componentes (105 SYMBOLs, 2.528 instâncias)

**Navigation (14)**
- `Status Bar` — 289 instâncias (393×54)
- `Home Indicator` — 225
- `Top Bar` — 154 (353×44)
- **`Nav Bar`** — 69 (393×95 — **tab bar inferior**, com `State=Active/Inactive` por item e `Nav/Swap`)
- `Header/Home` — 14

**Actions (12)** — botões e chips
- Botão: `Kind=Primary` 84 · `Kind=Dark` 95 · `Kind=Secondary` 78 · `Kind=Text` 26 · `Kind=Disabled` 7 (353×54)
- `Kind=Receive` 15 · `Kind=Send` 8 (175×52, pares de ação)
- Chip/segmento: `State=Default` 60 · `State=Selected` 23 (71×38) · `Chip/Gain` 12 (63×24)
- Toggle: `State=On` 30 · `State=Off` 11 (52×32)

**Data display (5)** — listas e linhas
- `Token Row` — 97 (353×64)
- `Transaction` (variantes `Type=Received` 47 · `Type=Sent` 29 · `Type=Pending` 23)
- `List Row` — 1

**Inputs & feedback (6)**
- Keypad: `Left=Blank` 15 · `Left=Decimal` 11 (353×256). Além disso, há 26 instâncias do componente `Keypad` nas telas.
- `Input Field` — 1 (353×60)
- `Toast` — 4 (175×44)
- Alertas: `Kind=Info` 8 · `Kind=Warning` 7 (353×50)

**Cards (2)**
- `Card/Safety` — 8 (156×126) · `Card/Staking` — 8 (185×126)

**Crypto coins (8)** — 40×40
- ETH 148 · BTC 100 · USDT 74 · BNB 36 · LINK 16 · XRP 12 · LTC 7 · DOGE 7

**Icons (48)** — 24×24, prefixo `Icon/`
- Mais usados: chevron-right 118 · search 42 · star 41 · chevron-down 32 · clock 32 · lock 30 · link 22 · face-id 22 · swap 21 · check 21 · wallet 20 · plus 18 · bell 16 · shield-check 16 · key 15 · trending-up 12.
- 8 ícones sem nenhuma instância (`Icon/bitcoin`, `x`, `chevron-left`, `sliders`, `trash`, `arrow-up`, `dots`, `fingerprint`).

**Avatars (6)** — 96×96: Alma 13 · Reza 10 · Dimas 9 · Lena 9 · Kirana 9 · Maya 7

**Protocols (4)** — 96×96: Aave 7 · Lido 7 · Curve 7 · Uniswap 3

### 4.4 Padrões de tela (frames, não componentes)

- **Bottom sheet:** frame `Sheet` — 24 ocorrências em F06, F07, F09, F10, F12, F13, F14, F16. Largura 393, altura 409–491 na maioria, topo arredondado 36.
- **Tab bar:** `Nav Bar`, descrito acima.
- **Abas / segmentos:** `Tabs` (17), `Tab` (28), `Underline` (28), `Tab indicator` (3).
- **Listas:** `Row` (1.703 frames genéricos), `Detail row` (274), `Transaction Row` (99 instâncias), `Earn row` (63), `Setting row` (35), `Market row` (18), `Contact row` (12), `App row` (9).
- **Cards:** `NFT card` (28), `Stat card` (21), `Swap card` (20), `Top Card` (7), `Earnings card` (7), `Status card` (7), `QR card` (8), `Add funds card` (3), `Sell card` / `Buy card` (3 cada).
- **Badges e pills:** `Badge` (175), `Pill` (71), `Protocol badge` (35), `Asset pill` (8), `Status badge` (3).
- **Gráficos:** **não há componente de gráfico nomeado.** Existem linhas de grade `Grid line` (20 nós, larguras 296/177/89 px; 8 em F07 claro e 8 em F07 escuro, o resto fora das seções), `Open line` (5), barras `bar` (27: 18 em F03 claro+escuro, 9 fora das seções), `Progress` (6), um nó chamado `Sparklines` e `Timeline` (3, um deles em F06 claro).

---

## 5. Imagens

- **321** preenchimentos de imagem usam **133** das **172** arquivos em `images/`. 39 arquivos não são usados.
- Formato: **PNG** (verificado nas 12 maiores pelo cabeçalho do arquivo).
- As 8 maiores **não são mockups de tela**. São assets decorativos (fundos, mãos, metal, sombras), sem seção de tela associada.
- Os mockups de tela no arquivo são vetoriais (frames), não rasters. Não foi possível renderizá-los como PNG sem o Figma. O único raster de visão geral é o `thumbnail.png` (243×400).

**Copiadas para `docs/design/frames/`**

| Arquivo | Dimensões reais | Tamanho | Origem (hash) | Nó de uso |
|---|---|---|---|---|
| `00-canvas-thumbnail-243x400.png` | 243×400 | 43 KB | `thumbnail.png` | pré-visualização do canvas |
| `01-background-4096x3072.png` | 4096×3072 | 15.1 MB | `4af149db48` | Background |
| `02-sand-4096x1538.png` | 4096×1538 | 10.7 MB | `bda0afec50` | Sand |
| `03-background-alt-4096x3072.png` | 4096×3072 | 9.7 MB | `5c9741e704` | Background (2ª variante) |
| `04-hand-1538x1316.png` | 1538×1316 | 2.6 MB | `1e9392bead` | Hand |
| `05-metal-1975x2217.png` | 1975×2217 | 2.4 MB | `e741a05708` | Metal |
| `06-metal-1800x2059.png` | 1800×2059 | 1.9 MB | `7212ec0c99` | Metal (2ª variante) |
| `07-shadow-3254x628.png` | 3254×628 | 1.8 MB | `8a49c075e3` | Shadow |
| `08-shadow-4096x635.png` | 4096×635 | 1.7 MB | `219929c985` | Shadow (2ª variante) |

Os nomes foram lidos do cabeçalho PNG. Os nomes de nó vêm do decoder (`Background`, `Sand` etc.).

---

## 6. Inconsistências encontradas no kit

1. **Inter aparece em 242 textos** de telas claras (F04, F07, F10–F13), fora do sistema Plus Jakarta Sans + Geist Mono.
2. **As seções F14–F17 têm o mesmo nome nos dois canvas**, sem sufixo "· Dark" no nome da seção escura.
3. **5 estilos de texto sem uso direto** (Label/Card, Button/Label, Status/Time, Text/Medium 28, Mono/Medium 15).
4. **Tamanhos fracionários em 36% dos textos**, e estilos nomeados em só 47% dos textos.
5. **Variáveis sem uso** (`bg/base`, `palette/purple`, `palette/orange`, `palette/pink`, `surface/card-top`, `surface/card-bottom`, `border/card`, nos dois temas). Podem ser tokens de reserva.
6. **Licença:** o arquivo tem a página `🛍 UI8 Previews`, o que sugere um kit comercial. Verifique a licença antes de reutilizar os assets.

---

## 7. O que não foi feito / limitações

- Não renderizei as telas. Os valores vêm da estrutura do arquivo, não de comparação visual.
- Contagens são de nós, não de área ocupada.
- A causa dos tamanhos fracionários não foi confirmada na fonte.
- Os papéis de gradientes marcados como "não verificado" são inferência pelo nome da cor.
- O decoder e os scripts de análise estão no diretório de rascunho da sessão, não no repositório. Só o `BRANKAS.md` e as imagens foram para `docs/`.
