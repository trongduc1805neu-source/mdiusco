import React from 'react';
import { Search } from 'lucide-react';
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
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 24px',
      }}
    >
      {/* Logo (text-only) */}
      <button
        onClick={onLogoClick}
        aria-label="Trang chủ"
        className="btn-interactive btn-ghost"
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: '1.85rem',
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
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <strong style={{ fontWeight: 800, color: 'var(--color-primary)' }}>mdi</strong><span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>usco</span>
        </span>
      </button>

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
          transition: 'border-color 200ms ease, background-color 200ms ease',
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
          placeholder="Tìm kiếm nội dung bất kỳ…"
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
        {/* Clickable Avatar — opens import modal */}
        <button
          className="anime-avatar-btn"
          onClick={onAddDriveCourse}
          title="Thêm khóa học mới từ Google Drive"
          aria-label="Thêm khóa học mới từ Google Drive"
          id="add-course-btn"
        >
          <img
            src={misoLogo}
            alt="User Avatar"
            width={38}
            height={38}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </button>
      </div>
    </header>
  );
};

export default Header;

