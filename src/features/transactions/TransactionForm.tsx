import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Category, FinanceTransaction } from '@/types/finance'
import { toIsoDate } from '@/utils/format'

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  tags: z.string().optional(),
  type: z.enum(['income', 'expense']),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  categories: Category[]
  initialTransaction?: FinanceTransaction
  loading?: boolean
  onCancel?: () => void
  onRequestSuggestion?: (description: string) => Promise<void>
  suggestedCategoryId?: string
  onSubmit: (values: TransactionFormValues) => Promise<void>
}

const buildDefaults = (transaction?: FinanceTransaction): TransactionFormValues => ({
  amount: transaction?.amount ?? 0,
  categoryId: transaction?.categoryId ?? 'other',
  date: transaction?.date?.slice(0, 10) ?? toIsoDate(),
  description: transaction?.description ?? '',
  tags: transaction?.tags?.join(', ') ?? '',
  type: transaction?.type ?? 'expense',
})

export const TransactionForm = ({
  categories,
  initialTransaction,
  loading,
  onCancel,
  onRequestSuggestion,
  suggestedCategoryId,
  onSubmit,
}: TransactionFormProps) => {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildDefaults(initialTransaction),
  })

  useEffect(() => {
    reset(buildDefaults(initialTransaction))
  }, [initialTransaction, reset])

  useEffect(() => {
    if (!suggestedCategoryId) {
      return
    }

    setValue('categoryId', suggestedCategoryId)
  }, [setValue, suggestedCategoryId])

  const description = watch('description')

  return (
    <form
      className="card stack"
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          await onSubmit(values)

          if (!initialTransaction) {
            reset(buildDefaults())
          }
        })(event)
      }}
    >
      <div className="field-row">
        <label className="field">
          <span>Type</span>
          <select {...register('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>

        <label className="field">
          <span>Date</span>
          <input type="date" {...register('date')} />
          {errors.date ? <small className="error-text">{errors.date.message}</small> : null}
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Amount</span>
          <input step="0.01" type="number" {...register('amount', { valueAsNumber: true })} />
          {errors.amount ? <small className="error-text">{errors.amount.message}</small> : null}
        </label>

        <label className="field">
          <span>Category</span>
          <select {...register('categoryId')}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId ? <small className="error-text">{errors.categoryId.message}</small> : null}
        </label>
      </div>

      <label className="field">
        <span>Description</span>
        <input placeholder="e.g. Starbucks coffee" type="text" {...register('description')} />
        {errors.description ? <small className="error-text">{errors.description.message}</small> : null}
      </label>

      <div className="field-row">
        <label className="field">
          <span>Tags (comma separated)</span>
          <input placeholder="coffee, work" type="text" {...register('tags')} />
        </label>

        <div className="field field--button">
          <span>AI assistance</span>
          <button
            className="secondary-button"
            disabled={!description || isSubmitting || loading}
            type="button"
            onClick={() => {
              if (!onRequestSuggestion || !description) {
                return
              }

              void onRequestSuggestion(description)
            }}
          >
            Suggest category
          </button>
        </div>
      </div>

      <div className="button-row">
        <button className="primary-button" disabled={isSubmitting || loading} type="submit">
          {initialTransaction ? 'Update transaction' : 'Add transaction'}
        </button>
        {onCancel ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
