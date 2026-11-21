import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldProps = {
  label: ReactNode;
  /** Optional id; generated when omitted. */
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

// Label above, control, hint and error below; error linked via aria-describedby (FR-CF-02).
function Field({ label, id, hint, error, required, className, children }: FieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={controlId} className="text-meta text-green">
        {label}
        {required ? (
          <span className="text-muted">
            {" "}
            <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </span>
        ) : null}
      </label>
      {children({
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-muted text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-red text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
