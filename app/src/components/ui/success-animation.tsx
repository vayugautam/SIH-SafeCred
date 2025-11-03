import { CheckCircle2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuccessAnimationProps {
  title?: string
  message?: string
  onComplete?: () => void
  autoHide?: boolean
  className?: string
}

export function SuccessAnimation({ 
  title = 'Success!', 
  message, 
  onComplete, 
  autoHide = true,
  className 
}: SuccessAnimationProps) {
  return (
    <div className={cn(
      'fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300',
      className
    )}>
      <div className="glass rounded-3xl p-10 max-w-md mx-4 shadow-2xl border-gradient bounce-in">
        <div className="flex flex-col items-center text-center">
          {/* Animated success icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl">
              <CheckCircle2 className="h-14 w-14 text-white animate-in zoom-in duration-500" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
          </div>

          {/* Title */}
          <h3 className="text-3xl font-extrabold gradient-text mb-3">
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="text-slate-600 leading-relaxed mb-6">
              {message}
            </p>
          )}

          {/* Success indicator */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-[shimmer_1.5s_ease-in-out]" style={{ width: '100%' }} />
          </div>

          {onComplete && (
            <button
              onClick={onComplete}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ErrorAnimation({ 
  title = 'Oops!', 
  message, 
  onRetry,
  className 
}: { 
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn(
      'fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300',
      className
    )}>
      <div className="glass rounded-3xl p-10 max-w-md mx-4 shadow-2xl border-gradient bounce-in">
        <div className="flex flex-col items-center text-center">
          {/* Animated error icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-xl">
              <svg className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-3xl font-extrabold text-slate-900 mb-3">
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="text-slate-600 leading-relaxed mb-6">
              {message}
            </p>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
