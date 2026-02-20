'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import type { TableFormData } from '../domains/types'

const NEW_ZONE_VALUE = '__new__'

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: TableFormData
  onFormChange: (data: TableFormData) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  existingZones: string[]
  errors?: Record<string, string>
  translations: {
    addTable: string
    addTableDesc: string
    tableNameRequired: string
    tableNamePlaceholder: string
    capacity: string
    zone: string
    zonePlaceholder: string
    newZone: string
    newZonePlaceholder: string
    cancel: string
  }
}

export function CreateTableDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  isPending,
  existingZones,
  errors = {},
  translations: t,
}: CreateTableDialogProps) {
  const [isCreatingNewZone, setIsCreatingNewZone] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')

  const handleZoneChange = (value: string) => {
    if (value === NEW_ZONE_VALUE) {
      setIsCreatingNewZone(true)
      setNewZoneName('')
    } else {
      setIsCreatingNewZone(false)
      onFormChange({ ...formData, zone: value })
    }
  }

  const handleNewZoneChange = (value: string) => {
    setNewZoneName(value)
    onFormChange({ ...formData, zone: value })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsCreatingNewZone(false)
      setNewZoneName('')
    }
    onOpenChange(isOpen)
  }

  // Check if current zone is in existing zones or is new
  const currentZoneInList = existingZones.includes(formData.zone)
  const selectValue = isCreatingNewZone ? NEW_ZONE_VALUE : (currentZoneInList ? formData.zone : (formData.zone ? NEW_ZONE_VALUE : ''))

  // If formData.zone is preselected but not in list, switch to new zone mode
  useEffect(() => {
    if (formData.zone && !existingZones.includes(formData.zone) && !isCreatingNewZone) {
      setIsCreatingNewZone(true)
      setNewZoneName(formData.zone)
    }
  }, [formData.zone, existingZones, isCreatingNewZone])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.addTable}</DialogTitle>
          <DialogDescription>{t.addTableDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.tableNameRequired}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder={t.tableNamePlaceholder}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">{t.capacity}</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => onFormChange({ ...formData, capacity: e.target.value })}
                placeholder="4"
                className={errors.capacity ? 'border-destructive' : ''}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">{t.zone}</Label>
              {existingZones.length > 0 ? (
                <div className="space-y-2">
                  <Select value={selectValue} onValueChange={handleZoneChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.zonePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {existingZones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_ZONE_VALUE}>
                        <span className="flex items-center gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          {t.newZone}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isCreatingNewZone && (
                    <Input
                      value={newZoneName}
                      onChange={(e) => handleNewZoneChange(e.target.value)}
                      placeholder={t.newZonePlaceholder}
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <Input
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => onFormChange({ ...formData, zone: e.target.value })}
                  placeholder={t.zonePlaceholder}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.addTable}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
