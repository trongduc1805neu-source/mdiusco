import React from 'react';
import type { LucideIcon } from 'lucide-react';

type IconBadgeVariant = 'solid' | 'outline' | 'ghost' | 'pill';
type IconBadgeColor =
  | 'primary'   // purple #7C3AED
  | 'success'   // green  #059669
  | 'warning'   // amber  #D97706
  | 'neutral'   // slate  #64748B
  | 'white';    // white bg

interface IconBadgeProps {
  /** Lucide icon component — pass as value, e.g. icon={Play} */
  icon: LucideIcon;
  /** Pixel size of the icon (default 16) */
  size?: 16 | 20 | 24;
  /** Visual style (default 'ghost') */
  variant?: IconBadgeVariant;
  /** Color token (default 'neutral') */
  color?: IconBadgeColor;
  /** Accessible label for the icon */
  label?: string;
  /** Hard shadow — set false for subtle contexts */
  shadow?: boolean;
  /** onClick handler — turns badge into a button */
  onClick?: (e: React.MouseEvent) => void;
  /** Extra CSS class names */
  className?: string;
  style?: React.CSSProperties;
}

const COLOR_MAP: Record<
  IconBadgeColor,
  { icon: string; bg: string; border: string }
> = {
  primary: {
    icon: '#0066CC',
    bg: 'rgba(0, 102, 204, 0.08)',
    border: '#0066CC',
  },
  success: {
    icon: '#34C759',
    bg: 'rgba(52, 199, 89, 0.08)',
    border: '#34C759',
  },
  warning: {
    icon: '#FF9500',
    bg: 'rgba(255, 149, 0, 0.08)',
    border: '#FF9500',
  },
  neutral: {
    icon: '#6E6E73',
    bg: '#F5F5F7',
    border: '#E5E5E7',
  },
  white: {
    icon: '#1D1D1F',
    bg: '#FFFFFF',
    border: '#E5E5E7',
  },
};

const PADDING_MAP: Record<16 | 20 | 24, string> = {
  16: '4px',
  20: '6px',
  24: '8px',
};

/**
 * IconBadge — reusable Lucide icon styled according to Apple Design System.
 */
const IconBadge: React.FC<IconBadgeProps> = ({
  icon: Icon,
  size = 16,
  variant = 'ghost',
  color = 'neutral',
  label,
  onClick,
  className,
  style,
}) => {
  const c = COLOR_MAP[color];
  const pad = PADDING_MAP[size];

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: pad,
    border: '1px solid',
    flexShrink: 0,
    transition: 'opacity 150ms ease, transform 150ms ease, background-color 150ms ease',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    fontFamily: 'inherit',
    background: 'none',
    ...style,
  };

  // Variant-specific styles
  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: c.icon,
          borderColor: c.icon,
          borderRadius: '50%',
          color: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: c.border,
          borderRadius: '50%',
          color: c.icon,
        };
      case 'pill':
        return {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderRadius: 'var(--radius-md, 8px)',
          color: c.icon,
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderRadius: '50%',
          color: c.icon,
        };
    }
  })();

  const combined: React.CSSProperties = { ...baseStyle, ...variantStyle };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      e.currentTarget.style.opacity = '0.8';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'scale(0.96)';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  if (onClick) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        className={className}
        style={combined}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <Icon size={size} strokeWidth={2.2} aria-hidden="true" />
      </button>
    );
  }

  return (
    <span
      aria-label={label}
      title={label}
      className={className}
      style={combined}
    >
      <Icon size={size} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
};

export default IconBadge;
