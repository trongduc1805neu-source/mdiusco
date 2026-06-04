import React from 'react';
import { Play, BookOpen, ClipboardList, Star } from 'lucide-react';

const getFallbackGradient = (text: string = '') => {
  const t = text || '';
  const gradients = [
    'linear-gradient(135deg, #0056d2 0%, #00c6ff 100%)', // Coursera Blue
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Royal Purple
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Soft Pink/Rose
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Cyan/Sky
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Emerald/Mint
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Sunset Gold
  ];
  let hash = 0;
  for (let i = 0; i < t.length; i++) {
    hash = t.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const getPublisher = (title: string = '') => {
  const t = (title || '').toUpperCase();
  if (t.includes('CFA')) {
    return 'CFA Institute';
  }
  if (t.includes('ECON') || t.includes('QUANT') || t.includes('FSA')) {
    return 'CFA Program';
  }
  return 'Madiusco Academy';
};

const getRatingAndReviews = (title: string = '') => {
  const t = title || '';
  let hash = 0;
  for (let i = 0; i < t.length; i++) {
    hash = t.charCodeAt(i) + ((hash << 5) - hash);
  }
  const score = (4.6 + (Math.abs(hash) % 4) * 0.1).toFixed(1); // 4.6, 4.7, 4.8, 4.9
  const reviews = 50 + (Math.abs(hash) % 450); // 50 to 500
  return { score, reviews };
};

interface VideoCardProps {
  courseTitle: string;
  videoTitle?: string;
  progress?: number;
  selectionsCount?: number;
  onNavigateToPlayer?: () => void;
  isDrive?: boolean;
  thumbnailLink?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({
  courseTitle,
  videoTitle,
  progress,
  selectionsCount,
  onNavigateToPlayer,
  isDrive,
  thumbnailLink,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const displayTitle = (selectionsCount !== undefined ? courseTitle : videoTitle) || '';
  const subtitle = selectionsCount !== undefined ? 'Khóa học' : 'Bài học';
  const fallbackGradient = getFallbackGradient(displayTitle || courseTitle || 'Video Lecture');
  const ratingInfo = getRatingAndReviews(displayTitle || courseTitle || '');

  // Choose a clean outline icon based on content type
  const renderCardIcon = () => {
    const isMock = displayTitle?.toLowerCase().includes('mock');
    const isWb = displayTitle?.toLowerCase().includes('read') || displayTitle?.toLowerCase().includes('book');
    if (isMock) {
      return <ClipboardList size={32} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />;
    }
    if (isWb) {
      return <BookOpen size={32} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />;
    }
    return <Play size={32} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', marginLeft: '4px' }} />;
  };

  return (
    <div
      className="store-utility-card"
      onClick={onNavigateToPlayer}
      style={{
        minWidth: '280px',
        width: '280px',
        cursor: onNavigateToPlayer ? 'pointer' : 'default',
        padding: '0',
        backgroundColor: '#ffffff',
        border: '1px solid #e8eef7',
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
    >
      {/* Product Image Stage (Quiet Surface #F5F5F7, centered minimal icon or video thumbnail) */}
      <div
        style={{
          width: '100%',
          height: '148px',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Drive Badge */}
        {isDrive && (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(29, 29, 31, 0.04)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '12px',
              letterSpacing: '-0.01em',
              zIndex: 2,
            }}
          >
            Drive
          </span>
        )}

        {thumbnailLink && !imageError ? (
          <img
            src={thumbnailLink}
            alt={displayTitle}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          /* Premium Fallback Gradient Thumbnail with watermark overlay & clean text */
          <div
            style={{
              width: '100%',
              height: '100%',
              background: fallbackGradient,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Subtle decorative top right icon */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                {React.cloneElement(renderCardIcon(), { size: 16, style: { color: '#ffffff' } })}
              </div>
            </div>
            {/* Bold white title on thumbnail */}
            <div
              style={{
                color: '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '14px',
                lineHeight: 1.3,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              {displayTitle}
            </div>
          </div>
        )}
      </div>

      {/* Card Details (Coursera Layout) */}
      <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          {/* Headline */}
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '16px',
              color: '#0f1114',
              margin: '0 0 8px 0',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '44px',
            }}
            title={displayTitle}
          >
            {displayTitle}
          </h3>
        </div>

        {/* Progress Bar & Actions */}
        <div>
          {progress !== undefined ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Progress bar track */}
              <div style={{ height: '6px', backgroundColor: '#e8eef7', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: '#0056d2', width: `${progress}%`, borderRadius: '100px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#5b6780', fontWeight: 500 }}>
                  {progress.toFixed(0)}% hoàn thành
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0056d2', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <Play size={10} fill="currentColor" stroke="none" />
                  Tiếp tục
                </span>
              </div>
            </div>
          ) : selectionsCount !== undefined ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#5b6780', backgroundColor: '#f0f4f9', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>
                {selectionsCount} phần học
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0056d2' }}>
                Học ngay →
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#5b6780', backgroundColor: '#f0f4f9', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>
                {subtitle}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0056d2' }}>
                Xem chi tiết →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;