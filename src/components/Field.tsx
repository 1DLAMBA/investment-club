import { useId } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function TextField({
  label,
  hint,
  mono = false,
  className = "",
  ...props
}: InputProps & { label: string; hint?: string; mono?: boolean }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        className={`mt-1.5 min-h-11 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone/70 ${
          mono ? "font-mono font-tabular" : ""
        }`}
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        className="mt-1.5 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink placeholder:text-stone/70"
        {...props}
      />
    </div>
  );
}

export function SelectField({
  label,
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        className="mt-1.5 min-h-11 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm text-ink"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
