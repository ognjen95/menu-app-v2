"use client"

import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginUser } from '@/app/auth/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LoginFormData {
  email: string
  password: string
}

/**
 * Login Form Container
 * Handles login form logic and state management
 */
export function LoginFormContainer() {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    
    const result = await loginUser({ message: '' }, formData)
    
    if (result?.message) {
      setError(result.message)
      setIsLoading(false)
    }
    // If successful, server action will redirect
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          {...register('email', { required: 'Email is required' })}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      
      <div className="grid gap-2 mt-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password', { required: 'Password is required' })}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button className="w-full mt-4" type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
      
      {error && (
        <p className="text-sm text-red-500 text-center py-2">{error}</p>
      )}
    </form>
  )
}
