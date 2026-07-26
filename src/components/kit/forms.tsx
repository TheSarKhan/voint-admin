/**
 * Voint UI kit — form idareedicileri (admin panelin istifade etdiyi alt coxluq).
 * Kod voint-panel ile eynidir; admin-de istifade olunmayan komponentler (Checkbox,
 * Radio, Switch, FileUpload, NumberInput, SearchInput, Date/Time) daxil edilmeyib.
 */
import {
  useId,
  useState,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type SVGProps,
  type TextareaHTMLAttributes,
} from "react";
import { IconChevronDown, IconEye, IconEyeOff } from "../icons";
import { cx, focusRing, inputCls, inputErrorCls } from "./styles";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/* ================================================================== */
/* Etiket / komekci metn / sehv                                        */
/* ================================================================== */

export function Label({
  htmlFor,
  required,
  children,
  className = "",
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx(
        "mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted",
        className,
      )}
    >
      {children}
      {required && (
        <span className="ml-1 text-err" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function HelpText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-1.5 text-xs text-fg-faint">
      {children}
    </p>
  );
}

export function ErrorText({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-1.5 text-xs text-err">
      {children}
    </p>
  );
}

/* ================================================================== */
/* Field — kohne API (label + children) ile uyumludur                   */
/* ================================================================== */

export function Field({
  label,
  children,
  htmlFor,
  required,
  help,
  error,
  className = "",
}: {
  label: string;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
}) {
  const content = (
    <>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted">
        {label}
        {required && (
          <span className="ml-1 text-err" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
      {help && !error && <HelpText>{help}</HelpText>}
      {error && <ErrorText>{error}</ErrorText>}
    </>
  );

  if (htmlFor) {
    return (
      <div className={cx("block", className)}>
        <label htmlFor={htmlFor}>{content}</label>
      </div>
    );
  }
  return <label className={cx("block", className)}>{content}</label>;
}

/** Sahələri sütunlara bölən sətir. */
export function FormRow({
  children,
  columns = 2,
  className = "",
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";
  return <div className={cx("grid gap-4", cols, className)}>{children}</div>;
}

/** Başlıqlı sahə qrupu. */
export function FieldGroup({
  legend,
  description,
  children,
  className = "",
}: {
  legend?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      {legend && (
        <legend className="mb-1 text-sm font-medium text-fg">{legend}</legend>
      )}
      {description && (
        <p className="mb-3 text-xs text-fg-muted">{description}</p>
      )}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

/* ================================================================== */
/* Input                                                               */
/* ================================================================== */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  icon?: IconComponent;
  /** type="password" ucun goster/gizlet duymesi. */
  revealable?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  help,
  error,
  icon: Icon,
  revealable = false,
  required,
  disabled,
  className = "",
  containerClassName = "",
  id,
  type = "text",
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = `${inputId}-help`;
  const errId = `${inputId}-err`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === "password";
  const effectiveType = isPassword && revealed ? "text" : type;
  const describedBy =
    [error ? errId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("block", containerClassName)}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            width={15}
            height={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          />
        )}
        <input
          id={inputId}
          type={effectiveType}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            inputCls,
            Icon && "pl-9",
            isPassword && revealable && "pr-10",
            error && inputErrorCls,
            className,
          )}
          {...rest}
        />
        {isPassword && revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Şifrəni gizlət" : "Şifrəni göstər"}
            className={cx(
              "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-fg-faint transition-colors hover:text-fg",
              focusRing,
            )}
          >
            {revealed ? (
              <IconEyeOff width={15} height={15} />
            ) : (
              <IconEye width={15} height={15} />
            )}
          </button>
        )}
      </div>
      {help && !error && <HelpText id={helpId}>{help}</HelpText>}
      {error && <ErrorText id={errId}>{error}</ErrorText>}
    </div>
  );
}

/* ================================================================== */
/* Textarea                                                            */
/* ================================================================== */

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
  error?: string;
  showCount?: boolean;
  containerClassName?: string;
}

export function Textarea({
  label,
  help,
  error,
  showCount = false,
  required,
  className = "",
  containerClassName = "",
  id,
  rows = 4,
  maxLength,
  value,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;
  const length = typeof value === "string" ? value.length : 0;
  const describedBy =
    [error ? errId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("block", containerClassName)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(inputCls, "resize-y", error && inputErrorCls, className)}
        {...rest}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {help && !error && <HelpText id={helpId}>{help}</HelpText>}
          {error && <ErrorText id={errId}>{error}</ErrorText>}
        </div>
        {showCount && maxLength !== undefined && (
          <span className="mt-1.5 shrink-0 text-xs text-fg-faint tabular-nums">
            {length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Select                                                              */
/* ================================================================== */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({
  label,
  help,
  error,
  options,
  placeholder,
  required,
  className = "",
  containerClassName = "",
  id,
  children,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = `${fieldId}-help`;
  const errId = `${fieldId}-err`;
  const describedBy =
    [error ? errId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cx("block", containerClassName)}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            inputCls,
            "appearance-none pr-9 [color-scheme:dark]",
            error && inputErrorCls,
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <IconChevronDown
          width={15}
          height={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint"
        />
      </div>
      {help && !error && <HelpText id={helpId}>{help}</HelpText>}
      {error && <ErrorText id={errId}>{error}</ErrorText>}
    </div>
  );
}
