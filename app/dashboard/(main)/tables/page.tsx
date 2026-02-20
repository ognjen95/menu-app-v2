import { getTablesPageData, TablesPageContainer } from '@/features/tables'

export default async function TablesPage() {
  const initialData = await getTablesPageData()

  return (
    <TablesPageContainer initialData={initialData} />
  )
}