import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 disabled:bg-indigo-300',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm active:translate-y-0 disabled:text-slate-400',
  danger: 'bg-rose-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-md active:translate-y-0 disabled:bg-rose-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 disabled:text-slate-300',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
