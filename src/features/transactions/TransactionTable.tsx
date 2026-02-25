import { Category, FinanceTransaction } from '@/types/finance'
import { formatCurrency, formatDate } from '@/utils/format'

interface TransactionTableProps {
  categories: Category[]
  currency: string
  transactions: FinanceTransaction[]
  onDelete: (transactionId: string) => Promise<void>
  onEdit: (transaction: FinanceTransaction) => void
}

const resolveCategoryName = (categories: Category[], categoryId: string): string => {
  return categories.find((category) => category.id === categoryId)?.name ?? 'Uncategorized'
}

export const TransactionTable = ({
  categories,
  currency,
  transactions,
  onDelete,
  onEdit,
}: TransactionTableProps) => {
  if (transactions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</p>
        <p className="empty-state">No transactions yet. Add your first expense to get started.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="transaction-table">
          <caption className="sr-only">Transactions list</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Description</th>
              <th scope="col">Category</th>
              <th scope="col">Type</th>
              <th scope="col">Amount</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => {
              const isExpense = transaction.type === 'expense'
              return (
                <tr
                  key={transaction.id}
                  style={{ animation: `fade-up 350ms cubic-bezier(0.16, 1, 0.3, 1) both ${Math.min(index * 40, 400)}ms` }}
                >
                  <td>{formatDate(transaction.date)}</td>
                  <td><strong>{transaction.description}</strong></td>
                  <td>
                    <span className="table-category">
                      {resolveCategoryName(categories, transaction.categoryId)}
                    </span>
                  </td>
                  <td>
                    <span className={`type-badge type-badge--${transaction.type}`}>
                      {isExpense ? '↓ Expense' : '↑ Income'}
                    </span>
                  </td>
                  <td className={isExpense ? 'amount amount--expense' : 'amount amount--income'}>
                    {isExpense ? '-' : '+'}
                    {formatCurrency(transaction.amount, currency)}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        aria-label={`Edit transaction ${transaction.description}`}
                        className="ghost-button"
                        type="button"
                        onClick={() => onEdit(transaction)}
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete transaction ${transaction.description}`}
                        className="danger-button"
                        type="button"
                        onClick={() => void onDelete(transaction.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
