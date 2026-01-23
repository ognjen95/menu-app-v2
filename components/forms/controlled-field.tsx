"use client"

import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface ControlledFieldProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  className?: string
  description?: string
  render?: (field: any) => React.ReactNode
}

/**
 * Reusable controlled field component for react-hook-form
 * Supports custom render functions or defaults to Input component
 */
export function ControlledField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  description,
  render,
}: ControlledFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className={className}>
          {label && <Label htmlFor={name}>{label}</Label>}
          {render ? (
            render(field)
          ) : (
            <Input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              className={error ? 'border-red-500' : ''}
            />
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {error && (
            <p className="text-sm text-red-500 mt-1">{error.message}</p>
          )}
        </div>
      )}
    />
  )
}
