'use client'

import { useState, useEffect, useRef } from 'react'

type UseOrderUIStateProps = {
  open: boolean
  onResetMenuState: () => void
  onResetCustomerForm: () => void
  searchQuery?: string
}

export function useOrderUIState({
  open,
  onResetMenuState,
  onResetCustomerForm,
  searchQuery,
}: UseOrderUIStateProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1)
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false)
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null!)

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile search focus management
  useEffect(() => {
    if (isMobile && mobileStep === 2 && isMobileSearchFocused && mobileSearchInputRef.current) {
      const input = mobileSearchInputRef.current
      const length = input.value.length
      input.focus()
      input.setSelectionRange(length, length)
    }
  }, [isMobile, mobileStep, isMobileSearchFocused, searchQuery])

  // Reset on close
  useEffect(() => {
    if (!open) {
      onResetMenuState()
      setShowCart(false)
      setMobileStep(1)
      onResetCustomerForm()
    }
  }, [open, onResetMenuState, onResetCustomerForm])

  return {
    isMobile,
    showCart,
    setShowCart,
    mobileStep,
    setMobileStep,
    isCustomerInfoOpen,
    setIsCustomerInfoOpen,
    isMobileSearchFocused,
    setIsMobileSearchFocused,
    mobileSearchInputRef,
  }
}
