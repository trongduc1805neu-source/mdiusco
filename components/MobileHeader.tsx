import React from 'react';
import { Search } from 'lucide-react';

const MobileHeader: React.FC = () => {
  return (
    <div
      className="md:hidden flex items-center p-3 border-b bg-white"
      style={{
        backgroundColor: 'var(--color-canvas)',
        borderBottom: '1px solid var(--color-hairline)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          backgroundColor: 'var(--color-canvas-parchment)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 12px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Search size={14} style={{ color: 'var(--color-ink-muted-48)' }} />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            width: '100%',
            backgroundColor: 'transparent',
            color: 'var(--color-ink)',
          }}
        />
      </div>
    </div>
  );
};

export default MobileHeader;
