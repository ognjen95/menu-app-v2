"use client"

import { useForm, FieldValues, DefaultValues } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ControlledField } from './controlled-field'

export interface FormField<T extends FieldValues> {
  name: keyof T & string
  label?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  description?: string
  validation?: any
  render?: (field: any) => React.ReactNode
}

export interface DynamicFormBuilderProps<T extends FieldValues> {
  fields: FormField<T>[]
  onSubmit: (data: T) => void | Promise<void>
  defaultValues?: DefaultValues<T>
  submitLabel?: string
  isLoading?: boolean
  className?: string
}

/**
 * Dynamic form builder component using react-hook-form
 * Automatically generates forms based on field configuration
 * 
 * @example
 * ```tsx
 * const fields: FormField<LoginFormData>[] = [
 *   { name: 'email', label: 'Email', type: 'email', validation: { required: 'Email is required' } },
 *   { name: 'password', label: 'Password', type: 'password' }
 * ]
 * 
 * <DynamicFormBuilder
 *   fields={fields}
 *   onSubmit={handleLogin}
 *   submitLabel="Sign In"
 * />
 * ```
 */
export function DynamicFormBuilder<T extends FieldValues>({
  fields,
  onSubmit,
  defaultValues,
  submitLabel = 'Submit',
  isLoading = false,
  className,
}: DynamicFormBuilderProps<T>) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<T>({
    defaultValues,
  })

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={className}>
      <div className="grid gap-4">
        {fields.map((field) => (
          <ControlledField
            key={field.name}
            name={field.name as any}
            control={control}
            label={field.label}
            placeholder={field.placeholder}
            type={field.type}
            disabled={field.disabled || isLoading}
            description={field.description}
            render={field.render}
          />
        ))}
      </div>
      
      <Button 
        type="submit" 
        className="w-full mt-4" 
        disabled={isLoading || isSubmitting}
      >
        {isLoading || isSubmitting ? 'Loading...' : submitLabel}
      </Button>
      
      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-500 text-center mt-2">
          Please fix the errors above
        </div>
      )}
    </form>
  )
}
