import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #6366f1, #6063ee)',
    color: 'white',
    border: 'none',
    boxShadow: '0 8px 30px rgba(96,99,238,0.2)',
  },
  secondary: {
    backgroundColor: '#141f38',
    color: '#dee5ff',
    border: '1px solid rgba(64,72,93,0.2)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#a3a6ff',
    border: '1px solid rgba(64,72,93,0.2)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#a3aac4',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: 'rgba(255,110,132,0.1)',
    color: '#ff6e84',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { height: 34, padding: '0 16px', fontSize: 13, borderRadius: 10 },
  md: { height: 42, padding: '0 20px', fontSize: 14, borderRadius: 12 },
  lg: { height: 48, padding: '0 28px', fontSize: 16, borderRadius: 14 },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, style, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.5 : 1,
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={className}
        style={baseStyle}
        onMouseEnter={e => {
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(96,99,238,0.3)';
            e.currentTarget.style.transform = 'scale(1.02)';
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'rgba(20,31,56,0.6)';
            e.currentTarget.style.color = '#dee5ff';
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'rgba(255,110,132,0.2)';
          }
        }}
        onMouseLeave={e => {
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(96,99,238,0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          } else if (variant === 'ghost') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#a3aac4';
          } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = 'rgba(255,110,132,0.1)';
          }
        }}
        {...props}
      >
        {isLoading && <Loader2 size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
