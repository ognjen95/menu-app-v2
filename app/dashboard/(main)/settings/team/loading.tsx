import Image from 'next/image'

const Loading = () => {
  return (
    <div className='h-screen w-full flex flex-col items-center justify-center bg-background'>
      {/* Logo with pulse animation */}
      <div className='relative'>
        <div className='absolute inset-0 animate-ping opacity-20'>
          <Image
            src='/logo.png'
            alt='Logo'
            width={120}
            height={120}
            className='rounded-2xl'
          />
        </div>
        <Image
          src='/logo.png'
          alt='Logo'
          width={120}
          height={120}
          className='relative animate-pulse rounded-2xl'
        />
      </div>

      {/* Animated dots */}
      <div className='mt-8 flex items-center gap-2'>
        <span className='h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]' />
        <span className='h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]' />
        <span className='h-3 w-3 rounded-full bg-primary animate-bounce' />
      </div>
    </div>
  )
}

export default Loading