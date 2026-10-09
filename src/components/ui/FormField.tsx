import type { Ref } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  placeholder?: string;
  autoComplete?: string;
  /** В React 19 ref передаётся как обычный проп — forwardRef не нужен */
  ref?: Ref<HTMLInputElement>;
}

/** Контролируемое поле ввода: значение приходит сверху, изменения уходят наверх через onChange. */
export function TextField({ label, error, required, value, onChange, type = 'text', ref, ...rest }: TextFieldProps) {
  return (
    <fieldset className="fieldset py-1">
      <legend className="fieldset-legend">
        {label}
        {required && <span className="text-error">*</span>}
      </legend>
      <input
        ref={ref}
        type={type}
        className={`input w-full ${error ? 'input-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="label text-error">{error}</p>}
    </fieldset>
  );
}

interface SelectFieldProps<T extends string> extends BaseFieldProps {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  getLabel: (option: T) => string;
}

/** Обобщённый (generic) select: тип значения T выводится из options. */
export function SelectField<T extends string>({ label, value, onChange, options, getLabel }: SelectFieldProps<T>) {
  return (
    <fieldset className="fieldset py-1">
      <legend className="fieldset-legend">{label}</legend>
      <select className="select w-full" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
