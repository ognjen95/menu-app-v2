import { DashboardOverviewHeaderSkeleton, DashboardOverviewSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-6'>
      <DashboardOverviewHeaderSkeleton />
      <DashboardOverviewSkeleton />
    </div>
  )
}

export default Loading