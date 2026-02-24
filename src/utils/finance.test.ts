import { describe, expect, it } from 'vitest'
import { budgetProgress, netBalance, totalExpenses, totalIncome } from '@/utils/finance'

describe('finance utilities', () => {
  const transactions = [
    {
      id: 'a',
      amount: 100,
      categoryId: 'salary',
      date: '2026-01-02',
      description: 'Salary',
      tags: [],
      type: 'income' as const,
    },
    {
      id: 'b',
      amount: 45,
      categoryId: 'groceries',
      date: '2026-01-05',
      description: 'Groceries',
      tags: [],
      type: 'expense' as const,
    },
    {
      id: 'c',
      amount: 20,
      categoryId: 'dining',
      date: '2026-01-09',
      description: 'Lunch',
      tags: [],
      type: 'expense' as const,
    },
  ]

  it('computes income, expense and net totals', () => {
    expect(totalIncome(transactions)).toBe(100)
    expect(totalExpenses(transactions)).toBe(65)
    expect(netBalance(transactions)).toBe(35)
  })

  it('builds budget progress by category', () => {
    const progress = budgetProgress(
      [
        { id: 'p1', categoryId: 'groceries', month: '2026-01', limit: 200 },
        { id: 'p2', categoryId: 'dining', month: '2026-01', limit: 60 },
      ],
      transactions,
      '2026-01',
    )

    expect(progress).toHaveLength(2)
    expect(progress[0]?.spent).toBe(45)
    expect(progress[1]?.remaining).toBe(40)
  })
})
