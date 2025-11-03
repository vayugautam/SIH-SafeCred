import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

export function Loading({ className, size = 'md', text, fullScreen = false }: LoadingProps) {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      fullScreen && 'min-h-screen',
      className
    )}>
      <div className="relative">
        <Loader2 className={cn(
          'animate-spin text-blue-600',
          sizeClasses[size]
        )} />
        <div className={cn(
          'absolute inset-0 animate-ping rounded-full bg-blue-400/30',
          sizeClasses[size]
        )} />
      </div>
      {text && (
        <p className="text-sm font-medium text-slate-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-white flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

export function LoadingCard() {
  return (
    <div className="glass rounded-3xl p-8 shadow-xl animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded-full w-3/4" />
          <div className="h-3 bg-slate-200 rounded-full w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-slate-200 rounded-full w-full" />
        <div className="h-3 bg-slate-200 rounded-full w-5/6" />
        <div className="h-3 bg-slate-200 rounded-full w-4/6" />
      </div>
    </div>
  )
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}
