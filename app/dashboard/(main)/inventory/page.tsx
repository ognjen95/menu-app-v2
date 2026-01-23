'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
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
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  Edit,
  History,
  Filter,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Ingredient } from '@/lib/types'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'kg',
    current_stock: '',
    reorder_threshold: '',
    cost_per_unit: '',
    supplier: '',
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', showLowStock],
    queryFn: () => apiGet<{ data:{ingredients: Ingredient[]} }>('/inventory', showLowStock ? { low_stock: 'true' } : undefined),
  })

  const ingredients = data?.data?.ingredients || []

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ingredient.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockCount = ingredients.filter(i => i.current_stock <= i.reorder_threshold && i.is_tracked).length

  const updateStock = useMutation({
    mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason: string }) =>
      apiPost<{ ingredient: Ingredient }>(`/inventory/${id}/adjust`, { quantity, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })

  const createIngredient = useMutation({
    mutationFn: (data: typeof formData) => apiPost<{ ingredient: Ingredient }>('/inventory', {
      name: data.name,
      sku: data.sku || undefined,
      unit: data.unit,
      current_stock: parseFloat(data.current_stock) || 0,
      reorder_threshold: parseFloat(data.reorder_threshold) || 0,
      cost_per_unit: parseFloat(data.cost_per_unit) || 0,
      supplier: data.supplier || undefined,
      is_tracked: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      setIsCreateOpen(false)
      setFormData({ name: '', sku: '', unit: 'kg', current_stock: '', reorder_threshold: '', cost_per_unit: '', supplier: '' })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createIngredient.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Track stock levels and manage ingredients
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients.length}</div>
            <p className="text-xs text-muted-foreground">Tracked ingredients</p>
          </CardContent>
        </Card>
        <Card className={cn(lowStockCount > 0 && 'border-yellow-500')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className={cn('h-4 w-4', lowStockCount > 0 ? 'text-yellow-500' : 'text-muted-foreground')} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', lowStockCount > 0 && 'text-yellow-500')}>
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Items need reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{ingredients.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showLowStock ? 'default' : 'outline'}
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Low Stock Only
          {lowStockCount > 0 && (
            <Badge variant="secondary" className="ml-2">{lowStockCount}</Badge>
          )}
        </Button>
      </div>

      {/* Ingredients table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
          ) : filteredIngredients.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No ingredients match your search' : 'No ingredients yet'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Ingredient
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Ingredient</th>
                    <th className="text-left p-4 font-medium">SKU</th>
                    <th className="text-right p-4 font-medium">Current Stock</th>
                    <th className="text-right p-4 font-medium">Reorder At</th>
                    <th className="text-right p-4 font-medium">Cost/Unit</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.map((ingredient) => {
                    const isLowStock = ingredient.current_stock <= ingredient.reorder_threshold
                    const isOutOfStock = ingredient.current_stock === 0

                    return (
                      <tr key={ingredient.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">{ingredient.name}</div>
                          {ingredient.supplier && (
                            <div className="text-sm text-muted-foreground">{ingredient.supplier}</div>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground font-mono text-sm">
                          {ingredient.sku || '-'}
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            'font-medium',
                            isOutOfStock && 'text-red-500',
                            isLowStock && !isOutOfStock && 'text-yellow-500'
                          )}>
                            {ingredient.current_stock.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground ml-1">{ingredient.unit}</span>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">
                          {ingredient.reorder_threshold} {ingredient.unit}
                        </td>
                        <td className="p-4 text-right">
                          €{ingredient.cost_per_unit.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          {isOutOfStock ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              In Stock
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Adjust stock">
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="View history">
                              <History className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ingredient Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ingredient</DialogTitle>
            <DialogDescription>Add a new ingredient to track in your inventory</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tomatoes"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="TOM-001"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  step="0.1"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_threshold">Reorder At</Label>
                <Input
                  id="reorder_threshold"
                  type="number"
                  step="0.1"
                  value={formData.reorder_threshold}
                  onChange={(e) => setFormData({ ...formData, reorder_threshold: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_per_unit">Cost per Unit (€)</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  placeholder="2.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Fresh Farms Co."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createIngredient.isPending}>
                {createIngredient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Ingredient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
