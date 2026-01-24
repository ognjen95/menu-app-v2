'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
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
  Download,
  Trash2,
  Edit,
  Users,
  MapPin,
  Copy,
  ExternalLink,
  Loader2,
  Eye,
  Check,
  QrCode as QrCodeIcon,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import type { Table, QrCode as QrCodeType, Location } from '@/lib/types'

export default function TablesPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [previewQr, setPreviewQr] = useState<QrCodeType | null>(null)
  const [editQr, setEditQr] = useState<QrCodeType | null>(null)
  const [qrStyle, setQrStyle] = useState({ color: '#000000', background: '#ffffff' })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)
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

  const locations = useMemo(() => locationsData?.data?.locations || [], [locationsData])

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const generateQrCode = useMutation({
    mutationFn: (tableId: string) => apiPost<{ qr_code: QrCodeType }>('/qr-codes', {
      location_id: selectedLocationId,
      table_id: tableId,
      type: 'table',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', selectedLocationId] })
    },
  })

  const updateQrStyle = useMutation({
    mutationFn: ({ id, style }: { id: string; style: { color: string; background: string } }) => 
      apiPut<{ qr_code: QrCodeType }>(`/qr-codes/${id}`, { style }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', selectedLocationId] })
      setEditQr(null)
    },
  })

  const deleteQrCode = useMutation({
    mutationFn: (id: string) => apiDelete(`/qr-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes', selectedLocationId] })
    },
  })

  const deleteTable = useMutation({
    mutationFn: (id: string) => apiDelete(`/tables/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', selectedLocationId] })
    },
  })

  const downloadQr = (qrCode: QrCodeType) => {
    const svg = document.getElementById(`qr-${qrCode.id}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      ctx?.drawImage(img, 0, 0, 512, 512)
      const link = document.createElement('a')
      link.download = `qr-${qrCode.code}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
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
                          <div 
                            className="aspect-square bg-white rounded-lg flex items-center justify-center p-3 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            onClick={() => setPreviewQr(qrCode)}
                          >
                            <QRCodeSVG
                              id={`qr-${qrCode.id}`}
                              value={qrCode.url}
                              size={120}
                              fgColor={qrCode.style?.color || '#000000'}
                              bgColor={qrCode.style?.background || '#ffffff'}
                              level="M"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => generateQrCode.mutate(table.id)}
                              disabled={generateQrCode.isPending}
                            >
                              {generateQrCode.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <QrCodeIcon className="h-4 w-4 mr-2" />
                              )}
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
                                onClick={() => copyToClipboard(qrCode.url, qrCode.id)}
                                title="Copy URL"
                              >
                                {copiedId === qrCode.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => downloadQr(qrCode)}
                                title="Download QR"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => { setEditQr(qrCode); setQrStyle({ color: qrCode.style?.color || '#000000', background: qrCode.style?.background || '#ffffff' }) }}
                                title="Edit Style"
                              >
                                <Palette className="h-4 w-4" />
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
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => { if (confirm('Delete this table?')) deleteTable.mutate(table.id) }}
                          >
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

      {/* QR Code Preview Dialog */}
      <Dialog open={!!previewQr} onOpenChange={() => setPreviewQr(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
            <DialogDescription>Scan this QR code to open the menu</DialogDescription>
          </DialogHeader>
          {previewQr && (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-white rounded-lg" ref={qrRef}>
                <QRCodeSVG
                  id={`qr-preview-${previewQr.id}`}
                  value={previewQr.url}
                  size={256}
                  fgColor={previewQr.style?.color || '#000000'}
                  bgColor={previewQr.style?.background || '#ffffff'}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-mono text-muted-foreground">{previewQr.code}</p>
                <p className="text-xs text-muted-foreground break-all">{previewQr.url}</p>
              </div>
              <DialogFooter className="flex-row gap-2 sm:justify-center">
                <Button variant="outline" onClick={() => copyToClipboard(previewQr.url, previewQr.id)}>
                  {copiedId === previewQr.id ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy URL
                </Button>
                <Button onClick={() => downloadQr(previewQr)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => window.open(previewQr.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Edit Dialog */}
      <Dialog open={!!editQr} onOpenChange={() => setEditQr(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit QR Code Style</DialogTitle>
            <DialogDescription>Customize the colors of your QR code</DialogDescription>
          </DialogHeader>
          {editQr && (
            <div className="space-y-6">
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <QRCodeSVG
                  value={editQr.url}
                  size={200}
                  fgColor={qrStyle.color}
                  bgColor={qrStyle.background}
                  level="M"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-color">QR Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qr-color"
                      type="color"
                      value={qrStyle.color}
                      onChange={(e) => setQrStyle({ ...qrStyle, color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={qrStyle.color}
                      onChange={(e) => setQrStyle({ ...qrStyle, color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-bg">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qr-bg"
                      type="color"
                      value={qrStyle.background}
                      onChange={(e) => setQrStyle({ ...qrStyle, background: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={qrStyle.background}
                      onChange={(e) => setQrStyle({ ...qrStyle, background: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditQr(null)}>Cancel</Button>
                <Button 
                  onClick={() => updateQrStyle.mutate({ id: editQr.id, style: qrStyle })}
                  disabled={updateQrStyle.isPending}
                >
                  {updateQrStyle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Style
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
