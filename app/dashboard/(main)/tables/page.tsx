'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  QrCode,
  Download,
  Trash2,
  Edit,
  Users,
  MapPin,
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Table, QrCode as QrCodeType, Location } from '@/lib/types'

export default function TablesPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    capacity: '4',
    zone: '',
  })
  const queryClient = useQueryClient()

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>(`/locations`),
  })

  const locations = locationsData?.data?.locations || []

  // Auto-select first location
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  // Fetch tables for selected location
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', selectedLocationId],
    queryFn: () => apiGet<{ data: { tables: Table[] } }>(`/tables`, { location_id: selectedLocationId! }),
    enabled: !!selectedLocationId,
  })

  // Fetch QR codes for selected location
  const { data: qrCodesData } = useQuery({
    queryKey: ['qr-codes', selectedLocationId],
    queryFn: () => apiGet<{ data: { qr_codes: QrCodeType[] } }>(`/qr-codes`, { location_id: selectedLocationId! }),
    enabled: !!selectedLocationId,
  })

  const tables = tablesData?.data?.tables || []
  const qrCodes = qrCodesData?.data?.qr_codes || []

  // Group tables by zone
  const tablesByZone = tables.reduce((acc, table) => {
    const zone = table.zone || 'No Zone'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(table)
    return acc
  }, {} as Record<string, Table[]>)

  const getTableQrCode = (tableId: string) => {
    return qrCodes.find(qr => qr.table_id === tableId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const createTable = useMutation({
    mutationFn: (data: typeof formData) => apiPost<{ table: Table }>('/tables', {
      location_id: selectedLocationId,
      name: data.name,
      capacity: parseInt(data.capacity) || 4,
      zone: data.zone || undefined,
      status: 'available',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', selectedLocationId] })
      setIsCreateOpen(false)
      setFormData({ name: '', capacity: '4', zone: '' })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createTable.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables & QR Codes</h1>
          <p className="text-muted-foreground">
            Manage your tables and generate QR codes for ordering
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All QR
          </Button>
          <Button disabled={!selectedLocationId} onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Location selector */}
      <div className="flex flex-wrap gap-2">
        {locations.map((location) => (
          <Button
            key={location.id}
            variant={selectedLocationId === location.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLocationId(location.id)}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {location.name}
          </Button>
        ))}
        {locations.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            No locations found.
            <Link href="/dashboard/settings/locations" className="text-primary underline">
              Create a location first
            </Link>
          </div>
        )}
      </div>

      {/* Tables grid */}
      {!selectedLocationId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a location to manage tables</p>
          </CardContent>
        </Card>
      ) : tablesLoading ? (
        <div className="text-muted-foreground">Loading tables...</div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tables in this location</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(tablesByZone).map(([zone, zoneTables]) => (
            <div key={zone}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>{zone}</span>
                <Badge variant="secondary">{zoneTables.length} tables</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {zoneTables.map((table) => {
                  const qrCode = getTableQrCode(table.id)
                  return (
                    <Card 
                      key={table.id}
                      className={cn(
                        'relative overflow-hidden transition-all',
                        table.status === 'occupied' && 'border-yellow-500',
                        table.status === 'reserved' && 'border-blue-500',
                      )}
                    >
                      {/* Status indicator */}
                      <div className={cn(
                        'absolute top-0 left-0 right-0 h-1',
                        table.status === 'available' && 'bg-green-500',
                        table.status === 'occupied' && 'bg-yellow-500',
                        table.status === 'reserved' && 'bg-blue-500',
                      )} />

                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{table.name}</CardTitle>
                          <Badge variant={
                            table.status === 'available' ? 'default' :
                            table.status === 'occupied' ? 'secondary' : 'outline'
                          }>
                            {table.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          <Users className="h-3 w-3 inline mr-1" />
                          Capacity: {table.capacity}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* QR Code preview */}
                        {qrCode ? (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-4">
                            <div className="text-center">
                              <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                              <p className="text-xs mt-2 font-mono">{qrCode.code}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4 mr-2" />
                              Generate QR
                            </Button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1">
                          {qrCode && (
                            <>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(qrCode.url)}
                                title="Copy URL"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                title="Download QR"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => window.open(qrCode.url, '_blank')}
                                title="Open Menu"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <div className="flex-1" />
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Add table card */}
                <Card 
                  className="border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add Table</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Table Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
            <DialogDescription>Add a new table to this location</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Table Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Table 1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Input
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Outdoor, Terrace, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTable.isPending}>
                {createTable.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Table
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
