import { Timestamp } from 'firebase/firestore'

const toIsoString = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string') {
    return value
  }

  return new Date().toISOString()
}

export const mapStringField = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback
}

export const mapNumberField = (value: unknown, fallback = 0): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export const mapStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

export const mapIsoDate = toIsoString
