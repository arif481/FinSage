import Papa from 'papaparse'
import { TransactionInput } from '@/services/firestore/transactions'

interface CsvTransactionRow {
  amount: string
  categoryId: string
  date: string
  description: string
  tags?: string
  type: string
}

const parseAmount = (value: string): number => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0
}

export const parseTransactionsCsv = (file: File): Promise<TransactionInput[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvTransactionRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message))
          return
        }

        const transactions = results.data
          .map((row) => {
            const normalizedType = row.type?.toLowerCase() === 'income' ? 'income' : 'expense'

            return {
              amount: parseAmount(row.amount),
              categoryId: row.categoryId?.trim() || 'other',
              date: row.date,
              description: row.description?.trim() || 'Imported transaction',
              tags: row.tags ? row.tags.split('|').map((item) => item.trim()) : [],
              type: normalizedType,
            } satisfies TransactionInput
          })
          .filter((transaction) => Number.isFinite(transaction.amount) && transaction.amount > 0)

        resolve(transactions)
      },
      error: (error) => reject(error),
    })
  })
}

export const toTransactionsCsv = (transactions: TransactionInput[]): string => {
  return Papa.unparse(
    transactions.map((transaction) => ({
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      date: transaction.date,
      description: transaction.description,
      tags: transaction.tags.join('|'),
      type: transaction.type,
    })),
  )
}

export const downloadCsv = (filename: string, csvText: string): void => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
