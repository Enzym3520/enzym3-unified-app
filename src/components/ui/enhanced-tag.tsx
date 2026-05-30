import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { X, Calendar, Users, MapPin, Music, Package, FileText, Sparkles, Star, Heart, Cake } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const tagVariants = cva(
  "inline-flex items-center gap-1 transition-all duration-200 hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-muted hover:bg-muted/80",
        primary: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
        success: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        info: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
        purple: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
        rose: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
        premium: "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 hover:from-yellow-200 hover:to-amber-200 border-amber-200 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-amber-400",
        event: "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 hover:from-indigo-200 hover:to-purple-200 border-indigo-200 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-400",
        venue: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400"
      },
      size: {
        xs: "text-xs h-5 px-1.5 rounded-sm",
        sm: "text-xs h-6 px-2 rounded-md",
        md: "text-sm h-7 px-2.5 rounded-md",
        lg: "text-sm h-8 px-3 rounded-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "sm"
    }
  }
)

export interface EnhancedTagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  children: React.ReactNode
  onRemove?: () => void
  icon?: React.ReactNode
  interactive?: boolean
}

const EnhancedTag = React.forwardRef<HTMLDivElement, EnhancedTagProps>(
  ({ className, variant, size, children, onRemove, icon, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          tagVariants({ variant, size }),
          interactive && "cursor-pointer",
          className
        )}
        {...props}
      >
        {icon && React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: cn("w-3 h-3", (icon as React.ReactElement<{ className?: string }>).props?.className)
        })}
        <span>{children}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    )
  }
)
EnhancedTag.displayName = "EnhancedTag"

// Smart tag configuration
export const getSmartTagConfig = (tag: string): { variant: any; icon?: React.ReactNode } => {
  const lowercaseTag = tag.toLowerCase()
  
  // Event type tags
  if (['wedding', 'matrimonio'].includes(lowercaseTag)) {
    return { variant: 'rose', icon: <Heart className="w-3 h-3" /> }
  }
  if (['birthday', 'cumpleanos', 'birthday party'].includes(lowercaseTag)) {
    return { variant: 'info', icon: <Cake className="w-3 h-3" /> }
  }
  if (['quince', 'quinceañera', 'quinceañeras'].includes(lowercaseTag)) {
    return { variant: 'purple', icon: <Sparkles className="w-3 h-3" /> }
  }
  if (['banquet', 'corporate', 'gala'].includes(lowercaseTag)) {
    return { variant: 'event', icon: <Users className="w-3 h-3" /> }
  }
  
  // Package type tags
  if (['platinum', 'diamond', 'premium'].includes(lowercaseTag)) {
    return { variant: 'premium', icon: <Star className="w-3 h-3" /> }
  }
  if (['gold', 'silver', 'bronze'].includes(lowercaseTag)) {
    return { variant: 'warning', icon: <Package className="w-3 h-3" /> }
  }
  if (['ceremony-only', 'ceremony-w-patio'].includes(lowercaseTag)) {
    return { variant: 'info', icon: <Calendar className="w-3 h-3" /> }
  }
  
  // Source type tags
  if (['wedding'].includes(lowercaseTag)) {
    return { variant: 'rose', icon: <Heart className="w-3 h-3" /> }
  }
  if (['event_notification'].includes(lowercaseTag)) {
    return { variant: 'info', icon: <FileText className="w-3 h-3" /> }
  }
  if (['form_submission'].includes(lowercaseTag)) {
    return { variant: 'purple', icon: <FileText className="w-3 h-3" /> }
  }
  
  // Service tags
  if (['has_coordinator', 'coordinator'].includes(lowercaseTag)) {
    return { variant: 'success', icon: <Users className="w-3 h-3" /> }
  }
  if (['has_dj', 'dj', 'music'].includes(lowercaseTag)) {
    return { variant: 'info', icon: <Music className="w-3 h-3" /> }
  }
  if (['file_uploaded', 'documents'].includes(lowercaseTag)) {
    return { variant: 'primary', icon: <FileText className="w-3 h-3" /> }
  }
  
  // Venue/location tags
  if (lowercaseTag.includes('venue') || lowercaseTag.includes('hall') || lowercaseTag.includes('garden')) {
    return { variant: 'venue', icon: <MapPin className="w-3 h-3" /> }
  }
  
  // Date-related tags
  if (lowercaseTag.includes('upcoming') || lowercaseTag.includes('scheduled')) {
    return { variant: 'warning', icon: <Calendar className="w-3 h-3" /> }
  }
  
  // Default
  return { variant: 'default' }
}

export { EnhancedTag, tagVariants }