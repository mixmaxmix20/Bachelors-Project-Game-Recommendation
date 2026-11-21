import { useId } from "react";

interface PreferenceSelectorProps {
  label: string;
  summary: string;
  placeholder: string;
  options: readonly { value: string; label: string }[];
  selected: readonly string[];
  onChange: (selected: string[]) => void;
}

export default function PreferenceSelector({
  label,
  summary,
  placeholder,
  options,
  selected,
  onChange,
}: PreferenceSelectorProps) {
  const id = useId();
  const available = options.filter(
    (option) => !selected.includes(option.value),
  );

  return (
    <div className="flex flex-col items-start justify-center">
      <label htmlFor={id} className="text-xl font-bold mb-5">
        {label}
      </label>
      <details className="collapse collapse-plus max-w-full mb-5">
        <summary className="collapse-title">{summary}</summary>
        <div className="collapse-content flex flex-wrap gap-2">
          {selected.map((value) => {
            const name =
              options.find((option) => option.value === value)?.label ?? value;
            return (
              <div key={value} className="join">
                <span className="btn btn-sm join-item bg-[#1f2326] text-white border-neutral-700 pointer-events-none font-normal text-base">
                  {name}
                </span>
                <button
                  type="button"
                  aria-label={`Usuń ${name}`}
                  className="btn btn-sm btn-square join-item text-red-500 border-neutral-700 hover:bg-red-600 hover:text-white"
                  onClick={() =>
                    onChange(selected.filter((item) => item !== value))
                  }
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </details>
      <select
        id={id}
        value=""
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (available.some((option) => option.value === value))
            onChange([...selected, value]);
        }}
        className="select h-12 w-full lg:max-w-125 grow text-lg rounded-lg border border-ui-border ui-focus pl-2 self-center bg-[#1f2326] text-white"
      >
        <option disabled value="">
          {placeholder}
        </option>
        {available.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
