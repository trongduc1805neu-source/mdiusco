import React from 'react';
import { Search, Plus } from 'lucide-react';
import Button from './Button';
import misoLogo from '../MISO.png';

interface HeaderProps {
  onLogoClick: () => void;
  onAddDriveCourse?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, onAddDriveCourse }) => {
  return (
    <header
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-hairline)',
        fontFamily: 'var(--font-body)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 24px',
      }}
    >
      {/* Logo (text-only) */}
      <div
        onClick={onLogoClick}
        role="button"
        aria-label="Trang chủ"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: '1.5rem',
          color: 'var(--color-primary)',
          cursor: 'pointer',
          letterSpacing: '-0.02em',
          userSelect: 'none',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>mdi</span>
        <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>usco</span>
      </div>

      {/* Search bar (styled like Apple search pill) */}
      <div
        style={{
          flexGrow: 1,
          maxWidth: '480px',
          display: 'flex',
          alignItems: 'center',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: 'var(--color-canvas-parchment)',
          padding: '0 16px',
          gap: '8px',
          height: '38px',
          transition: 'all 200ms ease',
        }}
        onFocusCapture={e => {
          e.currentTarget.style.borderColor = 'var(--color-primary-focus)';
          e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
        }}
        onBlurCapture={e => {
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.backgroundColor = 'var(--color-canvas-parchment)';
        }}
      >
        <Search
          size={14}
          style={{ color: 'var(--color-ink-muted-48)', flexShrink: 0 }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Tìm kiếm nội dung bất kỳ..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            color: 'var(--color-ink)',
          }}
        />
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        {onAddDriveCourse && (
          <Button
            variant="primary"
            onClick={onAddDriveCourse}
            title="Thêm khóa học mới từ Google Drive"
            id="add-course-btn"
            style={{
              height: '34px',
              fontSize: '13px',
            }}
            icon={Plus}
          >
            Thêm khóa học
          </Button>
        )}

        {/* Avatar using MISO.png */}
        <img
          src={misoLogo}
          alt="User Avatar"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid var(--color-hairline)',
            flexShrink: 0,
          }}
        />
      </div>
    </header>
  );
};

export default Header;

