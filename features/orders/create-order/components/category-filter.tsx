import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { CategoryButtonsRowSkeleton } from '@/components/ui/skeletons'
import type { CategoryFilterProps } from '../types'

export function CategoryFilter({
  categories,
  selectedCategoryId,
  isLoading,
  onCategorySelect,
  t,
}: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      {isLoading ? (
        <CategoryButtonsRowSkeleton count={6} />
      ) : (
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategoryId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategorySelect(null)}
          >
            {t('allCategories')}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategorySelect(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
