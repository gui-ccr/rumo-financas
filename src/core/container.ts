import type { SQLiteDatabase } from 'expo-sqlite';

import { ArchiveAccount, SaveAccount } from '@/features/accounts/application/save-account';
import { ArchiveCategory, SaveCategory } from '@/features/accounts/application/save-category';
import { SqliteAccountRepository } from '@/features/accounts/infrastructure/sqlite-account-repository';
import { SqliteCategoryRepository } from '@/features/accounts/infrastructure/sqlite-category-repository';
import { ExportBackup, ImportBackup } from '@/features/backup/application/backup-use-cases';
import { ExpoBackupFileGateway } from '@/features/backup/infrastructure/expo-backup-file-gateway';
import { SqliteBackupRepository } from '@/features/backup/infrastructure/sqlite-backup-repository';
import { PayBill, UnpayBill } from '@/features/bills/application/pay-bill';
import { GetBillDetail } from '@/features/bills/application/get-bill-detail';
import { DeleteBill, SaveBill } from '@/features/bills/application/save-bill';
import { SyncOccurrences } from '@/features/bills/application/sync-occurrences';
import { SyncReminders } from '@/features/bills/application/sync-reminders';
import { ExpoReminderScheduler } from '@/features/bills/infrastructure/expo-reminder-scheduler';
import { SqliteBillRepository } from '@/features/bills/infrastructure/sqlite-bill-repository';
import { GetInvoices } from '@/features/cards/application/get-invoices';
import { PayInvoice } from '@/features/cards/application/pay-invoice';
import { SqliteInvoiceRepository } from '@/features/cards/infrastructure/sqlite-invoice-repository';
import { GetPaymentPlan } from '@/features/bills/application/get-payment-plan';
import { AddExpectedIncome } from '@/features/incomes/application/add-expected-income';
import { ArchiveIncome, SaveIncome } from '@/features/incomes/application/save-income';
import { GetIncomes } from '@/features/incomes/application/get-incomes';
import { ReceiveIncome } from '@/features/incomes/application/receive-income';
import { SyncIncomes } from '@/features/incomes/application/sync-incomes';
import { SqliteIncomeRepository } from '@/features/incomes/infrastructure/sqlite-income-repository';
import { GetMonthOverview } from '@/features/dashboard/application/get-month-overview';
import { SqliteOverviewRepository } from '@/features/dashboard/infrastructure/sqlite-overview-repository';
import { GetMotoSummary } from '@/features/moto/application/get-moto-summary';
import { SqliteMotoRepository } from '@/features/moto/infrastructure/sqlite-moto-repository';
import { DeleteNote, SaveNote } from '@/features/notes/application/save-note';
import { ToggleNoteDone, ToggleNotePin } from '@/features/notes/application/toggle-note';
import { ExpoNoteReminderScheduler } from '@/features/notes/infrastructure/expo-note-reminder-scheduler';
import { SqliteNoteRepository } from '@/features/notes/infrastructure/sqlite-note-repository';
import { CreateTransaction } from '@/features/transactions/application/create-transaction';
import { DeleteTransaction } from '@/features/transactions/application/delete-transaction';
import { EditTransaction } from '@/features/transactions/application/edit-transaction';
import { SqliteTransactionRepository } from '@/features/transactions/infrastructure/sqlite-transaction-repository';
import { SqliteUnitOfWork } from '@/shared/infrastructure/database/sqlite-unit-of-work';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * Composition root: the only place that knows concrete implementations.
 * Everything else depends on domain interfaces.
 */
export function createContainer(db: SQLiteDatabase) {
  const uow = new SqliteUnitOfWork(db);

  const repos = {
    accounts: new SqliteAccountRepository(db),
    categories: new SqliteCategoryRepository(db),
    transactions: new SqliteTransactionRepository(db),
    bills: new SqliteBillRepository(db),
    invoices: new SqliteInvoiceRepository(db),
    overview: new SqliteOverviewRepository(db),
    moto: new SqliteMotoRepository(db),
    incomes: new SqliteIncomeRepository(db),
    notes: new SqliteNoteRepository(db),
  };

  const noteReminders = new ExpoNoteReminderScheduler();

  const createTransaction = new CreateTransaction(repos.accounts, repos.transactions, uow, newId);
  // Deleting a payment or a receipt reopens whatever it settled.
  const paymentLinks = {
    releaseByTransactions: async (ids: number[]) => {
      await repos.bills.releaseByTransactions(ids);
      await repos.incomes.releaseByTransactions(ids);
    },
  };
  const deleteTransaction = new DeleteTransaction(repos.transactions, paymentLinks, uow);
  const syncOccurrences = new SyncOccurrences(repos.bills);
  const syncIncomes = new SyncIncomes(repos.incomes);
  const getIncomes = new GetIncomes(repos.incomes);
  const backupFiles = new ExpoBackupFileGateway();
  const backupRepo = new SqliteBackupRepository(db, uow);

  const useCases = {
    saveAccount: new SaveAccount(repos.accounts),
    archiveAccount: new ArchiveAccount(repos.accounts),
    saveCategory: new SaveCategory(repos.categories),
    archiveCategory: new ArchiveCategory(repos.categories),

    createTransaction,
    editTransaction: new EditTransaction(repos.accounts, repos.transactions),
    deleteTransaction,

    syncOccurrences,
    saveBill: new SaveBill(repos.bills, syncOccurrences, uow),
    deleteBill: new DeleteBill(repos.bills, uow),
    getBillDetail: new GetBillDetail(repos.bills, repos.accounts, repos.categories),
    payBill: new PayBill(repos.bills, createTransaction, uow),
    unpayBill: new UnpayBill(repos.bills, deleteTransaction),
    syncReminders: new SyncReminders(repos.bills, new ExpoReminderScheduler()),

    getInvoices: new GetInvoices(repos.accounts, repos.invoices),
    payInvoice: new PayInvoice(repos.accounts, repos.transactions),

    getPaymentPlan: new GetPaymentPlan(repos.accounts, repos.bills, getIncomes),

    syncIncomes,
    getIncomes,
    saveIncome: new SaveIncome(repos.incomes, syncIncomes, uow),
    archiveIncome: new ArchiveIncome(repos.incomes, uow),
    addExpectedIncome: new AddExpectedIncome(repos.incomes),
    receiveIncome: new ReceiveIncome(repos.incomes, repos.accounts, createTransaction, uow),

    getMonthOverview: new GetMonthOverview(repos.overview, repos.accounts),
    getMotoSummary: new GetMotoSummary(repos.moto),

    saveNote: new SaveNote(repos.notes, noteReminders),
    deleteNote: new DeleteNote(repos.notes, noteReminders),
    toggleNoteDone: new ToggleNoteDone(repos.notes, noteReminders),
    toggleNotePin: new ToggleNotePin(repos.notes),

    exportBackup: new ExportBackup(backupRepo, backupFiles),
    importBackup: new ImportBackup(backupRepo, backupFiles),
  };

  return { repos, useCases };
}

export type Container = ReturnType<typeof createContainer>;
