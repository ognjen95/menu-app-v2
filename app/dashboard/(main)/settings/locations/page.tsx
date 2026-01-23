'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  MoreVertical,
  Store,
  QrCode,
  Loader2,
} from 'lucide-react'

type Location = {
  id: string
  name: string
  slug: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  phone?: string
  email?: string
  is_active: boolean
  service_modes: string[]
  created_at: string
}

export default function LocationsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'RS',
    phone: '',
    email: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })


  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiPost('/locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setIsCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & typeof formData) =>
      apiPatch(`/locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setEditingLocation(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })

  const locations = data?.data?.locations || []

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'RS',
      phone: '',
      email: '',
    })
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      postal_code: location.postal_code || '',
      country: location.country || 'RS',
      phone: location.phone || '',
      email: location.email || '',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, ...formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  // Form JSX to be inlined in dialogs
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="loc-name">Location Name *</Label>
        <Input
          id="loc-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Main Restaurant"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-address">Address</Label>
          <Input
            id="loc-address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main Street"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-city">City</Label>
          <Input
            id="loc-city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Belgrade"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-postal">Postal Code</Label>
          <Input
            id="loc-postal"
            value={formData.postal_code}
            onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
            placeholder="11000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-country">Country</Label>
          <Input
            id="loc-country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="RS"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-phone">Phone</Label>
          <Input
            id="loc-phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+381 11 123 4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-email">Email</Label>
          <Input
            id="loc-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="location@example.com"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateOpen(false)
            setEditingLocation(null)
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {editingLocation ? 'Update' : 'Create'} Location
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Manage your restaurant locations
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Create a new location for your business
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first location to start managing tables and menus
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{location.name}</CardTitle>
                      <CardDescription className="text-xs">/{location.slug}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={location.is_active ? 'default' : 'secondary'}>
                    {location.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{location.address}, {location.city}</span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{location.email}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(location)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(location.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open: boolean) => !open && setEditingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location details
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    </div>
  )
}
