import { TablesPageContainer } from '@/features/tables'
import { getTablesPageData } from '@/features/tables/services/tables-server'

export default async function TablesPage() {
  const initialData = await getTablesPageData()

  return (
    <TablesPageContainer initialData={initialData} />
  )
}