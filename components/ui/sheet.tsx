"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { Drawer as DrawerPrimitive } from "vaul"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Radix Sheet for left/right/top
const SheetRoot = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

// Vaul Drawer overlay for bottom sheets
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background shadow-lg transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b rounded-3xl m-3 p-6 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 inset-y-0 rounded-t-3xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r rounded-3xl m-3 p-6 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left md:max-w-lg",
        right: "inset-y-0 right-0 h-full w-3/4 border-l rounded-3xl m-3 p-6 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right md:max-w-lg",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, 'children'>,
  VariantProps<typeof sheetVariants> {
  children?: React.ReactNode;
  renderCloseButton?: () => React.ReactNode;
  showDragHandle?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Bottom sheet content using Vaul (native swipe-to-dismiss)
const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  SheetContentProps
>(({ className, children, showDragHandle = true, renderCloseButton, ...props }, ref) => (
  <DrawerPrimitive.Portal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-background h-[96dvh]"
      {...props}
    >
      {showDragHandle && (
        <div className="mx-auto mt-4 h-1.5 w-[100px] rounded-full bg-muted shrink-0" />
      )}
      {/* Content wrapper - flex-1 with overflow hidden to properly contain scrollable children */}
      <div className={cn("flex-1 min-h-0 flex flex-col overflow-hidden", className)}>
        {children}
      </div>
      {renderCloseButton && (
        <DrawerPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DrawerPrimitive.Close>
      )}
    </DrawerPrimitive.Content>
  </DrawerPrimitive.Portal>
))
BottomSheetContent.displayName = "BottomSheetContent"

// Regular sheet content for left/right/top (Radix)
const RegularSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, renderCloseButton, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      {renderCloseButton && (
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
))
RegularSheetContent.displayName = "RegularSheetContent"

// Main SheetContent - uses Vaul for bottom, Radix for others
const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", ...props }, ref) => {
    if (side === "bottom") {
      return <BottomSheetContent ref={ref} side={side} {...props} />
    }
    return <RegularSheetContent ref={ref as any} side={side} {...props} />
  }
)
SheetContent.displayName = "SheetContent"

// Sheet wrapper that uses Vaul for bottom, Radix for others
interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  side?: "top" | "bottom" | "left" | "right";
}

const Sheet = ({ children, side, ...props }: SheetProps) => {
  // Extract side from children if SheetContent is present
  const childArray = React.Children.toArray(children)
  const contentChild = childArray.find(
    (child) => React.isValidElement(child) && (child.type as any)?.displayName === "SheetContent"
  ) as React.ReactElement<SheetContentProps> | undefined
  
  const effectiveSide = side || contentChild?.props?.side || "right"

  if (effectiveSide === "bottom") {
    // Use Vaul for bottom sheets (drag-to-close)
    return (
      <DrawerPrimitive.Root {...props}>
        {children}
      </DrawerPrimitive.Root>
    )
  }
  
  return (
    <SheetRoot {...props}>
      {children}
    </SheetRoot>
  )
}

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
