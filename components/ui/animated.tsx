'use client'

import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { forwardRef } from 'react'

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  scaleUp: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.5 },
  },
  slideInLeft: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
  slideInUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  slideInDown: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  popIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.8 },
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', stiffness: 500, damping: 15 }
    },
    exit: { opacity: 0, scale: 0.3 },
  },
} as const

export type AnimationPreset = keyof typeof animations

// Stagger container for animating children
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
}

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Stagger item variants
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
}

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
}

export const staggerItemFade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
}

// Default transition
const defaultTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth feel
}

// Props for animated components
interface AnimatedProps {
  preset?: AnimationPreset
  delay?: number
  duration?: number
  once?: boolean // Only animate once when in view
  amount?: number // How much of element needs to be in view (0-1)
}

// Animated Div
type AnimatedDivProps = HTMLMotionProps<'div'> & AnimatedProps

export const AnimatedDiv = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ preset = 'fadeIn', delay = 0, duration, once = true, amount = 0.3, children, ...props }, ref) => {
    const animation = animations[preset]
    
    return (
      <motion.div
        ref={ref}
        initial="initial"
        whileInView="animate"
        exit="exit"
        viewport={{ once, amount }}
        variants={{
          initial: animation.initial,
          animate: {
            ...animation.animate,
            transition: {
              ...defaultTransition,
              ...(animation.animate as any).transition,
              delay,
              ...(duration && { duration }),
            },
          },
          exit: animation.exit,
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimatedDiv.displayName = 'AnimatedDiv'

// Animated List (stagger container)
interface AnimatedListProps extends HTMLMotionProps<'div'> {
  stagger?: 'fast' | 'normal' | 'slow'
  children: React.ReactNode
}

export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  ({ stagger = 'normal', children, ...props }, ref) => {
    const variants = stagger === 'fast' 
      ? staggerContainerFast 
      : stagger === 'slow' 
        ? staggerContainerSlow 
        : staggerContainer

    return (
      <motion.div
        ref={ref}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.1 }}
        variants={variants}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimatedList.displayName = 'AnimatedList'

// Animated List Item
interface AnimatedListItemProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'scale' | 'fade'
  children: React.ReactNode
}

export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ variant = 'default', children, ...props }, ref) => {
    const variants = variant === 'scale' 
      ? staggerItemScale 
      : variant === 'fade' 
        ? staggerItemFade 
        : staggerItem

    return (
      <motion.div
        ref={ref}
        variants={variants}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimatedListItem.displayName = 'AnimatedListItem'

// Hover/Tap animations for interactive elements
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

export const hoverScaleLarge = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

export const hoverLift = {
  whileHover: { y: -4, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

// Re-export motion for direct use
export { motion, AnimatePresence } from 'framer-motion'
