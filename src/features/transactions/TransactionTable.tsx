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
      <p className="empty-state">No transactions yet. Add your first expense to get started.</p>
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
                  style={{ animation: 'stagger-fade-in 0.3s ease forwards', opacity: 0, animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                >
                  <td>{formatDate(transaction.date)}</td>
                  <td>{transaction.description}</td>
                  <td>
                    <span className="table-category">
                      {resolveCategoryName(categories, transaction.categoryId)}
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
