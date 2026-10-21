import { useId, type Ref } from 'react';

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

/** Подпись связана с полем через htmlFor/id (useId), текст ошибки — через aria-describedby */
function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="fieldset-legend">
      {label}
      {required && (
        <span className="text-error" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

/** Контролируемое поле ввода: значение приходит сверху, изменения уходят наверх через onChange */
export function TextField({ label, error, required, value, onChange, type = 'text', ref, ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="fieldset py-1">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        ref={ref}
        type={type}
        className={`input w-full ${error ? 'input-error' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className="label text-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps<T extends string> extends BaseFieldProps {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  getLabel: (option: T) => string;
}

/** Обобщённый (generic) select: тип значения T выводится из options */
export function SelectField<T extends string>({ label, value, onChange, options, getLabel }: SelectFieldProps<T>) {
  const id = useId();

  return (
    <div className="fieldset py-1">
      <FieldLabel htmlFor={id} label={label} />
      <select
        id={id}
        className="select w-full"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
