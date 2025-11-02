import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  const percentage = value > 1 ? value : value * 100
  return `${percentage.toFixed(fractionDigits)}%`
}

export function formatNumber(value: number | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return Number(value).toFixed(fractionDigits)
}
