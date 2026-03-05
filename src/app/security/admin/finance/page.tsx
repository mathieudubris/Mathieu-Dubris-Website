"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/utils/firebase-api';
import {
  addTransaction,
  getTransactions,
  deleteTransaction,
  computeStats,
  groupByMonth,
  formatCurrency,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  SAVING_CATEGORIES,
  Transaction,
  TransactionType,
  NewTransaction,
} from '@/utils/finance-api';
import { Timestamp } from 'firebase/firestore';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  ChevronDown,
  BarChart2,
  List,
} from 'lucide-react';
import Link from 'next/link';
import styles from './finance.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(val: Timestamp | Date | string): string {
  if (!val) return '';
  if (val instanceof Timestamp) return val.toDate().toISOString().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function formatDate(val: Timestamp | Date | string): string {
  const d = val instanceof Timestamp ? val.toDate() : new Date(val as string);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

const TYPE_META = {
  income: { label: 'Revenu', color: '#22c55e', icon: TrendingUp },
  expense: { label: 'Dépense', color: '#ef4444', icon: TrendingDown },
  saving: { label: 'Épargne', color: '#c7ff44', icon: PiggyBank },
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: Record<string, { income: number; expense: number; saving: number }> }) {
  const months = Object.keys(data).sort().slice(-6);
  if (months.length === 0) return <div className={styles.chartEmpty}>Aucune donnée</div>;
  const allValues = months.flatMap((m) => [data[m].income, data[m].expense, data[m].saving]);
  const max = Math.max(...allValues, 1);

  return (
    <div className={styles.barChart}>
      {months.map((m) => (
        <div key={m} className={styles.barGroup}>
          <div className={styles.bars}>
            <div className={styles.barWrap} title={`Revenus: ${formatCurrency(data[m].income)}`}>
              <div className={styles.bar} style={{ height: `${(data[m].income / max) * 100}%`, background: '#22c55e' }} />
            </div>
            <div className={styles.barWrap} title={`Dépenses: ${formatCurrency(data[m].expense)}`}>
              <div className={styles.bar} style={{ height: `${(data[m].expense / max) * 100}%`, background: '#ef4444' }} />
            </div>
            <div className={styles.barWrap} title={`Épargne: ${formatCurrency(data[m].saving)}`}>
              <div className={styles.bar} style={{ height: `${(data[m].saving / max) * 100}%`, background: '#c7ff44' }} />
            </div>
          </div>
          <span className={styles.barLabel}>{monthLabel(m)}</span>
        </div>
      ))}
      <div className={styles.chartLegend}>
        <span><span style={{ background: '#22c55e' }} />Revenus</span>
        <span><span style={{ background: '#ef4444' }} />Dépenses</span>
        <span><span style={{ background: '#c7ff44' }} />Épargne</span>
      </div>
    </div>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────────

function DonutChart({ income, expense, saving }: { income: number; expense: number; saving: number }) {
  const total = income + expense + saving;
  if (total === 0) return <div className={styles.chartEmpty}>Aucune donnée</div>;

  const segments = [
    { value: income, color: '#22c55e', label: 'Revenus' },
    { value: expense, color: '#ef4444', label: 'Dépenses' },
    { value: saving, color: '#c7ff44', label: 'Épargne' },
  ];
  let cumulative = 0;
  const r = 40;
  const cx = 60, cy = 60;

  const paths = segments.map((seg) => {
    const pct = seg.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumulative + pct) * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, color: seg.color, label: seg.label, pct };
  });

  return (
    <div className={styles.donut}>
      <svg viewBox="0 0 120 120" width="120" height="120">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} opacity="0.9" />
        ))}
        <circle cx={cx} cy={cy} r={24} fill="#0e0e0e" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#e0e0e0" fontSize="7" fontWeight="700">Balance</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#c7ff44" fontSize="6">
          {((income - expense - saving) >= 0 ? '+' : '') + formatCurrency(income - expense - saving)}
        </text>
      </svg>
      <div className={styles.donutLegend}>
        {paths.map((p, i) => (
          <div key={i} className={styles.donutItem}>
            <span className={styles.donutDot} style={{ background: p.color }} />
            <span>{p.label}</span>
            <span className={styles.donutPct}>{(p.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal Add Transaction ─────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onAdd: (t: NewTransaction) => Promise<void>;
  userId: string;
}

function AddModal({ onClose, onAdd, userId }: ModalProps) {
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('freelance');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const cats = type === 'income' ? INCOME_CATEGORIES : type === 'expense' ? EXPENSE_CATEGORIES : SAVING_CATEGORIES;

  useEffect(() => {
    setCategory(cats[0].value);
  }, [type]);

  const handleSubmit = async () => {
    if (!amount || !label || !date) return;
    setLoading(true);
    await onAdd({
      type,
      amount: parseFloat(amount),
      label,
      description,
      category: category as Transaction['category'],
      date: Timestamp.fromDate(new Date(date)),
      userId,
      currency: 'EUR',
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Nouvelle transaction</span>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Type selector */}
        <div className={styles.typeTabs}>
          {(['income', 'expense', 'saving'] as TransactionType[]).map((t) => (
            <button
              key={t}
              className={`${styles.typeTab} ${type === t ? styles.typeTabActive : ''}`}
              style={type === t ? { color: TYPE_META[t].color, borderColor: TYPE_META[t].color } : {}}
              onClick={() => setType(t)}
            >
              {TYPE_META[t].label}
            </button>
          ))}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Montant (€)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Intitulé</label>
            <input
              type="text"
              placeholder="Ex: Mission design, Spotify..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Catégorie</label>
            <div className={styles.selectWrap}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={styles.input}>
                {cats.map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.selectIcon} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Description (optionnel)</label>
            <input
              type="text"
              placeholder="Notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading || !amount || !label}
        >
          {loading ? 'Enregistrement...' : '+ Ajouter'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const txs = await getTransactions(u.uid);
        setTransactions(txs);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const stats = useMemo(() => computeStats(transactions), [transactions]);
  const monthlyData = useMemo(() => groupByMonth(transactions), [transactions]);

  const months = useMemo(() => {
    const keys = Object.keys(monthlyData).sort().reverse();
    return keys;
  }, [monthlyData]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterMonth !== 'all') {
        const d = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date as string);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== filterMonth) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterMonth]);

  const handleAdd = async (data: NewTransaction) => {
    const id = await addTransaction(data);
    setTransactions((prev) => [{ ...data, id, createdAt: Timestamp.now() } as Transaction, ...prev]);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/security/admin" className={styles.backBtn}>
            <ArrowLeft size={16} /> Admin
          </Link>
          <div className={styles.headerTag}>Finance</div>
          <h1 className={styles.title}>Tableau de bord</h1>
          <p className={styles.subtitle}>Suivez vos revenus, dépenses et épargne.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={16} /> Ajouter
        </button>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#22c55e' }}><TrendingUp size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statVal}>{formatCurrency(stats.totalIncome)}</span>
            <span className={styles.statLbl}>Revenus totaux</span>
          </div>
          <span className={styles.statBadge} style={{ color: '#22c55e', background: 'rgba(34,197,94,.1)' }}>+</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#ef4444' }}><TrendingDown size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statVal}>{formatCurrency(stats.totalExpenses)}</span>
            <span className={styles.statLbl}>Dépenses totales</span>
          </div>
          <span className={styles.statBadge} style={{ color: '#ef4444', background: 'rgba(239,68,68,.1)' }}>−</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#c7ff44' }}><PiggyBank size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statVal}>{formatCurrency(stats.totalSavings)}</span>
            <span className={styles.statLbl}>Épargne</span>
          </div>
          <span className={styles.statBadge} style={{ color: '#c7ff44', background: 'rgba(199,255,68,.1)' }}>
            {stats.savingsRate.toFixed(0)}%
          </span>
        </div>
        <div className={styles.statCard} style={{ borderColor: stats.balance >= 0 ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)' }}>
          <div className={styles.statIcon} style={{ color: stats.balance >= 0 ? '#22c55e' : '#ef4444' }}><Wallet size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statVal} style={{ color: stats.balance >= 0 ? '#22c55e' : '#ef4444' }}>
              {formatCurrency(stats.balance)}
            </span>
            <span className={styles.statLbl}>Solde net</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}><BarChart2 size={15} /> Évolution mensuelle</span>
          </div>
          <MiniBarChart data={monthlyData} />
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Répartition</span>
          </div>
          <DonutChart
            income={stats.totalIncome}
            expense={stats.totalExpenses}
            saving={stats.totalSavings}
          />
        </div>
      </div>

      {/* Transactions */}
      <div className={styles.txSection}>
        <div className={styles.txHeader}>
          <span className={styles.txTitle}><List size={15} /> Transactions</span>
          <div className={styles.filters}>
            <div className={styles.selectWrap}>
              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
              >
                <option value="all">Tous</option>
                <option value="income">Revenus</option>
                <option value="expense">Dépenses</option>
                <option value="saving">Épargne</option>
              </select>
              <ChevronDown size={12} className={styles.selectIcon} />
            </div>
            <div className={styles.selectWrap}>
              <select
                className={styles.filterSelect}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">Tous les mois</option>
                {months.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
              <ChevronDown size={12} className={styles.selectIcon} />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <PiggyBank size={32} />
            <p>Aucune transaction pour l'instant.</p>
            <button className={styles.emptyAdd} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Ajouter ma première transaction
            </button>
          </div>
        ) : (
          <div className={styles.txList}>
            {filtered.map((t) => {
              const meta = TYPE_META[t.type];
              const cats = t.type === 'income' ? INCOME_CATEGORIES : t.type === 'expense' ? EXPENSE_CATEGORIES : SAVING_CATEGORIES;
              const cat = cats.find((c) => c.value === t.category);
              return (
                <div key={t.id} className={styles.txRow}>
                  <div className={styles.txEmoji}>{cat?.emoji ?? '✦'}</div>
                  <div className={styles.txBody}>
                    <span className={styles.txLabel}>{t.label}</span>
                    {t.description && <span className={styles.txDesc}>{t.description}</span>}
                    <span className={styles.txMeta}>{cat?.label} · {formatDate(t.date)}</span>
                  </div>
                  <div className={styles.txRight}>
                    <span
                      className={styles.txAmount}
                      style={{ color: meta.color }}
                    >
                      {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                    </span>
                    <span className={styles.txType} style={{ color: meta.color, background: `${meta.color}18` }}>
                      {meta.label}
                    </span>
                  </div>
                  <button
                    className={styles.txDelete}
                    onClick={() => handleDelete(t.id)}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && user && (
        <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} userId={user.uid} />
      )}
    </div>
  );
}