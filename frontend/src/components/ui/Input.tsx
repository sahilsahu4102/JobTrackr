import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, style, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label 
            htmlFor={inputId} 
            style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a3aac4', marginBottom: 8 }}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={className}
          style={{
            display: 'flex',
            height: 48,
            width: '100%',
            borderRadius: 12,
            border: error ? '1.5px solid rgba(255,110,132,0.5)' : '1.5px solid rgba(64,72,93,0.2)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '0 16px',
            fontSize: 14,
            color: '#dee5ff',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            ...style,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = error ? 'rgba(255,110,132,0.7)' : 'rgba(99,102,241,0.4)';
            e.currentTarget.style.boxShadow = error 
              ? '0 0 20px rgba(255,110,132,0.05)' 
              : '0 0 20px rgba(96,99,238,0.06)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? 'rgba(255,110,132,0.5)' : 'rgba(64,72,93,0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
        {error && <p style={{ marginTop: 6, fontSize: 13, color: '#ff6e84' }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
