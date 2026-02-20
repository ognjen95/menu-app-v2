import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const Loading = () => {
  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Header */}
      <div className='space-y-1.5'>
        <Skeleton className='h-7 w-32' />
        <Skeleton className='h-4 w-64' />
      </div>

      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-48' />
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-6'>
            <Skeleton className='h-24 w-24 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-5 w-36' />
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-5 w-16 rounded-full' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Card */}
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-4 w-56' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-10 w-full rounded-md' />
            </div>
          ))}
          <div className='space-y-2'>
            <Skeleton className='h-4 w-12' />
            <Skeleton className='h-20 w-full rounded-md' />
          </div>
          <Skeleton className='h-9 w-28 rounded-md' />
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-36' />
          <Skeleton className='h-4 w-52' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-10 w-full rounded-md' />
            </div>
          ))}
          <Skeleton className='h-9 w-36 rounded-md' />
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Skeleton className='h-5 w-20' />
              <Skeleton className='h-4 w-48' />
            </div>
            <Skeleton className='h-9 w-24 rounded-md' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Loading