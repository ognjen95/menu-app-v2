import { Suspense } from 'react'
import { getTablesPageData, TablesPageContainer } from '@/components/features/tables'
import { TablesGridSkeleton } from '@/components/ui/skeletons'

export default async function TablesPage() {
  const initialData = await getTablesPageData()

  return (
    <Suspense fallback={<TablesGridSkeleton count={8} />}>
      <TablesPageContainer initialData={initialData} />
    </Suspense>
  )
}