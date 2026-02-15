'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, staggerContainer, staggerItemScale } from './animated'

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

// Compact Menu Item Skeleton (for POS/create order dialog)
export function CompactMenuItemSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-lg border animate-pulse">
      <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

// Compact Menu Items Grid Skeleton (for POS/create order dialog)
export function CompactMenuItemsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <CompactMenuItemSkeleton key={i} />
      ))}
    </div>
  )
}

// Category Button Skeleton
export function CategoryButtonSkeleton() {
  return (
    <Skeleton className="h-8 w-20 rounded-md shrink-0" />
  )
}

// Category Buttons Row Skeleton
export function CategoryButtonsRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-2 pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryButtonSkeleton key={i} />
      ))}
    </div>
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

// Dashboard Stat Card Skeleton
export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  )
}

// Dashboard Stats Grid Skeleton
export function StatsGridSkeleton() {
  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div key={i} variants={staggerItemScale} custom={i}>
          <StatCardSkeleton />
        </motion.div>
      ))}
    </motion.div>
  )
}

// Chart Card Skeleton
export function ChartCardSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-1" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full`} style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  )
}

// Top Waiter Item Skeleton
export function TopWaiterItemSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-5 w-16 ml-auto" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// Top Waiters List Skeleton
export function TopWaitersListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <motion.div
          className="space-y-4"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {Array.from({ length: count }).map((_, i) => (
            <motion.div key={i} variants={staggerItemScale} custom={i}>
              <TopWaiterItemSkeleton />
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}

// Dashboard Overview Skeleton - Only cards and charts, no header/date selector
export function DashboardOverviewSkeleton() {
  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Stats Grid */}
      <motion.div variants={staggerItemScale}>
        <StatsGridSkeleton />
      </motion.div>

      {/* Charts Row */}
      <motion.div 
        className="grid gap-4 lg:grid-cols-2"
        variants={staggerItemScale}
      >
        <ChartCardSkeleton height={300} />
        <ChartCardSkeleton height={300} />
      </motion.div>

      {/* Products and Waiters Row */}
      <motion.div 
        className="grid gap-4 lg:grid-cols-2"
        variants={staggerItemScale}
      >
        <ChartCardSkeleton height={300} />
        <TopWaitersListSkeleton count={5} />
      </motion.div>

      {/* Peak Hours */}
      <motion.div variants={staggerItemScale}>
        <ChartCardSkeleton height={200} />
      </motion.div>
    </motion.div>
  )
}
