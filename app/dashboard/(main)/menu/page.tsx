'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMenus, useCreateMenu, useUpdateMenu } from '@/lib/hooks/use-menu'
import { useLocations } from '@/lib/hooks/use-tenant'
import type { Menu } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Badge } from '@/components/ui/badge'
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { MenuSelectionGridSkeleton } from '@/components/ui/skeletons'
import { Plus, Edit, Clock, Loader2, BookOpen } from 'lucide-react'

export default function MenuListPage() {
  const t = useTranslations('menuPage')
  const router = useRouter()
  
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    location_id: '' as string | null,
    is_active: true,
    available_from: '',
    available_until: '',
    available_days: [0, 1, 2, 3, 4, 5, 6] as number[],
  })

  const { data: menusData, isLoading: menusLoading } = useMenus()
  const { data: locationsData } = useLocations()
  
  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()
  
  const menus = useMemo(() => menusData?.data?.menus || [], [menusData?.data?.menus])
  const locations = useMemo(() => locationsData?.locations || [], [locationsData?.locations])

  const resetMenuForm = () => {
    setMenuForm({
      name: '',
      description: '',
      location_id: null,
      is_active: true,
      available_from: '',
      available_until: '',
      available_days: [0, 1, 2, 3, 4, 5, 6],
    })
    setEditingMenu(null)
  }

  const openEditMenuDialog = (menu: Menu) => {
    setEditingMenu(menu)
    setMenuForm({
      name: menu.name,
      description: menu.description || '',
      location_id: menu.location_id,
      is_active: menu.is_active,
      available_from: menu.available_from || '',
      available_until: menu.available_until || '',
      available_days: menu.available_days || [0, 1, 2, 3, 4, 5, 6],
    })
    setIsCreateMenuOpen(true)
  }

  const handleSubmitMenu = (e: React.FormEvent) => {
    e.preventDefault()
    const menuData = {
      name: menuForm.name,
      description: menuForm.description || undefined,
      location_id: menuForm.location_id || undefined,
      is_active: menuForm.is_active,
      available_from: menuForm.available_from || undefined,
      available_until: menuForm.available_until || undefined,
      available_days: menuForm.available_days,
    }

    if (editingMenu) {
      updateMenu.mutate({ id: editingMenu.id, ...menuData }, {
        onSuccess: () => {
          setIsCreateMenuOpen(false)
          resetMenuForm()
        }
      })
    } else {
      createMenu.mutate(menuData, {
        onSuccess: () => {
          setIsCreateMenuOpen(false)
          resetMenuForm()
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t('selectMenuToStart')}</p>
        </div>
        <Button onClick={() => setIsCreateMenuOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('createMenu')}
        </Button>
      </div>

      {menusLoading ? (
        <MenuSelectionGridSkeleton count={6} />
      ) : menus.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('noMenusYet')}</h2>
            <p className="text-muted-foreground mb-6">{t('createFirstMenuDesc')}</p>
            <Button onClick={() => setIsCreateMenuOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t('createFirstMenu')}
            </Button>
          </div>
        </Card>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {menus.map((menu, index) => (
            <motion.div key={menu.id} variants={staggerItemScale} custom={index}>
              <Card 
                className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all hover:shadow-lg group relative"
                onClick={() => router.push(`/dashboard/menu/${menu.id}`)}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => { e.stopPropagation(); openEditMenuDialog(menu) }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">{menu.name}</CardTitle>
                        {!menu.is_active && <Badge variant="secondary" className="text-xs">{t('hidden')}</Badge>}
                      </div>
                      {menu.description && (
                        <CardDescription className="line-clamp-1">{menu.description}</CardDescription>
                      )}
                      {(menu.available_from || menu.available_until) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {menu.available_from || '00:00'} - {menu.available_until || '24:00'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create/Edit Menu Dialog */}
      <Dialog open={isCreateMenuOpen} onOpenChange={(open) => { setIsCreateMenuOpen(open); if (!open) resetMenuForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMenu ? t('editMenuTitle') : t('createMenuTitle')}</DialogTitle>
            <DialogDescription>{editingMenu ? t('editMenuDesc') : t('createMenuDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitMenu} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">{t('menuName')} *</Label>
              <Input
                id="menu-name"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                placeholder={t('menuNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-description">{t('menuDescription')}</Label>
              <Input
                id="menu-description"
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                placeholder={t('menuDescPlaceholder')}
              />
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <Label>{t('location')}</Label>
              <Select
                value={menuForm.location_id || 'all'}
                onValueChange={(value) => setMenuForm({ ...menuForm, location_id: value === 'all' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allLocations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allLocations')}</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('menuLocationHint')}</p>
            </div>

            {/* Availability Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available-from">{t('availableFrom')}</Label>
                <Input
                  id="available-from"
                  type="time"
                  value={menuForm.available_from}
                  onChange={(e) => setMenuForm({ ...menuForm, available_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="available-until">{t('availableUntil')}</Label>
                <Input
                  id="available-until"
                  type="time"
                  value={menuForm.available_until}
                  onChange={(e) => setMenuForm({ ...menuForm, available_until: e.target.value })}
                />
              </div>
            </div>

            {/* Available Days */}
            <div className="space-y-2">
              <Label>{t('availableDays')}</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { day: 0, label: t('sunday') },
                  { day: 1, label: t('monday') },
                  { day: 2, label: t('tuesday') },
                  { day: 3, label: t('wednesday') },
                  { day: 4, label: t('thursday') },
                  { day: 5, label: t('friday') },
                  { day: 6, label: t('saturday') },
                ].map(({ day, label }) => (
                  <label key={day} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={menuForm.available_days.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMenuForm({ ...menuForm, available_days: [...menuForm.available_days, day].sort() })
                        } else {
                          setMenuForm({ ...menuForm, available_days: menuForm.available_days.filter(d => d !== day) })
                        }
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="menu-active">{t('menuActive')}</Label>
                <p className="text-xs text-muted-foreground">{t('menuActiveHint')}</p>
              </div>
              <Switch
                id="menu-active"
                checked={menuForm.is_active}
                onCheckedChange={(checked) => setMenuForm({ ...menuForm, is_active: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsCreateMenuOpen(false); resetMenuForm() }}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createMenu.isPending || updateMenu.isPending}>
                {(createMenu.isPending || updateMenu.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMenu ? t('updateMenu') : t('createMenu')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
