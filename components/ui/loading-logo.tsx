import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export function LoadingLogo({ size = 'md', className, showText = true }: LoadingLogoProps) {
  const sizes = {
    sm: { logo: 'h-8 w-8 text-xl', text: 'text-base' },
    md: { logo: 'h-12 w-12 text-3xl', text: 'text-xl' },
    lg: { logo: 'h-16 w-16 text-4xl', text: 'text-2xl' }
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Animated Logo */}
      <motion.div
        className={cn(
          'flex items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm',
          sizes[size].logo
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.1, 1],
          opacity: 1,
        }}
        transition={{
          duration: 0.6,
          ease: "easeOut"
        }}
      >
        <motion.h1
          className={cn('font-bold text-primary', sizes[size].logo)}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          K
        </motion.h1>
      </motion.div>

      {/* Animated Text */}
      {showText && (
        <motion.div
          className="flex items-center gap-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.span 
            className={cn('font-bold tracking-tight', sizes[size].text)}
            animate={{
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Klopay
          </motion.span>
          <motion.span 
            className={cn('font-bold text-primary', sizes[size].text)}
            animate={{
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
          >
            .app
          </motion.span>
        </motion.div>
      )}

      {/* Loading Dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Full page loading component
export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <LoadingLogo size="lg" />
        {message && (
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  )
}
