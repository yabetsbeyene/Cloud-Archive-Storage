import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const inputId = providedId ?? generatedId
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
            error ? 'border-rose-400' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-rose-700">
            {error}
          </p>
        )}
      </div>
    )
  },
)
TextareaField.displayName = 'TextareaField'
