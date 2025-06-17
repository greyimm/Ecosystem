// FILE: src/components/Common/FormInput.tsx
// Reusable form input component

import React from 'react';

interface FormInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  rows = 3
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            className="form-input form-textarea"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
          />
        );
      case 'select':
        return (
          <select
            className="form-select"
            value={value}
            onChange={handleChange}
            required={required}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={type}
            className="form-input"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
          />
        );
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {renderInput()}
    </div>
  );
};