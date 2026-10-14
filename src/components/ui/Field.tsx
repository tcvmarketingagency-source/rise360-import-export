"use client";

import { forwardRef, useId } from "react";

const controlBase =
  "w-full rounded-sm border bg-ink/50 px-4 text-[0.95rem] text-ivory placeholder:text-ash/55 " +
  "transition-colors duration-200 focus:outline-none focus-visible:border-amber " +
  "aria-[invalid=true]:border-chili/70";

interface CommonProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Renders the field label in the technical micro style. */
  micro?: boolean;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  micro,
  children,
}: CommonProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={micro ? "micro text-ash" : "text-[0.8rem] font-medium tracking-wide text-ivory/75"}
      >
        {label}
        {required ? (
          <span className="text-chili" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="text-ash/60"> (optional)</span>
        )}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-[0.78rem] leading-snug text-ash/80">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[0.78rem] leading-snug text-chili">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps
  extends CommonProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  className?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, required, micro, className = "", ...rest },
  ref,
) {
  const generated = useId();
  const id = `field-${rest.name ?? generated}`;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} micro={micro}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${controlBase} h-12 ${error ? "border-chili/60" : "border-ivory/15"} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

export interface TextAreaFieldProps
  extends CommonProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> {
  className?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, hint, error, required, micro, className = "", ...rest },
  ref,
) {
  const generated = useId();
  const id = `field-${rest.name ?? generated}`;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} micro={micro}>
      <textarea
        ref={ref}
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${controlBase} py-3 ${error ? "border-chili/60" : "border-ivory/15"} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

export interface SelectFieldProps
  extends CommonProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  className?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, required, micro, options, placeholder, className = "", ...rest },
  ref,
) {
  const generated = useId();
  const id = `field-${rest.name ?? generated}`;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} micro={micro}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${controlBase} h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%239c9184' stroke-width='1.5'%3E%3Cpath d='M1 1l5 5 5-5'/%3E%3C/svg%3E")] bg-[length:12px_8px] bg-[right_1rem_center] bg-no-repeat pr-10 ${
          error ? "border-chili/60" : "border-ivory/15"
        } ${className}`}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});
