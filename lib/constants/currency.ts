import { Currency } from "../types";

export const CURRENCY_SYMBOL_MAP: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  RSD: 'RSD',
  BAM: 'KM',
  GBP: '£'
}

export const CURRENCIES = Object.keys(CURRENCY_SYMBOL_MAP);
