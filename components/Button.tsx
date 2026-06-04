import React from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'pearl' | 'dark' | 'ghost';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  id?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  style,
  title,
  id,
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: "var(--font-body, 'Inter', sans-serif)",
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      outline: 'none',
      userSelect: 'none',
      border: 'none',
      boxSizing: 'border-box',
      verticalAlign: 'middle',
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          height: '40px',
          padding: '0 20px',
          backgroundColor: 'var(--primary)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-pill)',
          fontSize: '17px',
          fontWeight: 400,
        };
      case 'secondary':
        return {
          ...base,
          height: '40px',
          padding: '0 20px',
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)',
          border: '1px solid #D2D2D7',
          borderRadius: 'var(--radius-pill)',
          fontSize: '17px',
          fontWeight: 400,
        };
      case 'pearl':
        return {
          ...base,
          height: '32px',
          padding: '0 12px',
          backgroundColor: 'var(--color-surface-pearl)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: 600,
        };
      case 'dark':
        return {
          ...base,
          height: '32px',
          padding: '0 12px',
          backgroundColor: 'var(--text-primary)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          fontWeight: 400,
        };
      case 'ghost':
      default:
        return {
          ...base,
          backgroundColor: 'transparent',
          color: 'var(--primary)',
          padding: '6px 12px',
          fontSize: '14px',
          fontWeight: 600,
        };
    }
  };

  const combinedStyles: React.CSSProperties = {
    ...getStyles(),
    ...style,
  };

  return (
    <button
      id={id}
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`btn-interactive ${className}`}
      style={combinedStyles}
      title={title}
    >
      {Icon && iconPosition === 'left' && <Icon size={15} strokeWidth={2.2} />}
      {children && <span>{children}</span>}
      {Icon && iconPosition === 'right' && <Icon size={15} strokeWidth={2.2} />}
    </button>
  );
};

export default Button;
