'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { LocationsGridSkeleton } from '@/components/ui/skeletons'

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
  const t = useTranslations('locationsPage')
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
        <Label htmlFor="loc-name">{t('locationNameRequired')}</Label>
        <Input
          id="loc-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('locationNamePlaceholder')}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-address">{t('address')}</Label>
          <Input
            id="loc-address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder={t('addressPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-city">{t('city')}</Label>
          <Input
            id="loc-city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder={t('cityPlaceholder')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-postal">{t('postalCode')}</Label>
          <Input
            id="loc-postal"
            value={formData.postal_code}
            onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
            placeholder={t('postalCodePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-country">{t('country')}</Label>
          <Input
            id="loc-country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder={t('countryPlaceholder')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="loc-phone">{t('phone')}</Label>
          <Input
            id="loc-phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={t('phonePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-email">{t('email')}</Label>
          <Input
            id="loc-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t('emailPlaceholder')}
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
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {(createMutation.isPending || updateMutation.isPending) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {editingLocation ? t('updateLocation') : t('createLocation')}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page header */}
      <motion.div 
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="sm" className="md:size-default self-start md:self-auto">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">{t('addLocation')}</span>
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addNewLocation')}</DialogTitle>
              <DialogDescription>
                {t('createNewLocation')}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Locations grid */}
      {isLoading ? (
        <LocationsGridSkeleton count={6} />
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noLocations')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('noLocationsDesc')}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addLocation')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {locations.map((location, index) => (
            <motion.div key={location.id} variants={staggerItemScale} custom={index}>
              <Card>
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
                    {location.is_active ? t('active') : t('inactive')}
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
                    {t('edit')}
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
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open: boolean) => !open && setEditingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editLocation')}</DialogTitle>
            <DialogDescription>
              {t('updateLocationDetails')}
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    </div>
  )
}
