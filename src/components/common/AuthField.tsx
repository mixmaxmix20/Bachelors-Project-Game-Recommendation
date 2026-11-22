import { useId } from "react";

interface AuthFieldProps {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  placeholder: string;
  value: string;
  error: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function AuthField({
  name,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  error,
  hint,
  disabled,
  onChange,
}: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const descriptionIds = [hint ? hintId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        required
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds || undefined}
        className="h-12 w-full text-lg rounded-lg border border-ui-border ui-focus pl-2"
      />
      {hint && (
        <span id={hintId} className="text-ui-muted text-xs">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-red-500 text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
