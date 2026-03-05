import { db } from '@/utils/firebase-api';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'saving';

export type IncomeCategory =
  | 'freelance'
  | 'salary'
  | 'investment'
  | 'gift'
  | 'sale'
  | 'other';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'subscription'
  | 'shopping'
  | 'health'
  | 'rent'
  | 'other';

export type SavingCategory = 'epargne' | 'investissement' | 'objectif' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory | SavingCategory;
  label: string;
  description?: string;
  date: Timestamp | Date | string;
  createdAt: Timestamp | Date;
  userId: string;
  currency: 'EUR' | 'USD' | 'GBP';
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

// ─── CRUD ─────────────────────────────────────────────────────────────────────

const COL = 'finance_transactions';

export async function addTransaction(data: NewTransaction): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, COL, id), data as Record<string, unknown>);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function computeStats(transactions: Transaction[]) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = transactions
    .filter((t) => t.type === 'saving')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses - totalSavings;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  return { totalIncome, totalExpenses, totalSavings, balance, savingsRate };
}

/** Group transactions by month (YYYY-MM) */
export function groupByMonth(transactions: Transaction[]) {
  const map: Record<string, { income: number; expense: number; saving: number }> = {};
  for (const t of transactions) {
    const d = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { income: 0, expense: 0, saving: 0 };
    map[key][t.type] += t.amount;
  }
  return map;
}

export function formatCurrency(amount: number, currency: 'EUR' | 'USD' | 'GBP' = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; emoji: string }[] = [
  { value: 'freelance', label: 'Freelance', emoji: '💻' },
  { value: 'salary', label: 'Salaire', emoji: '💼' },
  { value: 'investment', label: 'Investissement', emoji: '📈' },
  { value: 'gift', label: 'Cadeau / Don', emoji: '🎁' },
  { value: 'sale', label: 'Vente', emoji: '🛍️' },
  { value: 'other', label: 'Autre', emoji: '✦' },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Alimentation', emoji: '🍔' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'entertainment', label: 'Loisirs', emoji: '🎮' },
  { value: 'subscription', label: 'Abonnements', emoji: '📱' },
  { value: 'shopping', label: 'Shopping', emoji: '🛒' },
  { value: 'health', label: 'Santé', emoji: '💊' },
  { value: 'rent', label: 'Loyer / Logement', emoji: '🏠' },
  { value: 'other', label: 'Autre', emoji: '✦' },
];

export const SAVING_CATEGORIES: { value: SavingCategory; label: string; emoji: string }[] = [
  { value: 'epargne', label: 'Épargne', emoji: '🏦' },
  { value: 'investissement', label: 'Investissement', emoji: '📊' },
  { value: 'objectif', label: 'Objectif', emoji: '🎯' },
  { value: 'other', label: 'Autre', emoji: '✦' },
];