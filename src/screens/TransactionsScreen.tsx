import { useMemo, useState } from 'react'
import { CsvImportExport } from '@/features/transactions/CsvImportExport'
import { TransactionForm, TransactionFormValues } from '@/features/transactions/TransactionForm'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { useAuth } from '@/hooks/useAuth'
import { useCurrency } from '@/hooks/useCurrency'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { classifyExpense } from '@/services/ai/assistant'
import {
  downloadCsv,
  parseTransactionsCsv,
  toTransactionsCsv,
} from '@/services/csv/transactionsCsv'
import {
  TransactionInput,
  addTransaction,
  deleteTransaction,
  importTransactionsBatch,
  updateTransaction,
} from '@/services/firestore/transactions'
import { FinanceTransaction, TransactionType } from '@/types/finance'
import { totalExpenses, totalIncome } from '@/utils/finance'
import { formatCurrency, toMonthKey } from '@/utils/format'
import { showToast } from '@/components/common/Toast'

type DateRange = 'this-month' | 'last-30' | 'last-90' | 'this-year' | 'all' | 'custom'
type SortField = 'date' | 'amount' | 'description'
type SortDir = 'asc' | 'desc'

const parseTags = (tagsRaw?: string): string[] => {
  if (!tagsRaw) {
    return []
  }

  return tagsRaw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const toPayload = (values: TransactionFormValues): TransactionInput => ({
  amount: values.amount,
  categoryId: values.categoryId,
  date: values.date,
  description: values.description,
  tags: parseTags(values.tags),
  type: values.type,
})

export const TransactionsScreen = () => {
  const { user } = useAuth()
  const currency = useCurrency()
  const { categories, error, loading, transactions } = useFinanceCollections(user?.uid)
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | undefined>()
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | undefined>()
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [dateRange, setDateRange] = useState<DateRange>('this-month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let result = transactions

    // Date range filter
    if (dateRange === 'this-month') {
      const monthKey = toMonthKey(now.toISOString())
      result = result.filter((t) => toMonthKey(t.date) === monthKey)
    } else if (dateRange === 'last-30') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      result = result.filter((t) => t.date >= cutoff)
    } else if (dateRange === 'last-90') {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      result = result.filter((t) => t.date >= cutoff)
    } else if (dateRange === 'this-year') {
      const yearStart = `${now.getFullYear()}-01-01`
      result = result.filter((t) => t.date >= yearStart)
    } else if (dateRange === 'custom' && customFrom && customTo) {
      result = result.filter((t) => t.date.slice(0, 10) >= customFrom && t.date.slice(0, 10) <= customTo)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.categoryId.toLowerCase() === selectedCategory)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'amount') cmp = a.amount - b.amount
      else cmp = a.description.localeCompare(b.description)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [search, selectedCategory, typeFilter, dateRange, customFrom, customTo, sortField, sortDir, transactions])

  const currentMonth = toMonthKey(new Date().toISOString())
  const currentMonthTransactions = transactions.filter(
    (transaction) => toMonthKey(transaction.date) === currentMonth,
  )
  const monthExpense = totalExpenses(currentMonthTransactions)
  const monthIncome = totalIncome(currentMonthTransactions)
  const filteredExpense = totalExpenses(filteredTransactions)
  const filteredIncome = totalIncome(filteredTransactions)

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      return
    }

    setSubmitting(true)

    try {
      if (editingTransaction) {
        await updateTransaction(user.uid, editingTransaction.id, toPayload(values))
        setEditingTransaction(undefined)
      } else {
        await addTransaction(user.uid, toPayload(values))
      }

      setSuggestedCategoryId(undefined)
      setAiStatus(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (!user) {
      return
    }

    await deleteTransaction(user.uid, transactionId)
  }

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return
    setBulkDeleting(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteTransaction(user.uid, id)))
      showToast(`Deleted ${selectedIds.size} transactions.`, 'success')
      setSelectedIds(new Set())
    } catch {
      showToast('Failed to delete some transactions.', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleAiSuggestion = async (description: string) => {
    if (!description.trim()) {
      return
    }

    try {
      const suggestion = await classifyExpense(
        description,
        categories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      )

      const resolvedCategory =
        categories.find((category) => category.id === suggestion.categoryId)?.id ??
        categories.find(
          (category) => category.name.toLowerCase() === suggestion.categoryId.toLowerCase(),
        )?.id ??
        'other'

      setSuggestedCategoryId(resolvedCategory)
      setAiStatus(`Suggested category: ${resolvedCategory}`)
    } catch {
      setAiStatus('AI suggestion is currently unavailable. Please select a category manually.')
    }
  }

  const handleImport = async (file: File) => {
    if (!user) {
      return
    }

    const parsed = await parseTransactionsCsv(file)
    await importTransactionsBatch(user.uid, parsed)
  }

  const handleExport = (items: FinanceTransaction[]) => {
    const payload = items.map((item) => ({
      amount: item.amount,
      categoryId: item.categoryId,
      date: item.date,
      description: item.description,
      tags: item.tags,
      type: item.type,
    }))

    const csv = toTransactionsCsv(payload)
    downloadCsv('finsage-transactions.csv', csv)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)))
    }
  }

  const cycleSortField = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const insightData = [
    { label: 'Month income', value: formatCurrency(monthIncome, currency) },
    { label: 'Month expense', value: formatCurrency(monthExpense, currency) },
    { label: 'Showing', value: `${filteredTransactions.length} of ${transactions.length}` },
    { label: 'Filtered net', value: formatCurrency(filteredIncome - filteredExpense, currency) },
  ]

  return (
    <main className="screen stack">
      {error ? (
        <p className="error-text">
          Data access error: {error}. Confirm Firestore rules are deployed for your project and you
          are signed in.
        </p>
      ) : null}
      <header className="screen-header" style={{ animation: 'fade-up 400ms ease both' }}>
        <div>
          <h2>Transactions</h2>
          <p className="section-subtitle">Add, edit, and categorize daily expenses in seconds.</p>
        </div>
      </header>

      <section className="insight-strip">
        {insightData.map((item, i) => (
          <article key={item.label} className="insight-strip__item" style={{ '--stagger': i } as React.CSSProperties}>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <TransactionForm
        categories={categories}
        initialTransaction={editingTransaction}
        loading={submitting || loading}
        onCancel={() => {
          setEditingTransaction(undefined)
          setSuggestedCategoryId(undefined)
          setAiStatus(null)
        }}
        onRequestSuggestion={handleAiSuggestion}
        suggestedCategoryId={suggestedCategoryId}
        onSubmit={handleSubmit}
      />

      {aiStatus ? <p className="info-text info-text--highlight" style={{ animation: 'fade-up 300ms ease both' }}>{aiStatus}</p> : null}

      <CsvImportExport
        disabled={loading}
        transactions={filteredTransactions}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Filters section */}
      <section className="card stack" style={{ '--stagger': 2 } as React.CSSProperties}>
        <div className="field-row" style={{ flexWrap: 'wrap' }}>
          {/* Date range */}
          <label className="field">
            <span>📅 Date range</span>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)}>
              <option value="this-month">This month</option>
              <option value="last-30">Last 30 days</option>
              <option value="last-90">Last 90 days</option>
              <option value="this-year">This year</option>
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          {/* Type filter */}
          <label className="field">
            <span>🔀 Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}>
              <option value="all">All types</option>
              <option value="income">Income only</option>
              <option value="expense">Expense only</option>
            </select>
          </label>

          {/* Search */}
          <label className="field">
            <span>🔍 Search</span>
            <input
              placeholder="Search description or tags"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          {/* Category */}
          <label className="field">
            <span>📁 Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Custom date range inputs */}
        {dateRange === 'custom' && (
          <div className="field-row" style={{ animation: 'fade-up 300ms ease both' }}>
            <label className="field">
              <span>From</span>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </label>
            <label className="field">
              <span>To</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </label>
          </div>
        )}
      </section>

      {/* Bulk actions + sort controls */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="secondary-button" type="button" onClick={toggleSelectAll} style={{ fontSize: '0.85rem' }}>
            {selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0 ? '☑ Deselect all' : '☐ Select all'}
          </button>
          {selectedIds.size > 0 && (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedIds.size} selected</span>
              <button className="secondary-button" type="button" disabled={bulkDeleting}
                style={{ fontSize: '0.85rem', color: 'var(--danger)' }}
                onClick={() => void handleBulkDelete()}>
                🗑 Delete selected
              </button>
              <button className="secondary-button" type="button"
                style={{ fontSize: '0.85rem' }}
                onClick={() => handleExport(filteredTransactions.filter((t) => selectedIds.has(t.id)))}>
                📤 Export selected
              </button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button className="secondary-button" type="button" style={{ fontSize: '0.8rem' }} onClick={() => cycleSortField('date')}>
            Date{sortIndicator('date')}
          </button>
          <button className="secondary-button" type="button" style={{ fontSize: '0.8rem' }} onClick={() => cycleSortField('amount')}>
            Amount{sortIndicator('amount')}
          </button>
          <button className="secondary-button" type="button" style={{ fontSize: '0.8rem' }} onClick={() => cycleSortField('description')}>
            Name{sortIndicator('description')}
          </button>
        </div>
      </section>

      <TransactionTable
        categories={categories}
        currency={currency}
        transactions={filteredTransactions}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onDelete={handleDelete}
        onEdit={(transaction) => {
          setSuggestedCategoryId(undefined)
          setEditingTransaction(transaction)
        }}
      />
    </main>
  )
}
