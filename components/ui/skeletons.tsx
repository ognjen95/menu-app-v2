import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItemScale } from './animated'

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <Skeleton className="absolute top-0 left-0 right-0 h-1" />
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// Menu Item Card Skeleton
export function MenuItemCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Menu Selection Card Skeleton
export function MenuSelectionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

// Category Item Skeleton
export function CategoryItemSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-4" />
    </div>
  )
}

// Animated Grid Skeleton
export function OrdersGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <OrderCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Animated Menu Items Grid Skeleton
export function MenuItemsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <MenuItemCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Animated Menu Selection Grid Skeleton
export function MenuSelectionGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <MenuSelectionCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Categories Sidebar Skeleton
export function CategoriesSidebarSkeleton({ count = 5 }: { count?: number }) {
  return (
    <motion.div
      className="space-y-1"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <CategoryItemSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Kanban Column Skeleton
export function KanbanColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-[380px] space-y-4">
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-8" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Kanban Layout Skeleton
export function KanbanLayoutSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <motion.div
      className="flex gap-4 min-h-[calc(100vh-280px)] pb-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <KanbanColumnSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Table Card Skeleton
export function TableCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  )
}

// Tables Grid Skeleton
export function TablesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <TableCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Location Card Skeleton
export function LocationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

// Locations Grid Skeleton
export function LocationsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <LocationCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Language Card Skeleton
export function LanguageCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Languages Grid Skeleton
export function LanguagesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <motion.div
      className="grid gap-3"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <LanguageCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Team Member Card Skeleton
export function TeamMemberCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// Team Members Grid Skeleton
export function TeamMembersGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <motion.div
      className="grid gap-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <TeamMemberCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}
