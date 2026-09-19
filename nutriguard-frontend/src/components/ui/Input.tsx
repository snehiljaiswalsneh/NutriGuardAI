import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-11 rounded-sm border border-neutral-300 bg-white px-3 text-sm text-neutral-900 shadow-xs transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'dark:bg-darksurface dark:border-white/10 dark:text-neutral-100',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ className, label, id, ...props }, ref) => {
    const areaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {label}
          </label>
        )}
        <textarea
          id={areaId}
          ref={ref}
          className={cn(
            'min-h-[160px] rounded-sm border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-xs transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'dark:bg-darksurface dark:border-white/10 dark:text-neutral-100',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
