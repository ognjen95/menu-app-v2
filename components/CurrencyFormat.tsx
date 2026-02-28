import { CURRENCY_SYMBOL_MAP } from '@/lib/constants/currency';
import { Currency } from '@/lib/types';
import React from 'react'

const CurrencyFormat = ({ currency, value }: { currency?: Currency; value: number }) => {
  const _currency = currency ? CURRENCY_SYMBOL_MAP[currency] : '€';
  
  return (
    <>{_currency} {value.toFixed(2)}</>
  )
}

export default CurrencyFormat