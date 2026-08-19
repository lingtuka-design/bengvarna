import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const baseField =
  'w-full rounded-xl border border-stone-300 bg-white text-[15px] text-stone-900 placeholder:text-stone-400 transition-colors focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-600'

function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  if (!children) return null
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">
      {children}
    </label>
  )
}

function Hint({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{children}</p>
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, className, id, ...rest }, ref) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <input ref={ref} id={id} className={cn(baseField, 'h-11 px-3.5', className)} {...rest} />
      <Hint>{hint}</Hint>
    </div>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, className, id, ...rest }, ref) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <textarea ref={ref} id={id} className={cn(baseField, 'min-h-24 px-3.5 py-2.5 leading-relaxed', className)} {...rest} />
      <Hint>{hint}</Hint>
    </div>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  options: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, hint, options, className, id, ...rest }, ref) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <select ref={ref} id={id} className={cn(baseField, 'h-11 appearance-none bg-no-repeat px-3.5 pr-9', className)} style={{
        backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e\")",
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '1rem',
      }} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Hint>{hint}</Hint>
    </div>
  )
})

interface FieldProps {
  label?: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}

export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <Hint>{hint}</Hint>
    </div>
  )
}
