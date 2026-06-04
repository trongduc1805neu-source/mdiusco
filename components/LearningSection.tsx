import React, { useRef, useState, useEffect, useMemo } from 'react';
import VideoCard from './VideoCard';
import Button from './Button';
import type { ProgressData, ProgressRecord } from '../types';
import { GraduationCap, Compass, Play, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import misoLogo from '../MISO.png';

interface LearningSectionProps {
  onNavigateToPlayer: (courseTitle: string, lessonId: string, isDrive?: boolean, driveFolderId?: string) => void;
  onAddDriveCourse?: () => void;
}

const LearningSection: React.FC<LearningSectionProps> = ({ onNavigateToPlayer, onAddDriveCourse }) => {
  const [allProgress, setAllProgress] = useState<ProgressData>({});
  const [activeTab, setActiveTab] = useState<'learning' | 'history' | 'completed'>('learning');

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem('videoProgress');
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        if (parsed && typeof parsed === 'object') {
          setAllProgress(parsed);
        } else {
          setAllProgress({});
        }
      }
    } catch (error) {
      console.error('Failed to parse progress from localStorage', error);
      setAllProgress({});
    }
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
        videoTitle: item.videoTitle,
        progress: Math.min(100, Math.max(0, calculatedProgress)),
        lessonId: item.lessonId,
        thumbnailLink: thumbnail,
        isDrive: item.isDrive,
        driveFolderId: item.driveFolderId
      };
    });
  }, [sortedProgress]);

  const parseLessonDate = (title: string): Date | null => {
    if (!title) return null;
    const dateMatch = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
      const year = parseInt(dateMatch[3], 10);
      return new Date(year, month, day);
    }
    const ethicsDateMatch = title.match(/_(\d{4})_(\d{2})(\d{2})/);
    if (ethicsDateMatch) {
      const year = parseInt(ethicsDateMatch[1], 10);
      const month = parseInt(ethicsDateMatch[2], 10) - 1;
      const day = parseInt(ethicsDateMatch[3], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  // Helper to extract a clean lesson display title (including date)
  const cleanLessonDisplayTitle = (title: string): string => {
    if (!title) return '';
    let clean = title.replace(/\.[^/.]+$/, '');
    const buoiMatch = clean.match(/Buổi\s*(\d+)/i);
    let buoiText = '';
    if (buoiMatch) buoiText = `Buổi ${buoiMatch[1]}`;

    // Extract date from title
    let dateText = '';
    const dotDate = clean.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dotDate) {
      dateText = `${dotDate[1]}/${dotDate[2]}/${dotDate[3]}`;
    } else {
      const underscoreDate = clean.match(/_(\d{4})_(\d{2})(\d{2})/);
      if (underscoreDate) {
        dateText = `${underscoreDate[2]}/${underscoreDate[3]}/${underscoreDate[1]}`;
      }
    }

    const isGvNote = clean.toLowerCase().includes('gv note');
    let gvText = isGvNote ? ' (GV Note)' : '';
    if (buoiText) {
      if (dateText) return `${buoiText}${gvText} - ${dateText}`;
      return `${buoiText}${gvText}`;
    }
    clean = clean.replace(/^[A-Z0-9._-]+_(QUANT|ECON|FSA|CI|EQUITY|FI|DER|AI|PM|ETHICS)_/i, '');
    clean = clean.replace(/^CFA\d+_/i, '');
    return clean;
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
          <GraduationCap size={24} style={{ color: 'var(--primary)' }} />
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
          background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 50%, #fff7ed 100%)',
          padding: '32px 40px',
          border: '1px solid #f0e6f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '40px',
        }}
      >
        <div style={{ zIndex: 1, flex: 1 }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '28px',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: '#1e1b4b',
            }}
          >
            Học tập không giới hạn
          </h1>
          <p style={{ margin: '12px 0 24px 0', color: '#475569', fontSize: '15px', lineHeight: 1.5, fontWeight: 500 }}>
            Tiếp tục hành trình chinh phục kiến thức của bạn. Truy cập kho bài giảng video, đọc tài liệu workbook và làm đề thi thử mocktest chất lượng cao.
          </p>
          <button
            onClick={() => {
              if (learningCourses.length > 0) {
                const c = learningCourses[0];
                onNavigateToPlayer(c.courseTitle, c.lessonId, c.isDrive, c.driveFolderId);
              }
            }}
            disabled={learningCourses.length === 0}
            style={{
              height: '40px',
              padding: '0 20px',
              backgroundColor: '#0056d2',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              borderRadius: '4px',
              cursor: learningCourses.length > 0 ? 'pointer' : 'not-allowed',
              opacity: learningCourses.length > 0 ? 1 : 0.6,
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={e => {
              if (learningCourses.length > 0) e.currentTarget.style.backgroundColor = '#00419e';
            }}
            onMouseLeave={e => {
              if (learningCourses.length > 0) e.currentTarget.style.backgroundColor = '#0056d2';
            }}
          >
            Tiếp tục học
          </button>
        </div>

        <div style={{ zIndex: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <img
            src={misoLogo}
            alt="Mascot"
            style={{
              height: '130px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>

      {/* Category Filter Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid #e8eef7',
          paddingBottom: '12px',
          marginBottom: '32px',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '100px',
                border: 'none',
                backgroundColor: isActive ? '#0056d2' : '#f0f4f9',
                color: isActive ? '#ffffff' : '#1f1f1f',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#e1e8f5';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#f0f4f9';
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '100px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                  color: isActive ? '#ffffff' : '#64748b',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'learning' && (
          <div>
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
          <div>
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
                <Compass size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} />
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
          <div>
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

                  {/* Timeline */}
                  <div style={{ position: 'relative' }}>
                    {/* Vertical line */}
                    <div style={{
                      position: 'absolute', left: '15px', top: '0', bottom: '0',
                      width: '2px', backgroundColor: '#e0e9f5', zIndex: 0,
                    }} />

                    {grouped.map((group, gIndex) => (
                      <div key={gIndex} style={{ marginBottom: '8px' }}>
                        {/* Date header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          marginBottom: '4px', position: 'relative', zIndex: 1,
                        }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: '#0056d2', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Calendar size={14} style={{ color: '#ffffff' }} />
                          </div>
                          <span style={{
                            fontSize: '13px', fontWeight: 700, color: '#0056d2',
                            letterSpacing: '0.02em',
                          }}>
                            {group.dateLabel}
                          </span>
                        </div>

                        {/* Lessons for this date */}
                        {group.items.map((item, iIndex) => (
                          <div
                            key={`${item.lessonId}-${iIndex}`}
                            onClick={() => onNavigateToPlayer(item.courseTitle, item.lessonId, item.isDrive, item.driveFolderId)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '10px 14px 10px 44px',
                              cursor: 'pointer', position: 'relative', zIndex: 1,
                              borderRadius: '8px',
                              transition: 'background-color 120ms ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {/* Status dot */}
                            <div style={{
                              position: 'absolute', left: '8px',
                              width: '16px', height: '16px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {item.isCompleted
                                ? <CheckCircle2 size={14} style={{ color: '#34C759' }} />
                                : <Circle size={10} style={{ color: '#c8d3e8' }} />
                              }
                            </div>

                            {/* Thumbnail */}
                            {item.thumbnailLink && (
                              <img
                                src={item.thumbnailLink}
                                alt=""
                                style={{
                                  width: '64px', height: '36px', objectFit: 'cover',
                                  borderRadius: '4px', flexShrink: 0,
                                  border: '1px solid #e8eef7',
                                }}
                              />
                            )}

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '14px', fontWeight: 600, color: item.isCompleted ? '#94a3b8' : '#1e1b4b',
                                textDecoration: item.isCompleted ? 'line-through' : 'none',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {item.displayTitle}
                              </div>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '12px', color: '#94a3b8', marginTop: '2px',
                              }}>
                                <span style={{
                                  padding: '1px 6px', borderRadius: '4px',
                                  backgroundColor: '#f0f6ff', color: '#0056d2',
                                  fontWeight: 600, fontSize: '11px',
                                }}>
                                  {item.selectionName}
                                </span>
                                {item.duration > 0 && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Clock size={10} />
                                    {item.duration >= 3600
                                      ? `${Math.floor(item.duration / 3600)}g${Math.ceil((item.duration % 3600) / 60)}p`
                                      : `${Math.ceil(item.duration / 60)} phút`
                                    }
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Play indicator */}
                            <Play size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    ))}
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
                <GraduationCap size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} />
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