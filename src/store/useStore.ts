import { create } from 'zustand';
import { getDb } from '../database/schema';

export type AccountType = 'cash' | 'bank' | 'credit';
export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color?: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  color?: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  accountId: string;
  budgetId?: string | null;
  date: string;
  note?: string | null;
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currency: string;
  isLoaded: boolean;

  loadData: () => void;
  addAccount: (account: Account) => void;
  editAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;

  addTransaction: (transaction: Transaction) => void;
  editTransaction: (transaction: Transaction) => void;
  deleteTransaction: (
    id: string,
    accountId: string,
    amount: number,
    type: TransactionType,
  ) => void;

  addCategory: (category: Category) => void;
  editCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  addBudget: (budget: Budget) => void;
  editBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;

  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}

export const useStore = create<AppState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  currency: 'USD',
  isLoaded: false,

  loadData: () => {
    const db = getDb();
    const accounts = db.getAllSync<Account>('SELECT * FROM accounts');
    const transactions = db.getAllSync<Transaction>(
      'SELECT * FROM transactions ORDER BY date DESC',
    );
    const categories = db.getAllSync<Category>('SELECT * FROM categories');
    const budgets = db.getAllSync<Budget>('SELECT * FROM budgets');
    let currencySetting;
    try {
      currencySetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'currency'",
      );
    } catch (e) {
      console.warn('Could not load currency from DB:', e);
    }

    set({
      accounts,
      transactions,
      categories,
      budgets,
      currency: currencySetting?.val || 'USD',
      isLoaded: true,
    });
  },

  addAccount: (account) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color) VALUES (?, ?, ?, ?, ?, ?)',
      [
        account.id ?? null,
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
      ],
    );
    set((state) => ({ accounts: [...state.accounts, account] }));
  },

  editAccount: (account) => {
    const db = getDb();
    db.runSync(
      'UPDATE accounts SET name = ?, type = ?, initialBalance = ?, currentBalance = ?, color = ? WHERE id = ?',
      [
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
        account.id ?? null,
      ],
    );
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
    }));
  },

  deleteAccount: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM accounts WHERE id = ?', [id ?? null]);
    // Associated transactions are cascade deleted via SQLite FK Constraints if enabled
    // But manual cleanup might be needed if PRAGMA foreign_keys = ON is not guaranteed, however we just reload data next time.
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      transactions: state.transactions.filter((t) => t.accountId !== id),
    }));
  },

  addTransaction: (transaction) => {
    const db = getDb();
    const isIncome = transaction.type === 'income';
    const amountModifier = isIncome ? transaction.amount : -transaction.amount;

    db.runSync(
      'INSERT INTO transactions (id, type, amount, categoryId, accountId, budgetId, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        transaction.id ?? '',
        transaction.type ?? '',
        transaction.amount ?? 0,
        transaction.categoryId ?? null,
        transaction.accountId ?? '',
        transaction.budgetId ?? null,
        transaction.date ?? '',
        transaction.note ?? null,
      ],
    );

    // Update account balance
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [amountModifier ?? 0, transaction.accountId ?? null],
    );

    // Quick reload directly via getting the state is faster,
    // but we can manually update local state for UI responsiveness
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id === transaction.accountId) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + amountModifier,
          };
        }
        return acc;
      });
      return {
        transactions: [transaction, ...state.transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
        accounts: updatedAccounts,
      };
    });
  },

  editTransaction: (transaction) => {
    const db = getDb();
    const oldTransaction = get().transactions.find(
      (t) => t.id === transaction.id,
    );
    if (!oldTransaction) {
      console.error(
        'editTransaction: Old transaction not found',
        transaction.id,
      );
      return;
    }

    try {
      // Revert old transaction amount
      const oldModifier =
        oldTransaction.type === 'income'
          ? -oldTransaction.amount
          : oldTransaction.amount;
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
        [oldModifier ?? 0, oldTransaction.accountId ?? ''],
      );

      // Apply new transaction amount
      const newModifier =
        transaction.type === 'income'
          ? transaction.amount
          : -transaction.amount;
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
        [newModifier ?? 0, transaction.accountId ?? ''],
      );

      db.runSync(
        'UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, budgetId = ?, date = ?, note = ? WHERE id = ?',
        [
          transaction.type ?? '',
          transaction.amount ?? 0,
          transaction.categoryId ?? null,
          transaction.accountId ?? '',
          transaction.budgetId ?? null,
          transaction.date ?? '',
          transaction.note ?? null,
          transaction.id ?? '',
        ],
      );

      get().loadData();
    } catch (error) {
      console.error('editTransaction Error:', error);
      throw error;
    }
  },

  deleteTransaction: (id, accountId, amount, type) => {
    const db = getDb();
    const isIncome = type === 'income';
    const amountModifier = isIncome ? -amount : amount;

    db.runSync('DELETE FROM transactions WHERE id = ?', [id ?? null]);
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [amountModifier ?? 0, accountId ?? null],
    );

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + amountModifier,
          };
        }
        return acc;
      });
      return {
        transactions: state.transactions.filter((t) => t.id !== id),
        accounts: updatedAccounts,
      };
    });
  },

  addCategory: (category) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [
        category.id ?? null,
        category.name ?? null,
        category.type ?? null,
        category.icon ?? null,
        category.color ?? null,
      ],
    );
    set((state) => ({ categories: [...state.categories, category] }));
  },

  editCategory: (category) => {
    const db = getDb();
    db.runSync(
      'UPDATE categories SET name = ?, type = ?, icon = ?, color = ? WHERE id = ?',
      [
        category.name ?? null,
        category.type ?? null,
        category.icon ?? null,
        category.color ?? null,
        category.id ?? null,
      ],
    );
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === category.id ? category : c,
      ),
    }));
  },

  deleteCategory: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM categories WHERE id = ?', [id ?? null]);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  addBudget: (budget) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO budgets (id, name, amount, color) VALUES (?, ?, ?, ?)',
      [
        budget.id ?? null,
        budget.name ?? null,
        budget.amount ?? 0,
        budget.color ?? null,
      ],
    );
    set((state) => ({ budgets: [...state.budgets, budget] }));
  },

  editBudget: (budget) => {
    const db = getDb();
    db.runSync(
      'UPDATE budgets SET name = ?, amount = ?, color = ? WHERE id = ?',
      [
        budget.name ?? null,
        budget.amount ?? 0,
        budget.color ?? null,
        budget.id ?? null,
      ],
    );
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === budget.id ? budget : b)),
    }));
  },

  deleteBudget: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM budgets WHERE id = ?', [id ?? null]);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  setCurrency: (currency) => {
    const db = getDb();
    try {
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'currency',
        currency ?? 'USD',
      ]);
      set({ currency });
    } catch (error) {
      console.error('setCurrency Error:', error);
      // Fallback: update state anyway so the user sees the change
      set({ currency: currency ?? 'USD' });
    }
  },

  formatCurrency: (amount: number) => {
    const { currency } = get();
    const symbols: { [key: string]: string } = {
      USD: '$',
      COP: '$',
      MXN: '$',
      EUR: '€',
    };
    const symbol = symbols[currency] || '$';

    // For COP and MXN, sometimes we show the code if it's ambiguous, but usually $ is fine
    // COP often uses dot as thousands separator: 1.000
    if (currency === 'COP') {
      return `${symbol}${Math.round(amount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
}));
