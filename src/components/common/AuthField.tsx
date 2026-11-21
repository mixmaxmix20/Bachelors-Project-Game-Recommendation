import { useId } from "react";

interface AuthFieldProps {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  placeholder: string;
  value: string;
  error: string;
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
  onChange,
}: AuthFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

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
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-12 w-full text-lg rounded-lg border border-ui-border ui-focus pl-2"
      />
      {error && (
        <span id={errorId} role="alert" className="text-red-500 text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
