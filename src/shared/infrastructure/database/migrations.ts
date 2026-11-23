import type { SQLiteDatabase } from 'expo-sqlite';

import { seed } from './seed';

/**
 * Removes the extra items a bill got in one month, before the rule "one item per month" existed
 * (editing a bill's due day after paying it created a second item in that month).
 * Inside a (bill, month) group with several items:
 *  - an open item goes when the group has a paid one (the payment is what matters);
 *  - among open items, the one on the bill's current due day stays, then the earliest id.
 * Paid items are never deleted here.
 */
export const BILL_DEDUPE_SQL = `
  DELETE FROM bill_occurrences
  WHERE status = 'pending' AND id IN (
    SELECT o.id FROM bill_occurrences o
    JOIN bills b ON b.id = o.bill_id
    WHERE o.status = 'pending' AND EXISTS (
      SELECT 1 FROM bill_occurrences p
      WHERE p.bill_id = o.bill_id
        AND p.id <> o.id
        AND substr(p.due_date, 1, 7) = substr(o.due_date, 1, 7)
        AND (
          p.status = 'paid'
          OR (
            p.status = 'pending'
            AND (
              (CAST(substr(p.due_date, 9, 2) AS INTEGER) = b.due_day
                AND CAST(substr(o.due_date, 9, 2) AS INTEGER) <> b.due_day)
              OR (
                ((CAST(substr(p.due_date, 9, 2) AS INTEGER) = b.due_day)
                  = (CAST(substr(o.due_date, 9, 2) AS INTEGER) = b.due_day))
                AND p.id < o.id
              )
            )
          )
        )
    )
  );
`;

/**
 * Forward-only migrations keyed by PRAGMA user_version.
 * Append new entries; never edit a shipped one.
 */
export const MIGRATIONS: string[] = [
  /* 1 — initial schema */ `
  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'credit_card', 'cash')),
    initial_balance_cents INTEGER NOT NULL DEFAULT 0,
    closing_day INTEGER,
    due_day INTEGER,
    color TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
    grp TEXT NOT NULL CHECK (grp IN ('moto', 'dev', 'casa', 'pessoal')),
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_cents INTEGER,
    category_id INTEGER REFERENCES categories(id),
    account_id INTEGER REFERENCES accounts(id),
    due_day INTEGER NOT NULL,
    recurrence TEXT NOT NULL CHECK (recurrence IN ('monthly', 'once')),
    start_month TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE bill_occurrences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL,
    amount_cents INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    transaction_id INTEGER,
    notification_id TEXT,
    UNIQUE (bill_id, due_date)
  );

  CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    date TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category_id INTEGER REFERENCES categories(id),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    bill_occurrence_id INTEGER REFERENCES bill_occurrences(id) ON DELETE SET NULL,
    invoice_month TEXT,
    installment_group_id TEXT,
    installment_no INTEGER,
    installment_total INTEGER,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'notification')),
    raw_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_tx_date ON transactions(date);
  CREATE INDEX idx_tx_account_invoice ON transactions(account_id, invoice_month);
  CREATE INDEX idx_tx_category ON transactions(category_id);
  CREATE INDEX idx_occ_due ON bill_occurrences(due_date);
  `,
  /* 2 — Rumo redesign: default categories and accounts move to the muted brand palette */
  recolor(
    'categories',
    {
      iFood: '#B4505E',
      Uber: '#5E6A85',
      '99': '#B7862B',
      Lalamove: '#C07A3D',
      'Outros apps': '#7C83FD',
      Combustível: '#C07A3D',
      Manutenção: '#5E6A85',
      'Pneus e peças': '#4F5BD5',
      'Documentos e IPVA': '#9A8A3A',
      'Alimentação na rua': '#B4505E',
      Freela: '#3F8F63',
      Salário: '#2E8C88',
      'Ferramentas e SaaS': '#7C83FD',
      Equipamento: '#4F5BD5',
      Aluguel: '#2B3A8C',
      Luz: '#B7862B',
      Água: '#3E7CB1',
      Internet: '#7C83FD',
      Celular: '#4F5BD5',
      Mercado: '#3F8F63',
      Restaurante: '#B4505E',
      Lazer: '#8A5DB0',
      Saúde: '#B4505E',
      Transporte: '#3E7CB1',
      Compras: '#8A5DB0',
      Assinaturas: '#7C83FD',
      'Outros gastos': '#5E6A85',
      'Outras entradas': '#3F8F63',
    },
  ) +
    recolor('accounts', {
      Nubank: '#8A5DB0',
      Santander: '#B4505E',
      'Cartão Nubank': '#8A5DB0',
      Dinheiro: '#3F8F63',
    }),
  /* 3 — additive: bill priority, and incomes (fixed schedules and expected receipts without a date) */ `
  ALTER TABLE bills ADD COLUMN priority TEXT NOT NULL DEFAULT 'important'
    CHECK (priority IN ('essential', 'important', 'flexible'));

  CREATE TABLE incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('fixed', 'uncertain')),
    expected_cents INTEGER NOT NULL CHECK (expected_cents > 0),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    recurrence TEXT CHECK (recurrence IN ('monthly', 'once')),
    due_day INTEGER,
    start_month TEXT,
    note TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE income_occurrences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    income_id INTEGER NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
    expected_date TEXT,
    month TEXT,
    expected_cents INTEGER NOT NULL CHECK (expected_cents > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
    received_transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    UNIQUE (income_id, expected_date)
  );

  CREATE INDEX idx_income_occ_month ON income_occurrences(month);
  `,
  /* 4 — additive: notes (free text, optional reminder, pin and done). Times are UTC ISO strings. */ `
  CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    pinned INTEGER NOT NULL DEFAULT 0,
    remind_at TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX idx_notes_remind ON notes(remind_at);
  `,
  /* 5 — data: one item per bill per month. Removes the duplicates that earlier builds created. */
  BILL_DEDUPE_SQL,
];

/** UPDATE statements that recolor rows by name (values are constants, not user input). */
function recolor(table: 'categories' | 'accounts', colors: Record<string, string>): string {
  return Object.entries(colors)
    .map(([name, color]) => `UPDATE ${table} SET color = '${color}' WHERE name = '${name.replace(/'/g, "''")}';`)
    .join('\n');
}

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= MIGRATIONS.length) return;

  await db.withTransactionAsync(async () => {
    for (; version < MIGRATIONS.length; version++) {
      await db.execAsync(MIGRATIONS[version]);
      if (version === 0) await seed(db);
    }
    await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });
}
