import { useMemo, useState } from 'react'
import { CsvImportExport } from '@/features/transactions/CsvImportExport'
import { TransactionForm, TransactionFormValues } from '@/features/transactions/TransactionForm'
import { TransactionTable } from '@/features/transactions/TransactionTable'
import { useAuth } from '@/hooks/useAuth'
import { useFinanceCollections } from '@/hooks/useFinanceCollections'
import { classifyExpense } from '@/services/ai/assistant'
import { downloadCsv, parseTransactionsCsv, toTransactionsCsv } from '@/services/csv/transactionsCsv'
import {
  TransactionInput,
  addTransaction,
  deleteTransaction,
  importTransactionsBatch,
  updateTransaction,
} from '@/services/firestore/transactions'
import { FinanceTransaction } from '@/types/finance'

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
  const { categories, loading, transactions } = useFinanceCollections(user?.uid)
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | undefined>()
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | undefined>()
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(search.toLowerCase()) ||
        transaction.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'all' || transaction.categoryId.toLowerCase() === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory, transactions])

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
        categories.find((category) => category.name.toLowerCase() === suggestion.categoryId.toLowerCase())?.id ??
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

  return (
    <main className="screen stack">
      <header className="screen-header">
        <div>
          <h2>Transactions</h2>
          <p className="section-subtitle">Add, edit, and categorize daily expenses in seconds.</p>
        </div>
      </header>

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

      {aiStatus ? <p className="info-text">{aiStatus}</p> : null}

      <CsvImportExport
        disabled={loading}
        transactions={filteredTransactions}
        onExport={handleExport}
        onImport={handleImport}
      />

      <section className="card field-row">
        <label className="field">
          <span>Search</span>
          <input
            placeholder="Search description or tags"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Category</span>
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
      </section>

      <TransactionTable
        categories={categories}
        currency="USD"
        transactions={filteredTransactions}
        onDelete={handleDelete}
        onEdit={(transaction) => {
          setSuggestedCategoryId(undefined)
          setEditingTransaction(transaction)
        }}
      />
    </main>
  )
}
