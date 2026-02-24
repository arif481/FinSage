import { format } from 'date-fns'

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (value: string): string => {
  return format(new Date(value), 'MMM d, yyyy')
}

export const toMonthKey = (value: string): string => {
  return format(new Date(value), 'yyyy-MM')
}

export const toIsoDate = (value: Date = new Date()): string => {
  return format(value, 'yyyy-MM-dd')
}
