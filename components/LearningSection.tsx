import React, { useRef, useState, useEffect, useMemo } from 'react';
import VideoCard from './VideoCard';
import Button from './Button';
import type { ProgressData, ProgressRecord } from '../types';
import { GraduationCap, Compass, Calendar, CheckCircle2, Circle } from 'lucide-react';
import misoLogo from '../MISO.png';
import { sortSelectionsLessons } from './courseUtils';

const parseLessonDate = (title: string): Date | null => {
  if (!title) return null;
  const dateMatch = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dateMatch[3], 10);
    return new Date(year, month, day);
  }
  const ethicsDateMatch = title.match(/(?:^|_)(\d{4})_(\d{2})(\d{2})/);
  if (ethicsDateMatch) {
    const y = parseInt(ethicsDateMatch[1], 10);
    const n1 = parseInt(ethicsDateMatch[2], 10);
    const n2 = parseInt(ethicsDateMatch[3], 10);
    let d = n1;
    let m = n2;
    if (n2 > 12 && n1 <= 12) {
      d = n2;
      m = n1;
    } else if (n2 <= 12 && n1 <= 31) {
      d = n1;
      m = n2;
    }
    return new Date(y, m - 1, d);
  }
  return null;
};

const getCleanSubject = (title: string): string => {
  const match = title.match(/(?:^|[_.-])(QUANT|ECON|FSA|CI|EQUITY|FI|DER|AI|PM|ETHICS)(?:[_.-]|$)/i);
  if (match) {
    const sub = match[1].toUpperCase();
    const map: Record<string, string> = {
      QUANT: 'Quant',
      ECON: 'Econ',
      FSA: 'FSA',
      CI: 'CI',
      EQUITY: 'Equity',
      FI: 'FI',
      DER: 'Derivatives',
      AI: 'Alternative',
      PM: 'Portfolio',
      ETHICS: 'Ethics'
    };
    return map[sub] || match[1];
  }
  return '';
};

// Helper to extract a clean lesson display title
const cleanLessonDisplayTitle = (title: string): string => {
  if (!title) return '';
  const clean = title.replace(/\.[^/.]+$/, '');
  const subject = getCleanSubject(clean);
  
  const buoiMatch = clean.match(/Buổi\s*(\d+)/i);
  if (buoiMatch) {
    const buoiStr = `Buổi ${buoiMatch[1]}`;
    return subject ? `${subject} - ${buoiStr}` : buoiStr;
  }
  
  let remaining = clean;
  remaining = remaining.replace(/^[A-Z0-9._-]+_(QUANT|ECON|FSA|CI|EQUITY|FI|DER|AI|PM|ETHICS)_/i, '');
  remaining = remaining.replace(/^CFA\d+_/i, '');
  return subject ? `${subject} - ${remaining}` : remaining;
};

// Extract subject from selection name (e.g. "1. QUANT" -> "QUANT")
const cleanSelectionName = (name: string): string => {
  return name.replace(/^\d+\s*[-._]?\s*/, '');
};

// Format date to Vietnamese style
const formatDateVN = (d: Date): string => {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${weekdays[d.getDay()]}, ${day}/${month}/${year}`;
};

const MOTIVATIONAL_QUOTES = [
  { text: "Mỗi ngày tiến bộ một chút sẽ tạo nên kết quả lớn.", author: "Khuyết danh" },
  { text: "Hãy kiên trì. Bản thân bạn trong tương lai sẽ cảm ơn bạn.", author: "Khuyết danh" },
  { text: "Mỗi bài học hoàn thành là một bước gần hơn tới sự tinh thông.", author: "Khuyết danh" },
  { text: "Học tập không bao giờ làm trí tuệ mệt mỏi.", author: "Leonardo da Vinci" },
  { text: "Thành công được xây dựng từ từng buổi học kiên trì.", author: "Khuyết danh" },
  { text: "Hãy tiếp tục cố gắng. Bạn đã ở gần mục tiêu hơn hôm qua.", author: "Khuyết danh" }
];

interface LearningSectionProps {
  onNavigateToPlayer: (courseTitle: string, lessonId: string, isDrive?: boolean, driveFolderId?: string) => void;
  onAddDriveCourse?: () => void;
}

const LearningSection: React.FC<LearningSectionProps> = ({ onNavigateToPlayer, onAddDriveCourse }) => {
  const [allProgress, setAllProgress] = useState<ProgressData>(() => {
    try {
      const storedProgress = localStorage.getItem('videoProgress');
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        return parsed && typeof parsed === 'object' ? parsed : {};
      }
    } catch (error) {
      console.error('Failed to parse progress from localStorage', error);
    }
    return {};
  });
  const [activeTab, setActiveTab] = useState<'learning' | 'history' | 'completed'>('history');

  const randomQuote = useMemo(() => {
    const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[index];
  }, []);

  const sortedProgress = useMemo(() => {
    return Object.values(allProgress || {}).sort((a: ProgressRecord, b: ProgressRecord) => {
      const timeA = a && typeof a.lastWatched === 'number' ? a.lastWatched : 0;
      const timeB = b && typeof b.lastWatched === 'number' ? b.lastWatched : 0;
      return timeB - timeA;
    });
  }, [allProgress]);

  const learningCourses = useMemo(() => {
    const courses: {
      courseTitle: string;
      selectionsCount: number;
      lessonId: string;
      progress: number;
      isDrive: boolean;
      driveFolderId: string;
      thumbnailLink: string;
    }[] = [];

    // Scan all cached courses from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('gdrive_course_')) continue;
      try {
        const cachedCourseStr = localStorage.getItem(key);
        if (!cachedCourseStr) continue;
        const parsedCourse = JSON.parse(cachedCourseStr);
        if (!parsedCourse || !Array.isArray(parsedCourse.selections)) continue;
        parsedCourse.selections = sortSelectionsLessons(parsedCourse.selections);

        const courseTitle = parsedCourse.name || parsedCourse.title || '';
        if (!courseTitle) continue;

        let totalLessons = 0;
        let completedCount = 0;
        let firstLessonThumbnail = '';
        let firstLessonId = '';
        let lastWatchedLessonId = '';
        let lastWatchedTime = 0;

        parsedCourse.selections.forEach((sel: any) => {
          if (!sel || !Array.isArray(sel.lessons)) return;
          sel.lessons.forEach((les: any) => {
            if (!les || !les.id) return;
            totalLessons++;
            if (!firstLessonId) firstLessonId = les.id;
            if (!firstLessonThumbnail && les.thumbnailLink) {
              firstLessonThumbnail = les.thumbnailLink;
            }

            const lessonKey = `${courseTitle}/${les.id}`;
            const record = allProgress[lessonKey];
            if (record) {
              if (record.completed) completedCount++;
              // Track the most recently watched lesson for "resume"
              if (record.lastWatched && record.lastWatched > lastWatchedTime) {
                lastWatchedTime = record.lastWatched;
                lastWatchedLessonId = les.id;
              }
              if (!firstLessonThumbnail && record.thumbnailLink) {
                firstLessonThumbnail = record.thumbnailLink;
              }
            }
          });
        });

        if (totalLessons === 0) continue;

        const progressPct = (completedCount / totalLessons) * 100;
        // Show course if it's NOT 100% complete
        if (progressPct < 100) {
          courses.push({
            courseTitle,
            selectionsCount: parsedCourse.selections.length,
            lessonId: lastWatchedLessonId || firstLessonId || '1',
            progress: progressPct,
            isDrive: !!parsedCourse.isDrive,
            driveFolderId: parsedCourse.driveFolderId || '',
            thumbnailLink: firstLessonThumbnail,
          });
        }
      } catch (e) {
        console.error('Error computing learningCourses', e);
      }
    }

    // Sort by most recently watched (descending)
    return courses.sort((a, b) => {
      // Find last watched time for each course
      const getLastWatched = (title: string) => {
        let latest = 0;
        Object.values(allProgress).forEach(rec => {
          if (rec.courseTitle === title && rec.lastWatched > latest) {
            latest = rec.lastWatched;
          }
        });
        return latest;
      };
      return getLastWatched(b.courseTitle) - getLastWatched(a.courseTitle);
    });
  }, [allProgress]);

  const historyVideos = useMemo(() => {
    return sortedProgress.map(item => {
      let thumbnail = item.thumbnailLink;
      if (!thumbnail && item.courseTitle) {
        const cachedCourseStr = localStorage.getItem(`gdrive_course_${item.courseTitle}`);
        if (cachedCourseStr) {
          try {
            const parsedCourse = JSON.parse(cachedCourseStr);
            if (parsedCourse && Array.isArray(parsedCourse.selections)) {
              for (const sel of parsedCourse.selections) {
                if (sel && Array.isArray(sel.lessons)) {
                  const foundLesson = sel.lessons.find((l: any) => l && l.id === item.lessonId);
                  if (foundLesson && foundLesson.thumbnailLink) {
                    thumbnail = foundLesson.thumbnailLink;
                    break;
                  }
                }
              }
            }
          } catch (e) {
            console.error('Error finding lesson thumbnail from cache', e);
          }
        }
      }

      const calculatedProgress = item.completed 
        ? 100 
        : Math.round(((item.progress || 0) / (item.duration || 1)) * 100);

      return {
        courseTitle: item.courseTitle,
        videoTitle: cleanLessonDisplayTitle(item.videoTitle),
        progress: Math.min(100, Math.max(0, calculatedProgress)),
        lessonId: item.lessonId,
        thumbnailLink: thumbnail,
        isDrive: item.isDrive,
        driveFolderId: item.driveFolderId
      };
    });
  }, [sortedProgress]);



  // Build a flat chronological timeline of ALL lessons across all cached courses
  interface TimelineItem {
    courseTitle: string;
    courseName: string;
    selectionName: string;
    lessonId: string;
    lessonTitle: string;
    displayTitle: string;
    date: Date | null;
    dateLabel: string;
    duration: number;
    isCompleted: boolean;
    isDrive: boolean;
    driveFolderId: string;
    thumbnailLink: string;
  }

  const chronologicalTimeline = useMemo(() => {
    const items: TimelineItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gdrive_course_')) {
        try {
          const cachedCourseStr = localStorage.getItem(key);
          if (!cachedCourseStr) continue;
          const parsedCourse = JSON.parse(cachedCourseStr);
          if (!parsedCourse || !Array.isArray(parsedCourse.selections)) continue;
          parsedCourse.selections = sortSelectionsLessons(parsedCourse.selections);

          const courseTitle = parsedCourse.name || parsedCourse.title || 'Khóa học';
          const isDrive = !!parsedCourse.isDrive;
          const driveFolderId = parsedCourse.driveFolderId || '';

          parsedCourse.selections.forEach((sel: any) => {
            if (!sel || !Array.isArray(sel.lessons)) return;
            const selName = cleanSelectionName(sel.name || '');
            sel.lessons.forEach((les: any) => {
              if (!les || !les.id) return;
              const lessonKey = `${courseTitle}/${les.id}`;
              const isCompleted = !!(allProgress && allProgress[lessonKey]?.completed);
              const lessonDate = parseLessonDate(les.title || les.id || '');
              const dur = les.duration || (allProgress[lessonKey]?.duration) || 0;

              let dateLabel = '';
              if (lessonDate) {
                dateLabel = formatDateVN(lessonDate);
              }

              items.push({
                courseTitle,
                courseName: courseTitle,
                selectionName: selName,
                lessonId: les.id,
                lessonTitle: les.title || les.id || '',
                displayTitle: cleanLessonDisplayTitle(les.title || les.id || ''),
                date: lessonDate,
                dateLabel,
                duration: dur,
                isCompleted,
                isDrive,
                driveFolderId,
                thumbnailLink: les.thumbnailLink || '',
              });
            });
          });
        } catch (e) {
          console.error('Error building timeline from localStorage', e);
        }
      }
    }

    // Sort chronologically by date; lessons without dates go to the end
    items.sort((a, b) => {
      if (a.date && b.date) return a.date.getTime() - b.date.getTime();
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return a.lessonTitle.localeCompare(b.lessonTitle, undefined, { numeric: true });
    });

    return items;
  }, [allProgress]);

  const renderEmptyState = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '24px',
        marginBottom: '16px',
      }}
    >
      <div
        onClick={onAddDriveCourse}
        className="store-utility-card"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAddDriveCourse?.();
          }
        }}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '48px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--background)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <GraduationCap size={24} style={{ color: 'var(--primary)' }} aria-hidden="true" />
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '21px',
            color: 'var(--text-primary)',
            marginBottom: '10px',
            letterSpacing: '-0.015em',
          }}
        >
          Học từ Google Drive
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            maxWidth: '320px',
            marginBottom: '24px',
          }}
        >
          Kết nối tài khoản Google Drive để stream video và tài liệu học tập trực tiếp từ đám mây.
        </p>

        <Button variant="primary" onClick={onAddDriveCourse}>
          Kết nối Google Drive
        </Button>
      </div>
    </div>
  );

  return (
    <main
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 24px',
        fontFamily: 'var(--font-body)',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Full-Width Hero Banner */}
      <div
        style={{
          borderRadius: '16px',
          backgroundColor: 'var(--background)',
          padding: '24px 32px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '24px',
          position: 'relative',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '40px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Column: YouTube Video Embed */}
        <div 
          style={{ 
            zIndex: 1, 
            flexShrink: 0, 
            width: '540px', 
            maxWidth: '100%',
            aspectRatio: '16/9',
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            backgroundColor: '#000000',
          }}
        >
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/H7gwFknR5nQ"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ border: 0 }}
          />
        </div>

        {/* Right Column: Hero Title, Description, Quote, and Action */}
        <div style={{ zIndex: 1, flex: '1 1 0%', minWidth: '280px', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '28px',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: 'var(--text-primary)',
              }}
            >
              {learningCourses.length === 0 ? "Bắt đầu hành trình học tập" : "Học tập không giới hạn"}
            </h1>
            <p style={{ margin: '12px 0 0 0', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, fontWeight: 500 }}>
              {learningCourses.length === 0 
                ? "Kết nối tài khoản Google Drive của bạn để đồng bộ video bài giảng, đọc tài liệu và làm đề thi thử trực tiếp từ đám mây."
                : "Tiếp tục hành trình chinh phục kiến thức của bạn. Truy cập kho bài giảng video, đọc tài liệu workbook và làm đề thi thử mocktest chất lượng cao."
              }
            </p>
          </div>

          {/* Elegant Quote with Left border accent */}
          <div 
            style={{ 
              paddingLeft: '16px',
              borderLeft: '3px solid var(--primary)',
              margin: '8px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <p 
              style={{ 
                margin: 0, 
                fontSize: '13.5px', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              “ {randomQuote.text} ”
            </p>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'var(--primary)', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {randomQuote.author === "Khuyết danh" ? "Khuyết danh" : randomQuote.author}
            </span>
          </div>

          <div>
            <button
              onClick={() => {
                if (learningCourses.length > 0) {
                  const c = learningCourses[0];
                  onNavigateToPlayer(c.courseTitle, c.lessonId, c.isDrive, c.driveFolderId);
                } else if (onAddDriveCourse) {
                  onAddDriveCourse();
                }
              }}
              style={{
                height: '40px',
                padding: '0 20px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
              }}
            >
              {learningCourses.length === 0 ? "Kết nối Google Drive" : "Tiếp tục học"}
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid #e8eef7',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        {[
          { id: 'learning', label: 'Đang học', count: learningCourses.length },
          { id: 'history', label: 'Lịch sử xem', count: historyVideos.length },
          { id: 'completed', label: 'Lịch trình học', count: chronologicalTimeline.length }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`category-tab-btn${isActive ? ' category-tab-btn--active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="category-tab-btn__badge">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'learning' && (
          <div className="tab-content-active">
            {learningCourses.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                }}
              >
                {learningCourses.map((course, index) => (
                  <VideoCard
                    key={`${course.courseTitle}-${index}`}
                    {...course}
                    onNavigateToPlayer={() => onNavigateToPlayer(course.courseTitle, course.lessonId, course.isDrive, course.driveFolderId)}
                  />
                ))}
              </div>
            ) : (
              renderEmptyState()
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content-active">
            {historyVideos.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                }}
              >
                {historyVideos.map((video, index) => (
                  <VideoCard
                    key={`${video.courseTitle}-${video.videoTitle}-${index}`}
                    {...video}
                    onNavigateToPlayer={() => onNavigateToPlayer(video.courseTitle, video.lessonId, video.isDrive, video.driveFolderId)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: '200px',
                  border: '1px dashed #c8d3e8',
                  borderRadius: '16px',
                  backgroundColor: '#f8fafc',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <Compass size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} aria-hidden="true" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f1f1f', margin: '0 0 4px 0' }}>
                  Lịch sử xem trống
                </h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                  Lịch sử xem của bạn sẽ xuất hiện ở đây sau khi bạn xem bài học.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="tab-content-active">
            {chronologicalTimeline.length > 0 ? (() => {
              // Group by date label for timeline sections
              const grouped: { dateLabel: string; items: typeof chronologicalTimeline }[] = [];
              let lastLabel = '';
              chronologicalTimeline.forEach(item => {
                const label = item.dateLabel || 'Chưa xác định ngày';
                if (label !== lastLabel) {
                  grouped.push({ dateLabel: label, items: [] });
                  lastLabel = label;
                }
                grouped[grouped.length - 1].items.push(item);
              });

              const completedCount = chronologicalTimeline.filter(i => i.isCompleted).length;
              const totalCount = chronologicalTimeline.length;
              const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div>
                  {/* Progress summary bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', borderRadius: '12px',
                    backgroundColor: '#f0f6ff', border: '1px solid #e0e9f5',
                    marginBottom: '28px',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: `conic-gradient(#0056d2 ${progressPct * 3.6}deg, #e0e9f5 0deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        backgroundColor: '#f0f6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#0056d2',
                      }}>
                        {progressPct}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e1b4b' }}>
                        {completedCount}/{totalCount} bài đã hoàn thành
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                        Lộ trình học theo trình tự thời gian
                      </div>
                    </div>
                  </div>

                  {/* Chronological Grid of Lesson Cards */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '16px',
                    width: '100%',
                  }}>
                    {chronologicalTimeline.map((item, index) => {
                      const displayIndex = (index + 1).toString().padStart(2, '0');
                      return (
                        <div
                          key={`${item.lessonId}-${index}`}
                          onClick={() => onNavigateToPlayer(item.courseTitle, item.lessonId, item.isDrive, item.driveFolderId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onNavigateToPlayer(item.courseTitle, item.lessonId, item.isDrive, item.driveFolderId);
                            }
                          }}
                          style={{
                            backgroundColor: 'var(--color-canvas)',
                            border: '1px solid var(--color-hairline)',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: 'var(--shadow-card)',
                            padding: '16px',
                            display: 'flex',
                            gap: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-product)';
                            e.currentTarget.style.borderColor = 'var(--color-primary-focus)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                            e.currentTarget.style.borderColor = 'var(--color-hairline)';
                          }}
                        >
                          {/* Number badge */}
                          <div style={{
                            width: '36px', height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#f0f6ff',
                            color: '#0056d2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                            flexShrink: 0,
                          }}>
                            {displayIndex}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{
                              fontSize: '13px', fontWeight: 600, color: item.isCompleted ? '#94a3b8' : '#1e1b4b',
                              textDecoration: item.isCompleted ? 'line-through' : 'none',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.displayTitle}
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              fontSize: '11px', color: '#94a3b8', marginTop: '4px',
                            }}>
                              <span style={{
                                padding: '1px 5px', borderRadius: '3px',
                                backgroundColor: '#f0f6ff', color: '#0056d2',
                                fontWeight: 600, fontSize: '10px',
                              }}>
                                {item.selectionName}
                              </span>
                              {item.duration > 0 && (
                                <span>
                                  {item.duration >= 3600
                                    ? `${Math.floor(item.duration / 3600)}g${Math.ceil((item.duration % 3600) / 60)}p`
                                    : `${Math.ceil(item.duration / 60)}p`
                                  }
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Completed check status on the top right */}
                          <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {item.isCompleted && (
                              <CheckCircle2 size={15} style={{ color: '#34C759' }} aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: '200px',
                  border: '1px dashed #c8d3e8',
                  borderRadius: '16px',
                  backgroundColor: '#f8fafc',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <GraduationCap size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} aria-hidden="true" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1f1f1f', margin: '0 0 4px 0' }}>
                  Chưa có khóa học nào
                </h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                  Kết nối Google Drive để thêm khóa học mới nhé!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default LearningSection;