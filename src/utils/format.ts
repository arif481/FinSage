import { format } from 'date-fns'

/** Maps currency codes to their best locale for proper number formatting */
const currencyLocaleMap: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
}

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const locale = currencyLocaleMap[currency] ?? 'en-US'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

/** Currency symbol lookup for compact display */
export const currencySymbol = (currency: string): string => {
  const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' }
  return map[currency] ?? currency
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
