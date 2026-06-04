import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Course, Lesson, CourseDocument, ProgressData } from '../types';
import DictionaryPopover from './DictionaryPopover';
import IconBadge from './IconBadge';
import Button from './Button';
import {
    ArrowLeft, Pin, RefreshCw, Menu, ChevronDown, ChevronRight,
    Play, CheckCircle2, Circle, Clock, Star, ArrowRight,
    BookOpen, FileText, Maximize2, BookMarked, ClipboardList,
    Eye, Layers, Languages
} from 'lucide-react';
import '../styles/CoursePlayer.css';

const getFakeDurationInMinutes = (lessonId: string): number => {
    return 180;
};

interface CoursePlayerProps {
    onNavigateHome: () => void;
    course: Course | null;
    startingLessonId?: string;
    onSyncDriveCourse?: () => void;
}

const getReadingNumber = (name: string): number => {
    const match = name.match(/Reading\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : 999;
};

const sortDocsByReading = (docs: CourseDocument[]): CourseDocument[] => {
    return [...docs].sort((a, b) => {
        const numA = getReadingNumber(a.name);
        const numB = getReadingNumber(b.name);
        if (numA !== numB) {
            return numA - numB;
        }
        const isAnswerA = a.name.toLowerCase().includes('answer');
        const isAnswerB = b.name.toLowerCase().includes('answer');
        if (isAnswerA !== isAnswerB) {
            return isAnswerA ? 1 : -1;
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
};

const findMatchingAnswerDoc = (doc: CourseDocument, list: CourseDocument[]) => {
    if (!doc || !list) return null;
    const cleanName = doc.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
    return list.find(item => {
        const itemName = item.name.toLowerCase();
        return itemName.includes(cleanName) && itemName.includes('answer');
    }) || null;
};

const cleanDocName = (name: string, isMocktest: boolean): string => {
    if (!name) return isMocktest ? 'Mocktest' : 'Workbook';
    
    // Remove extension
    let clean = name.replace(/\.[^/.]+$/, "");
    
    // If it contains answer
    const isAnswer = clean.toLowerCase().includes('answer');
    clean = clean.replace(/\(?answer\)?/gi, '').replace(/\(?đáp án\)?/gi, '').trim();
    
    const lower = clean.toLowerCase();
    
    // List of generic names to replace
    const genericNames = [
        '2025_cfa_l1v1_quant', '2025_cfa_l1v2_econ', 'fsa', '2025_cfa_l1v4_ci', 
        'equity', '2025_cfa_l1v6_fi', 'deriv', '2025_cfa_l1v8_alts', 
        '2025_cfa_l1v9_pm', '2025_cfa_l1v10_ethics'
    ];
    
    const isGeneric = genericNames.some(gen => lower.includes(gen)) || 
                      lower === 'quant' || lower === 'econ' || lower === 'derivs' || lower === 'alts';
                      
    if (isGeneric) {
        let topic = clean.toUpperCase();
        if (topic.startsWith('2025_CFA_L1V')) {
            const parts = topic.split('_');
            topic = parts[parts.length - 1];
        }
        if (topic === 'DERIV') topic = 'DERIVATIVES';
        if (topic === 'ALTS') topic = 'AI';
        
        const label = isMocktest ? 'Đề thi Mocktest' : 'Workbook';
        return `${label} - ${topic}${isAnswer ? ' (Đáp án)' : ''}`;
    }
    
    // If it's not generic, just clean up standard prefixes
    clean = clean.replace(/^2025_CFA_L1V\d+_/i, '');
    clean = clean.replace(/^[^-]+-\s*/, "");
    
    // Strip trailing hyphens or underscores
    clean = clean.replace(/^[-_\s]+|[-_\s]+$/g, '').trim();
    
    return clean + (isAnswer ? ' (Đáp án)' : '');
};

const getShortDocName = (name: string, isMocktest: boolean = false): string => {
    if (!name) return '';
    const cleanName = cleanDocName(name, isMocktest);
    const readingMatch = cleanName.match(/Reading\s+(\d+)/i);
    if (readingMatch) {
        return `Reading ${readingMatch[1]}`;
    }
    if (cleanName.length > 22) {
        return cleanName.substring(0, 20) + '...';
    }
    return cleanName;
};

const cleanLessonTitle = (title: string): string => {
    if (!title) return '';
    
    let clean = title.replace(/\.[^/.]+$/, "");
    
    const buoiMatch = clean.match(/Buổi\s*(\d+)/i);
    let buoiText = '';
    if (buoiMatch) {
        buoiText = `Buổi học ${buoiMatch[1]}`;
    }
    
    const parsedDate = clean.match(/(\d{2}\.\d{2}\.\d{4})/);
    let dateText = '';
    if (parsedDate) {
        dateText = parsedDate[1];
    } else {
        const ethicsDateMatch = clean.match(/_(\d{4})_(\d{2})(\d{2})/);
        if (ethicsDateMatch) {
            dateText = `${ethicsDateMatch[2]}.${ethicsDateMatch[3]}.${ethicsDateMatch[1]}`;
        }
    }
    
    const isGvNote = clean.toLowerCase().includes('gv note');
    let gvText = isGvNote ? ' (GV Note)' : '';
    
    if (buoiText) {
        if (dateText) {
            return `${buoiText}${gvText} - Ngày ${dateText}`;
        }
        return `${buoiText}${gvText}`;
    }
    
    clean = clean.replace(/^[A-Z0-9._-]+_QUANT_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_ECON_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_FSA_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_CI_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_EQUITY_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_FI_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_DER_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_AI_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_PM_/i, '');
    clean = clean.replace(/^[A-Z0-9._-]+_ETHICS_/i, '');
    clean = clean.replace(/^CFA\d+_/i, '');
    
    return clean;
};

const CoursePlayer: React.FC<CoursePlayerProps> = ({ onNavigateHome, course, startingLessonId, onSyncDriveCourse }) => {
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [activeTab, setActiveTab] = useState<'video' | 'workbook' | 'mocktest'>('video');
    const [activeWorkbook, setActiveWorkbook] = useState<CourseDocument | null>(null);
    const [activeMocktest, setActiveMocktest] = useState<CourseDocument | null>(null);
    const [showWorkbookAnswer, setShowWorkbookAnswer] = useState<boolean>(false);
    const [showMocktestAnswer, setShowMocktestAnswer] = useState<boolean>(false);
    const [workbookData, setWorkbookData] = useState<{ rawData: string | ArrayBuffer; type: 'html' | 'txt' | 'pdf' } | null>(null);
    const [isWorkbookLoading, setIsWorkbookLoading] = useState<boolean>(false);
    const [mocktestData, setMocktestData] = useState<{ rawData: string | ArrayBuffer; type: 'html' | 'txt' | 'pdf' } | null>(null);
    const [isMocktestLoading, setIsMocktestLoading] = useState<boolean>(false);
    const [progressData, setProgressData] = useState<ProgressData>({});
    const [isPinned, setIsPinned] = useState<boolean>(false);

    // Watch progress states
    const [videoProgressSeconds, setVideoProgressSeconds] = useState<number>(0);
    const [iframeSrc, setIframeSrc] = useState<string>('');
    const [inputH, setInputH] = useState<number>(0);
    const [inputM, setInputM] = useState<number>(0);
    const [inputS, setInputS] = useState<number>(0);

    // Dictionary states
    const [dictionaryData, setDictionaryData] = useState<any | null>(null);
    const [vietnameseTranslation, setVietnameseTranslation] = useState<string | null>(null);
    const [isDictionaryLoading, setIsDictionaryLoading] = useState<boolean>(false);
    const [dictionaryPosition, setDictionaryPosition] = useState<{ top: number, left: number, positionAbove: boolean } | null>(null);
    const [selectedWord, setSelectedWord] = useState<string>('');
    const dictionaryRef = useRef<HTMLDivElement>(null);
    
    // Resizable sidebar states
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const [sidebarWidth, setSidebarWidth] = useState<number>(320);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    
    // Collapsible curriculum selections
    const [expandedSelections, setExpandedSelections] = useState<Record<string, boolean>>({});
    const [expandedMocktests, setExpandedMocktests] = useState<Record<string, boolean>>({});

    // Keyboard navigation
    const [focusedLessonId, setFocusedLessonId] = useState<string | null>(null);
    const lessonRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());

    // Mobile sidebar
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);



    const toggleSidebar = () => {
        if (window.innerWidth <= 1024) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const allLessons = useMemo(() => {
        if (!course || !Array.isArray(course.selections)) return [];
        return course.selections.flatMap(selection => (selection && Array.isArray(selection.lessons)) ? selection.lessons : []);
    }, [course]);

    // Find current section of active lesson
    const currentSection = useMemo(() => {
        if (!course || !activeLesson || !Array.isArray(course.selections)) return null;
        return course.selections.find(s => s && Array.isArray(s.lessons) && s.lessons.some(l => l && l.id === activeLesson.id)) || null;
    }, [course, activeLesson]);

    const matchingWorkbookAnswer = useMemo(() => {
        if (!activeWorkbook || !currentSection?.workbooks) return null;
        return findMatchingAnswerDoc(activeWorkbook, currentSection.workbooks);
    }, [activeWorkbook, currentSection]);

    const matchingMocktestAnswer = useMemo(() => {
        if (!activeMocktest || !currentSection?.mocktests) return null;
        return findMatchingAnswerDoc(activeMocktest, currentSection.mocktests);
    }, [activeMocktest, currentSection]);

    // Combine lesson documents and section documents (workbooks, general notes)
    const allDocs = useMemo(() => {
        if (!activeLesson) return [];
        const lessonDocs = activeLesson.documents || [];
        const sectionDocs = currentSection?.documents || [];
        
        // Combine and deduplicate by driveFileId
        const combined = [...lessonDocs];
        sectionDocs.forEach(sDoc => {
            if (sDoc.driveFileId && !combined.some(lDoc => lDoc.driveFileId === sDoc.driveFileId)) {
                combined.push(sDoc);
            }
        });
        return combined;
    }, [activeLesson, currentSection]);

    // Helper to clean section name from redundant numbering (e.g. "1. QUANT" -> "QUANT")
    const cleanSectionName = (name: string): string => {
        return name.replace(/^\d+\s*[-._]?\s*/, '');
    };

    // Helper to format seconds to Hours:Minutes:Seconds text
    const formatSecondsToHMS = (secs: number): string => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        if (h > 0) return `${h} giờ ${m} phút ${s} giây`;
        return `${m} phút ${s} giây`;
    };


    const handleTextSelection = useCallback(async () => {
        const selection = window.getSelection();
        if (!selection) return;

        const rawText = selection.toString().trim();
        if (!rawText || /\s/.test(rawText)) return; // Không dịch nếu trống hoặc chứa khoảng trắng (nhiều từ)

        const selectedText = rawText.toLowerCase().replace(/[^a-z-]/g, '');

        if (selectedText && selectedText.length > 2) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            const popoverWidth = 360;
            let left = rect.left;
            
            // Adjust left to keep within screen bounds
            left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));
            
            // Check if there is enough space below the text (estimated max height is 420px)
            const estimatedPopoverHeight = 420;
            const spaceBelow = window.innerHeight - rect.bottom;
            const positionAbove = spaceBelow < estimatedPopoverHeight;
            
            // Viewport-relative coordinates (fixed position)
            const top = positionAbove ? (rect.top - 5) : (rect.bottom + 5);
            
            const newPosition = { top, left, positionAbove };

            setDictionaryPosition(newPosition);
            setSelectedWord(selectedText);
            setIsDictionaryLoading(true);
            setDictionaryData(null);
            setVietnameseTranslation(null);
            
            Promise.all([
                // Fetch English dictionary details
                fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null),
                // Fetch Vietnamese translation using MyMemory API
                fetch(`https://api.mymemory.translated.net/get?q=${selectedText}&langpair=en|vi`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => data?.responseData?.translatedText || null)
                    .catch(() => null)
            ]).then(([dictData, translation]) => {
                setDictionaryData(dictData);
                setVietnameseTranslation(translation);
            }).catch(err => {
                console.error("Translation lookup error:", err);
                setDictionaryData({ error: 'Đã xảy ra lỗi khi tra từ.' });
            }).finally(() => {
                setIsDictionaryLoading(false);
            });
        }
    }, []);

    // Check if current course is the default pinned course
    useEffect(() => {
        if (course && course.driveFolderId) {
            const defaultFolderId = localStorage.getItem('gdrive_default_folder_id');
            setIsPinned(defaultFolderId === course.driveFolderId);
        }
    }, [course]);

    // Initialize course lessons, progress, and select starting lesson
    useEffect(() => {
        if (course) {
            let allProgress = {};
            try {
                const stored = localStorage.getItem('videoProgress');
                allProgress = stored ? JSON.parse(stored) : {};
            } catch (err) {
                console.error("Failed to parse progress data:", err);
            }
            setProgressData(allProgress);

            // Expand all selections by default when a new course is loaded
            const allExpanded: Record<string, boolean> = {};
            if (Array.isArray(course.selections)) {
                course.selections.forEach(sel => {
                    if (sel && sel.name) {
                        allExpanded[sel.name] = true;
                    }
                });
            }
            setExpandedSelections(allExpanded);

            let lessonToStart: Lesson | null = null;
            if (startingLessonId && Array.isArray(course.selections)) {
                for (const selection of course.selections) {
                    if (selection && Array.isArray(selection.lessons)) {
                        const foundLesson = selection.lessons.find(l => l && l.id === startingLessonId);
                        if (foundLesson) {
                            lessonToStart = foundLesson;
                            break;
                        }
                    }
                }
            }

            if (lessonToStart) {
                setActiveLesson(lessonToStart);
            } else if (Array.isArray(course.selections) && course.selections[0] && Array.isArray(course.selections[0].lessons) && course.selections[0].lessons[0]) {
                setActiveLesson(course.selections[0].lessons[0]);
            } else {
                setActiveLesson(null);
            }
        } else {
            setProgressData({});
            setActiveLesson(null);
        }
        setActiveTab('video');
    }, [course, startingLessonId]);

    // Watch progress sync when active lesson changes
    useEffect(() => {
        if (activeLesson && course) {
            const lessonKey = getLessonKey(activeLesson);
            if (lessonKey) {
                let allProgress: Record<string, any> = {};
                try {
                    const stored = localStorage.getItem('videoProgress');
                    allProgress = stored ? JSON.parse(stored) : {};
                } catch (err) {
                    console.error("Failed to parse progress:", err);
                }
                const currentRecord = allProgress[lessonKey];
                const isCompleted = currentRecord?.completed || false;
                const savedSeconds = currentRecord?.progress || 0;
                
                // Initialize timestamp inputs
                setVideoProgressSeconds(savedSeconds);
                setInputH(Math.floor(savedSeconds / 3600));
                setInputM(Math.floor((savedSeconds % 3600) / 60));
                setInputS(Math.floor(savedSeconds % 60));

                // Save initial progress record if none exists
                if (!currentRecord) {
                    const newRecord = {
                        progress: 0,
                        completed: isCompleted,
                        courseTitle: course.name,
                        videoTitle: activeLesson.title,
                        lessonId: activeLesson.id,
                        thumbnailLink: activeLesson.thumbnailLink,
                        lastWatched: Date.now(),
                        duration: activeLesson.duration || 180 * 60,
                        selectionsCount: Array.isArray(course.selections) ? course.selections.length : 0,
                        isDrive: true,
                        driveFolderId: course.driveFolderId
                    };
                    const updatedProgress = { ...allProgress, [lessonKey]: newRecord };
                    setProgressData(updatedProgress);
                    localStorage.setItem('videoProgress', JSON.stringify(updatedProgress));
                }

                // Compute initial iframe source with start time parameter
                if (savedSeconds > 0) {
                    setIframeSrc(`https://drive.google.com/file/d/${activeLesson.videoDriveId}/preview?t=${Math.floor(savedSeconds)}s`);
                } else {
                    setIframeSrc(`https://drive.google.com/file/d/${activeLesson.videoDriveId}/preview`);
                }
            }
        }
    }, [activeLesson]);

    // Auto-select first workbook and mocktest when selection changes
    useEffect(() => {
        if (currentSection) {
            if (currentSection.workbooks && currentSection.workbooks.length > 0) {
                const questionWorkbooks = currentSection.workbooks.filter(doc => !doc.name.toLowerCase().includes('answer'));
                if (questionWorkbooks.length > 0) {
                    setActiveWorkbook(questionWorkbooks[0]);
                } else {
                    setActiveWorkbook(currentSection.workbooks[0]);
                }
            } else {
                setActiveWorkbook(null);
            }
            if (currentSection.mocktests && currentSection.mocktests.length > 0) {
                const questionMocktests = currentSection.mocktests.filter(doc => !doc.name.toLowerCase().includes('answer'));
                if (questionMocktests.length > 0) {
                    setActiveMocktest(questionMocktests[0]);
                } else {
                    setActiveMocktest(currentSection.mocktests[0]);
                }
            } else {
                setActiveMocktest(null);
            }
            setShowWorkbookAnswer(false);
            setShowMocktestAnswer(false);
        }
    }, [currentSection]);

    // Global translation listener, only triggers when activeTab is workbook or mocktest
    useEffect(() => {
        if (activeTab !== 'workbook' && activeTab !== 'mocktest') {
            return;
        }

        const handleGlobalMouseUp = (e: MouseEvent) => {
            // Do not trigger dictionary if mouseup occurs inside the dictionary popover
            if (dictionaryRef.current && dictionaryRef.current.contains(e.target as Node)) {
                return;
            }
            handleTextSelection();
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [activeTab, handleTextSelection]);

    const fetchFileContent = useCallback(async (fileId: string, isBinary: boolean): Promise<string | ArrayBuffer> => {
        const token = localStorage.getItem('google_access_token');
        if (!token) {
            throw new Error('Google access token not found');
        }
        
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.statusText}`);
        }
        
        if (isBinary) {
            return await response.arrayBuffer();
        }
        return await response.text();
    }, []);

    // Watch workbook file change and fetch content if HTML/TXT/PDF
    useEffect(() => {
        const doc = showWorkbookAnswer && matchingWorkbookAnswer ? matchingWorkbookAnswer : activeWorkbook;
        if (!doc) {
            setWorkbookData(null);
            return;
        }
        
        // Fetch HTML/TXT/PDF directly in app DOM if access token exists
        const token = localStorage.getItem('google_access_token');
        const hasToken = !!token;

        if (hasToken && (doc.type === 'html' || doc.type === 'txt' || doc.type === 'pdf')) {
            setIsWorkbookLoading(true);
            setWorkbookData(null);
            const isBinary = doc.type === 'pdf';
            fetchFileContent(doc.driveFileId, isBinary)
                .then(rawData => {
                    setWorkbookData({ rawData, type: doc.type });
                })
                .catch(err => {
                    console.error("Failed to load workbook content directly:", err);
                    setWorkbookData(null); // Fallback to iframe
                })
                .finally(() => {
                    setIsWorkbookLoading(false);
                });
        } else {
            setWorkbookData(null);
        }
    }, [activeWorkbook, showWorkbookAnswer, matchingWorkbookAnswer, fetchFileContent]);

    // Watch mocktest file change and fetch content if HTML/TXT/PDF
    useEffect(() => {
        const doc = showMocktestAnswer && matchingMocktestAnswer ? matchingMocktestAnswer : activeMocktest;
        if (!doc) {
            setMocktestData(null);
            return;
        }
        
        const token = localStorage.getItem('google_access_token');
        const hasToken = !!token;

        if (hasToken && (doc.type === 'html' || doc.type === 'txt' || doc.type === 'pdf')) {
            setIsMocktestLoading(true);
            setMocktestData(null);
            const isBinary = doc.type === 'pdf';
            fetchFileContent(doc.driveFileId, isBinary)
                .then(rawData => {
                    setMocktestData({ rawData, type: doc.type });
                })
                .catch(err => {
                    console.error("Failed to load mocktest content directly:", err);
                    setMocktestData(null); // Fallback to iframe
                })
                .finally(() => {
                    setIsMocktestLoading(false);
                });
        } else {
            setMocktestData(null);
        }
    }, [activeMocktest, showMocktestAnswer, matchingMocktestAnswer, fetchFileContent]);

    // Background auto-save progress timer
    useEffect(() => {
        if (!activeLesson || !course) return;
        const lessonKey = getLessonKey(activeLesson);
        if (!lessonKey) return;

        // Interval to auto-increment progress every 5 seconds
        const intervalId = setInterval(() => {
            if (document.hidden) return; // Don't track if page is hidden

            let allProgress: Record<string, any> = {};
            try {
                const stored = localStorage.getItem('videoProgress');
                allProgress = stored ? JSON.parse(stored) : {};
            } catch (err) {
                console.error("Failed to parse progress in timer:", err);
            }
            const currentRecord = allProgress[lessonKey];
            if (!currentRecord) return;

            if (currentRecord.completed) {
                return;
            }

            const currentProg = currentRecord.progress || 0;
            const duration = activeLesson.duration || 180 * 60;
            const newProg = Math.min(duration, currentProg + 5);
            
            const isFinished = newProg >= duration * 0.95; // Auto-complete at 95% watching

            const updatedRecord = {
                ...currentRecord,
                progress: newProg,
                completed: isFinished ? true : currentRecord.completed,
                lastWatched: Date.now()
            };

            const updatedProgress = { ...allProgress, [lessonKey]: updatedRecord };
            setProgressData(updatedProgress);
            localStorage.setItem('videoProgress', JSON.stringify(updatedProgress));

            setVideoProgressSeconds(newProg);
            setInputH(Math.floor(newProg / 3600));
            setInputM(Math.floor((newProg % 3600) / 60));
            setInputS(Math.floor(newProg % 60));
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [activeLesson, course]);

    // Sidebar resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!playerWrapperRef.current) return;
            
            const wrapperRect = playerWrapperRef.current.getBoundingClientRect();
            const newWidth = wrapperRect.right - e.clientX;
            
            const minWidth = 260;
            const maxWidth = 600;
    
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            }
        };
    
        const handleMouseUp = () => {
            setIsResizing(false);
        };
    
        if (isResizing) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
    
        return () => {
            document.body.style.cursor = 'auto';
            document.body.style.userSelect = 'auto';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Close dictionary popover on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dictionaryRef.current && !dictionaryRef.current.contains(event.target as Node)) {
                if (window.getSelection()?.toString() === '') {
                    setDictionaryPosition(null);
                    setSelectedWord('');
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            if (allLessons.length > 0) {
                const currentFocusedIndex = allLessons.findIndex(l => l.id === focusedLessonId);
                let nextIndex = -1;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = currentFocusedIndex >= 0 ? Math.min(allLessons.length - 1, currentFocusedIndex + 1) : 0;
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = currentFocusedIndex > 0 ? currentFocusedIndex - 1 : allLessons.length - 1;
                        break;
                    case 'Home':
                        e.preventDefault();
                        nextIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        nextIndex = allLessons.length - 1;
                        break;
                    case 'Enter':
                        if (focusedLessonId) {
                            const lessonToPlay = allLessons.find(l => l.id === focusedLessonId);
                            if (lessonToPlay) {
                                e.preventDefault();
                                handleLessonClick(lessonToPlay);
                            }
                        }
                        break;
                }

                if (nextIndex !== -1) {
                    const nextLessonToFocus = allLessons[nextIndex];
                    if (nextLessonToFocus) {
                        setFocusedLessonId(nextLessonToFocus.id);
                        lessonRefs.current.get(nextLessonToFocus.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                        });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [allLessons, focusedLessonId]);

    // Sync focused lesson with active lesson
    useEffect(() => {
        if (activeLesson) {
            setFocusedLessonId(activeLesson.id);
        }
    }, [activeLesson]);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const getLessonKey = (lesson: Lesson | null): string | null => {
        return course && lesson ? `${course.name}/${lesson.id}` : null;
    };

    const findNextLesson = (): Lesson | null => {
        if (!course || !activeLesson) return null;
        let foundCurrent = false;
        for (const selection of course.selections) {
            for (const lesson of selection.lessons) {
                if (foundCurrent) {
                    return lesson;
                }
                if (lesson.id === activeLesson.id) {
                    foundCurrent = true;
                }
            }
        }
        return null;
    };

    const toggleLessonCompletion = (e: React.MouseEvent, lesson: Lesson) => {
        e.stopPropagation(); // prevent triggering handleLessonClick
        const lessonKey = getLessonKey(lesson);
        if (!lessonKey || !course) return;

        let allProgress: Record<string, any> = {};
        try {
            const stored = localStorage.getItem('videoProgress');
            allProgress = stored ? JSON.parse(stored) : {};
        } catch (err) {
            console.error("Failed to parse progress in toggle completion:", err);
        }
        
        const currentRecord = allProgress[lessonKey] || {
            progress: 0,
            completed: false,
            courseTitle: course.name,
            videoTitle: lesson.title,
            lessonId: lesson.id,
            thumbnailLink: lesson.thumbnailLink,
            lastWatched: Date.now(),
            duration: lesson.duration || 180 * 60,
            selectionsCount: Array.isArray(course.selections) ? course.selections.length : 0,
            isDrive: true,
            driveFolderId: course.driveFolderId
        };

        const updatedRecord = {
            ...currentRecord,
            completed: !currentRecord.completed,
            lastWatched: Date.now()
        };

        const updatedProgress = { ...allProgress, [lessonKey]: updatedRecord };
        setProgressData(updatedProgress);
        localStorage.setItem('videoProgress', JSON.stringify(updatedProgress));
    };

    const handleLessonClick = (lesson: Lesson) => {
        setActiveLesson(lesson);
        setIsMobileSidebarOpen(false);
        
        // Ensure the selection containing the clicked lesson is expanded
        if (course) {
            for (const selection of course.selections) {
                if (selection.lessons.some(l => l.id === lesson.id)) {
                    setExpandedSelections(prev => ({ ...prev, [selection.name]: true }));
                    break;
                }
            }
        }
    };

    const handleDocumentClick = (e: React.MouseEvent, doc: CourseDocument, isMocktest: boolean) => {
        e.preventDefault();
        setIsMobileSidebarOpen(false);
        if (isMocktest) {
            setActiveMocktest(doc);
            setActiveTab('mocktest');
            setShowMocktestAnswer(false);
        } else {
            setActiveWorkbook(doc);
            setActiveTab('workbook');
            setShowWorkbookAnswer(false);
        }
    };

    const handleTogglePin = () => {
        if (!course || !course.driveFolderId) return;
        const defaultFolderId = localStorage.getItem('gdrive_default_folder_id');
        if (defaultFolderId === course.driveFolderId) {
            localStorage.removeItem('gdrive_default_folder_id');
            localStorage.removeItem('gdrive_default_workbook_folder_id');
            localStorage.removeItem('gdrive_default_mocktest_folder_id');
            localStorage.removeItem('gdrive_default_course_name');
            setIsPinned(false);
            alert('Đã hủy ghim khóa học này làm mặc định.');
        } else {
            localStorage.setItem('gdrive_default_folder_id', course.driveFolderId);
            if (course.workbookFolderId) {
                localStorage.setItem('gdrive_default_workbook_folder_id', course.workbookFolderId);
            } else {
                localStorage.removeItem('gdrive_default_workbook_folder_id');
            }
            if (course.mocktestFolderId) {
                localStorage.setItem('gdrive_default_mocktest_folder_id', course.mocktestFolderId);
            } else {
                localStorage.removeItem('gdrive_default_mocktest_folder_id');
            }
            localStorage.setItem('gdrive_default_course_name', course.name);
            setIsPinned(true);
            alert(`Đã ghim khóa học "${course.name}" làm mặc định tải khi mở web.`);
        }
    };

    // Save progress manually
    const handleSaveManualProgress = (seconds: number) => {
        if (!activeLesson || !course) return;
        const lessonKey = getLessonKey(activeLesson);
        if (!lessonKey) return;
        
        let allProgress: Record<string, any> = {};
        try {
            const stored = localStorage.getItem('videoProgress');
            allProgress = stored ? JSON.parse(stored) : {};
        } catch (err) {
            console.error("Failed to parse progress in manual save:", err);
        }
        
        const currentRecord = allProgress[lessonKey] || {
            progress: 0,
            completed: false,
            courseTitle: course.name,
            videoTitle: activeLesson.title,
            lessonId: activeLesson.id,
            thumbnailLink: activeLesson.thumbnailLink,
            lastWatched: Date.now(),
            duration: activeLesson.duration || 180 * 60,
            selectionsCount: Array.isArray(course.selections) ? course.selections.length : 0,
            isDrive: true,
            driveFolderId: course.driveFolderId
        };

        const updatedRecord = {
            ...currentRecord,
            progress: seconds,
            lastWatched: Date.now()
        };

        const updatedProgress = { ...allProgress, [lessonKey]: updatedRecord };
        setProgressData(updatedProgress);
        localStorage.setItem('videoProgress', JSON.stringify(updatedProgress));
        
        setVideoProgressSeconds(seconds);
        
        // Reload iframe with new start time parameter
        setIframeSrc(`https://drive.google.com/file/d/${activeLesson.videoDriveId}/preview?t=${Math.floor(seconds)}s`);
        alert(`Đã lưu tiến trình và phát tiếp từ: ${formatSecondsToHMS(seconds)}!`);
    };

    const handleTabClick = (tab: 'video' | 'workbook' | 'mocktest') => {
        setActiveTab(tab);
    };

    const handleToggleSelection = (selectionName: string) => {
        setExpandedSelections(prev => ({
            ...prev,
            [selectionName]: !prev[selectionName]
        }));
    };

    const toggleMocktestCollapse = (selectionName: string) => {
        setExpandedMocktests(prev => ({
            ...prev,
            [selectionName]: !prev[selectionName]
        }));
    };

    // Compute global progress
    const globalProgress = React.useMemo(() => {
        if (!course || !Array.isArray(course.selections)) return { total: 0, completed: 0, pct: 0 };
        let total = 0;
        let completed = 0;
        course.selections.forEach(sel => {
            if (!sel || !Array.isArray(sel.lessons)) return;
            sel.lessons.forEach(lesson => {
                total++;
                const key = course && lesson ? `${course.name}/${lesson.id}` : null;
                if (key && progressData[key]?.completed) completed++;
            });
        });
        return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }, [course, progressData]);

    // ─── SIDEBAR: Tree-structured curriculum with Lucide icons ───
    const renderCurriculumSidebar = () => {
        if (!course || !Array.isArray(course.selections)) {
            return (
                <div style={{ padding: '24px 14px', color: 'var(--color-ink-muted-48)', fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.6 }}>
                    Kết nối Google Drive để tải nội dung khóa học.
                </div>
            );
        }
        return course.selections.map((selection, sIndex) => {
            if (!selection) return null;
            const lessons = Array.isArray(selection.lessons) ? selection.lessons : [];
            const completedLessonsCount = lessons.filter(lesson => {
                const key = getLessonKey(lesson);
                return key ? progressData[key]?.completed : false;
            }).length;
            const totalLessons = lessons.length;
            const isExpanded = expandedSelections[selection.name];
            const isMocktestExpanded = expandedMocktests[selection.name];

            return (
                <div key={sIndex} className="module">
                    <button className="module-header" onClick={() => handleToggleSelection(selection.name)}>
                        <div className="module-title">
                            <strong>Phần {sIndex + 1}: {cleanSectionName(selection.name)}</strong>
                            <span>{completedLessonsCount}/{totalLessons} bài · {isExpanded ? 'thu gọn' : 'mở rộng'}</span>
                        </div>
                        <span className={`module-chevron ${isExpanded ? 'expanded' : 'collapsed'}`}>
                            <ChevronDown size={14} strokeWidth={2.5} />
                        </span>
                    </button>
                    <ul className={`lesson-list ${!isExpanded ? 'collapsed' : ''}`}>

                        {/* ── Workbook documents ── */}
                        {Array.isArray(selection.workbooks) && sortDocsByReading(selection.workbooks)
                            .filter(doc => !doc.name.toLowerCase().includes('answer'))
                            .map((doc, wIndex) => {
                                const isActive = activeTab === 'workbook' && activeWorkbook?.driveFileId === doc.driveFileId;
                                const cleanName = cleanDocName(doc.name, false);
                                return (
                                    <li
                                        key={`wb-${wIndex}`}
                                        className={`resource-item ${isActive ? 'active' : ''}`}
                                        onClick={(e) => handleDocumentClick(e, doc, false)}
                                    >
                                        <BookMarked size={16} strokeWidth={2.5} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-muted-fg)', flexShrink: 0 }} />
                                        <div className="resource-info">
                                            <span className="resource-name">{cleanName}</span>
                                        </div>
                                    </li>
                                );
                            })}

                        {/* ── Mocktest documents (collapsible) ── */}
                        {(() => {
                            const filteredMocktests = Array.isArray(selection.mocktests)
                                ? sortDocsByReading(selection.mocktests).filter(doc => !doc.name.toLowerCase().includes('answer'))
                                : [];
                            if (filteredMocktests.length === 0) return null;
                            
                            return (
                                <>
                                    <li
                                        className="resource-item"
                                        onClick={() => toggleMocktestCollapse(selection.name)}
                                    >
                                        <ClipboardList size={16} strokeWidth={2.5} style={{ color: 'var(--color-muted-fg)', flexShrink: 0 }} />
                                        <div className="resource-info">
                                            <span className="resource-name">Đề thi Mocktest</span>
                                            <span className="resource-type">PDF</span>
                                        </div>
                                        <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                            {isMocktestExpanded
                                                ? <ChevronDown size={12} strokeWidth={2.5} style={{ color: 'var(--color-ink-muted-48)' }} />
                                                : <ChevronRight size={12} strokeWidth={2.5} style={{ color: 'var(--color-ink-muted-48)' }} />
                                            }
                                        </span>
                                    </li>
                                    {isMocktestExpanded && filteredMocktests.map((doc, mIndex) => {
                                        const isActive = activeTab === 'mocktest' && activeMocktest?.driveFileId === doc.driveFileId;
                                        const cleanName = cleanDocName(doc.name, true);
                                        return (
                                            <li
                                                key={`mt-${mIndex}`}
                                                className={`resource-item ${isActive ? 'active' : ''}`}
                                                onClick={(e) => handleDocumentClick(e, doc, true)}
                                                style={{ paddingLeft: '2rem' }}
                                            >
                                                <FileText size={14} strokeWidth={2.5} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-muted-fg)', flexShrink: 0 }} />
                                                <div className="resource-info">
                                                    <span className="resource-name">{cleanName}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </>
                            );
                        })()}

                        {/* ── Video Lessons ── */}
                        {lessons.map((lesson, lIndex) => {
                            if (!lesson) return null;
                            const lessonKey = getLessonKey(lesson);
                            const isCompleted = lessonKey ? progressData[lessonKey]?.completed : false;
                            const isLessonActive = activeLesson?.id === lesson.id;
                            const durationSeconds = (lessonKey && progressData[lessonKey]?.duration) || lesson.duration;
                            const durationText = durationSeconds
                                ? (durationSeconds >= 3600
                                    ? `${Math.floor(durationSeconds / 3600)}g ${Math.ceil((durationSeconds % 3600) / 60)}p`
                                    : `${Math.ceil(durationSeconds / 60)} phút`)
                                : `${getFakeDurationInMinutes(lesson.id)} phút`;

                            return (
                                <li
                                    key={lesson.id || lIndex}
                                    ref={(el) => { lessonRefs.current.set(lesson.id, el); }}
                                    tabIndex={0}
                                    onClick={() => handleLessonClick(lesson)}
                                    onFocus={() => setFocusedLessonId(lesson.id)}
                                    className={`${isLessonActive ? 'active' : ''} ${focusedLessonId === lesson.id && !isLessonActive ? 'focused' : ''}`}
                                >
                                    <div
                                        className={`lesson-checkbox ${isCompleted ? 'completed' : ''}`}
                                        onClick={(e) => toggleLessonCompletion(e, lesson)}
                                        title="Đánh dấu hoàn thành"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {isCompleted
                                            ? <CheckCircle2 size={14} strokeWidth={2.5} style={{ color: 'white' }} />
                                            : (isLessonActive
                                                ? <Play size={10} strokeWidth={2.5} fill="currentColor" style={{ color: 'var(--color-accent)' }} />
                                                : <Circle size={14} strokeWidth={1.5} style={{ color: 'var(--color-hairline)' }} />
                                            )
                                        }
                                    </div>
                                    <div className="lesson-info">
                                        <span>{lIndex + 1}. {cleanLessonTitle(lesson.title)}</span>
                                        <div className="lesson-meta">
                                            <Play size={10} strokeWidth={2.5} style={{ color: 'var(--color-ink-muted-48)' }} />
                                            <span>{durationText}</span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            );
        });
    };

    const courseTitle = course?.name || "Google Drive Course";

    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════
    return (
        <div className={`course-player-body ${isMobileSidebarOpen ? 'mobile-sidebar-active' : ''} ${isSidebarOpen ? 'sidebar-desktop-open' : 'sidebar-desktop-closed'}`}>
            {isMobileSidebarOpen && (
                <div className="sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            {/* ─── HEADER ─── */}
            <header className="course-header">
                <div className="header-left">
                    <button
                        onClick={onNavigateHome}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '6px',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background-color 150ms ease',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 102, 204, 0.08)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        aria-label="Quay lại trang chủ"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <span className="course-title-header">{courseTitle}</span>
                    {activeLesson && (
                        <>
                            <span style={{ color: 'var(--color-hairline)', flexShrink: 0 }}>·</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted-48)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                {activeLesson.title}
                            </span>
                        </>
                    )}
                </div>
                <div className="header-right">
                    <Button
                        variant={isPinned ? 'primary' : 'pearl'}
                        onClick={handleTogglePin}
                        title={isPinned ? "Hủy ghim" : "Ghim làm mặc định"}
                        style={{ height: '32px', fontSize: '13px' }}
                        icon={Pin}
                    >
                        {isPinned ? 'Đã ghim' : 'Ghim'}
                    </Button>
                    {onSyncDriveCourse && (
                        <Button
                            variant="pearl"
                            onClick={onSyncDriveCourse}
                            title="Đồng bộ từ Google Drive"
                            style={{ height: '32px', fontSize: '13px' }}
                            icon={RefreshCw}
                        >
                            Đồng bộ
                        </Button>
                    )}
                    <Button
                        variant="pearl"
                        className="mobile-sidebar-toggle"
                        onClick={toggleSidebar}
                        style={{ height: '32px', fontSize: '13px' }}
                        icon={Menu}
                    >
                        Bài học
                    </Button>
                </div>
            </header>

            {/* ─── MAIN WRAPPER ─── */}
            <div className="course-player-wrapper" ref={playerWrapperRef}>

                {/* ─── MAIN CONTENT AREA ─── */}
                <main className="video-player-section">

                    {/* ── VIDEO PLAYER (shown when video tab active) ── */}
                    <div className={`video-wrapper ${activeTab === 'video' ? 'video-expanded' : 'video-hidden'}`}>
                        <div className="video-player">
                            {iframeSrc ? (
                                <iframe
                                    src={iframeSrc}
                                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#0F0F1A' }}
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                    title={activeLesson?.title || 'Video Player'}
                                />
                            ) : (
                                <div className="instructor-banner">
                                    <div className="instructor-content">
                                        <img src="https://i.imgur.com/vDeC4QL.png" alt="Instructor" className="instructor-portrait" />
                                        <div className="instructor-details">
                                            <h2>Peter</h2>
                                            <p>Investment banking experience</p>
                                            <div className="instructor-course-tag">
                                                <CheckCircle2 size={14} strokeWidth={2.5} />
                                                <span>Alternative Investments</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── TABS — Pill style with Lucide icons ── */}
                    <div className="course-info-tabs">
                        <ul>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('video'); }}
                                   className={`tab-video ${activeTab === 'video' ? 'active' : ''}`}>
                                    <Play size={14} strokeWidth={2.5} />
                                    Video bài giảng
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('workbook'); }}
                                   className={`tab-workbook ${activeTab === 'workbook' ? 'active' : ''}`}>
                                    <BookOpen size={14} strokeWidth={2.5} />
                                    Workbook
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleTabClick('mocktest'); }}
                                   className={`tab-mocktest ${activeTab === 'mocktest' ? 'active' : ''}`}>
                                    <ClipboardList size={14} strokeWidth={2.5} />
                                    Mocktest
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* ─── TAB CONTENT ─── */}
                    <div className="content-wrapper scrollbar-hide">

                        {/* ── VIDEO TAB ── */}
                        {activeTab === 'video' && activeLesson && (
                            <div className="tab-content">
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    padding: '16px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-hairline)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                }}>
                                    <h1 style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontWeight: 800,
                                        fontSize: '1.25rem',
                                        color: 'var(--color-ink)',
                                        margin: 0,
                                        lineHeight: 1.3,
                                    }}>
                                        {activeLesson.title}
                                    </h1>
                                    
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        flexWrap: 'wrap',
                                        borderTop: '1px solid var(--color-canvas-parchment)',
                                        paddingTop: '16px',
                                    }}>
                                        <Button
                                            variant={progressData[getLessonKey(activeLesson) || '']?.completed ? 'pearl' : 'secondary'}
                                            onClick={(e) => toggleLessonCompletion(e, activeLesson)}
                                            style={{
                                                fontSize: '14px',
                                                height: '36px',
                                                borderRadius: 'var(--radius-sm)',
                                            }}
                                            icon={progressData[getLessonKey(activeLesson) || '']?.completed ? CheckCircle2 : Circle}
                                        >
                                            {progressData[getLessonKey(activeLesson) || '']?.completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                                        </Button>
                                        
                                        {findNextLesson() && (
                                            <Button
                                                variant="primary"
                                                onClick={() => { const next = findNextLesson(); if (next) handleLessonClick(next); }}
                                                style={{
                                                    fontSize: '14px',
                                                    height: '36px',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}
                                                icon={ArrowRight}
                                                iconPosition="right"
                                            >
                                                Bài tiếp theo
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── WORKBOOK TAB — full height PDF ── */}
                        {activeTab === 'workbook' && (
                            <div className="tab-content tab-content-pdf">
                                {currentSection?.workbooks && currentSection.workbooks.filter(doc => !doc.name.toLowerCase().includes('answer')).length > 1 && (
                                    <div className="pdf-tab-selector">
                                        {sortDocsByReading(currentSection.workbooks)
                                            .filter(doc => !doc.name.toLowerCase().includes('answer'))
                                            .map((wb) => (
                                                <button
                                                    key={wb.driveFileId}
                                                    className={`pdf-tab-btn ${activeWorkbook?.driveFileId === wb.driveFileId ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setActiveWorkbook(wb);
                                                        setShowWorkbookAnswer(false);
                                                    }}
                                                >
                                                    <BookMarked size={12} strokeWidth={2.5} />
                                                    {getShortDocName(wb.name)}
                                                </button>
                                            ))}
                                    </div>
                                )}
                                {activeWorkbook && (
                                    <div className="pdf-active-title-bar">
                                        <span className="pdf-active-title-icon">
                                            <BookMarked size={14} strokeWidth={2.5} />
                                        </span>
                                        <span className="pdf-active-title-text" title={activeWorkbook.name}>
                                            {activeWorkbook.name.replace(/\.[^/.]+$/, '').replace(/^[^-]+-\s*/, '')}
                                            {showWorkbookAnswer && ' (Đáp án)'}
                                        </span>
                                        {matchingWorkbookAnswer && (
                                             <Button
                                                 variant={showWorkbookAnswer ? 'primary' : 'pearl'}
                                                 onClick={() => setShowWorkbookAnswer(prev => !prev)}
                                                 style={{ marginLeft: 'auto', height: '28px', fontSize: '12px', padding: '0 12px' }}
                                                 icon={showWorkbookAnswer ? FileText : Eye}
                                             >
                                                 {showWorkbookAnswer ? 'Xem đề bài' : 'Xem đáp án'}
                                             </Button>
                                         )}
                                    </div>
                                )}
                                <div className="pdf-viewer-wrapper">
                                    {isWorkbookLoading ? (
                                        <div className="pdf-loading-spinner">
                                            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                            <span>Đang tải tài liệu...</span>
                                        </div>
                                    ) : workbookData ? (
                                        workbookData.type === 'pdf' ? (
                                            <PdfJsViewer pdfBuffer={workbookData.rawData as ArrayBuffer} title={activeWorkbook?.name || 'Workbook'} />
                                        ) : (
                                            <div className="html-document-viewer scrollbar-hide">
                                                {workbookData.type === 'html' ? (
                                                    <div dangerouslySetInnerHTML={{ __html: workbookData.rawData as string }} />
                                                ) : (
                                                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
                                                        {workbookData.rawData as string}
                                                    </pre>
                                                )}
                                            </div>
                                        )
                                    ) : activeWorkbook ? (
                                        <iframe
                                            className="pdf-iframe"
                                            src={`https://drive.google.com/file/d/${showWorkbookAnswer && matchingWorkbookAnswer ? matchingWorkbookAnswer.driveFileId : activeWorkbook.driveFileId}/preview`}
                                            title={activeWorkbook.name}
                                        />
                                    ) : (
                                        <div className="pdf-empty">
                                            <IconBadge icon={BookOpen} size={24} variant="outline" color="neutral" />
                                            <p className="pdf-empty-text">Không tìm thấy Workbook cho phần này.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── MOCKTEST TAB — full height PDF ── */}
                        {activeTab === 'mocktest' && (
                            <div className="tab-content tab-content-pdf">
                                {currentSection?.mocktests && currentSection.mocktests.filter(doc => !doc.name.toLowerCase().includes('answer')).length > 1 && (
                                    <div className="pdf-tab-selector">
                                        {sortDocsByReading(currentSection.mocktests)
                                            .filter(doc => !doc.name.toLowerCase().includes('answer'))
                                            .map((mDoc) => (
                                                <button
                                                    key={mDoc.driveFileId}
                                                    className={`pdf-tab-btn ${activeMocktest?.driveFileId === mDoc.driveFileId ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setActiveMocktest(mDoc);
                                                        setShowMocktestAnswer(false);
                                                    }}
                                                >
                                                    <ClipboardList size={12} strokeWidth={2.5} />
                                                    {getShortDocName(mDoc.name)}
                                                </button>
                                            ))}
                                    </div>
                                )}
                                {activeMocktest && (
                                    <div className="pdf-active-title-bar">
                                        <span className="pdf-active-title-icon">
                                            <ClipboardList size={14} strokeWidth={2.5} />
                                        </span>
                                        <span className="pdf-active-title-text" title={activeMocktest.name}>
                                            {activeMocktest.name.replace(/\.[^/.]+$/, '').replace(/^[^-]+-\s*/, '')}
                                            {showMocktestAnswer && ' (Đáp án)'}
                                        </span>
                                        {matchingMocktestAnswer && (
                                             <Button
                                                 variant={showMocktestAnswer ? 'primary' : 'pearl'}
                                                 onClick={() => setShowMocktestAnswer(prev => !prev)}
                                                 style={{ marginLeft: 'auto', height: '28px', fontSize: '12px', padding: '0 12px' }}
                                                 icon={showMocktestAnswer ? FileText : Eye}
                                             >
                                                 {showMocktestAnswer ? 'Xem đề bài' : 'Xem đáp án'}
                                             </Button>
                                         )}
                                    </div>
                                )}
                                <div className="pdf-viewer-wrapper">
                                    {isMocktestLoading ? (
                                        <div className="pdf-loading-spinner">
                                            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                            <span>Đang tải đề thi...</span>
                                        </div>
                                    ) : mocktestData ? (
                                        mocktestData.type === 'pdf' ? (
                                            <PdfJsViewer pdfBuffer={mocktestData.rawData as ArrayBuffer} title={activeMocktest?.name || 'Mocktest'} />
                                        ) : (
                                            <div className="html-document-viewer scrollbar-hide">
                                                {mocktestData.type === 'html' ? (
                                                    <div dangerouslySetInnerHTML={{ __html: mocktestData.rawData as string }} />
                                                ) : (
                                                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
                                                        {mocktestData.rawData as string}
                                                    </pre>
                                                )}
                                            </div>
                                        )
                                    ) : activeMocktest ? (
                                        <iframe
                                            className="pdf-iframe"
                                            src={`https://drive.google.com/file/d/${showMocktestAnswer && matchingMocktestAnswer ? matchingMocktestAnswer.driveFileId : activeMocktest.driveFileId}/preview`}
                                            title={activeMocktest.name}
                                        />
                                    ) : (
                                        <div className="pdf-empty">
                                            <IconBadge icon={ClipboardList} size={24} variant="outline" color="warning" />
                                            <p className="pdf-empty-text">Không tìm thấy đề thi Mocktest cho phần này.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <div className="resizer" onMouseDown={handleResizeMouseDown} />

                {/* ─── SIDEBAR ─── */}
                <aside className="course-content-sidebar" style={{ width: `${sidebarWidth}px` }}>
                    <div className="sidebar-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={16} strokeWidth={2.5} style={{ color: 'var(--color-accent)' }} />
                            Nội dung khóa học
                        </h3>
                    </div>

                    {/* Progress Bar */}
                    {globalProgress.total > 0 && (
                        <div className="sidebar-progress">
                            <div className="sidebar-progress-header">
                                <span className="sidebar-progress-label">Tiến độ học tập</span>
                                <span className="sidebar-progress-count">{globalProgress.completed}/{globalProgress.total} bài · {globalProgress.pct}%</span>
                            </div>
                            <div className="sidebar-progress-bar-track">
                                <div className="sidebar-progress-bar-fill" style={{ width: `${globalProgress.pct}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="curriculum scrollbar-hide">
                        {renderCurriculumSidebar()}
                    </div>
                </aside>
            </div>



            {dictionaryPosition && (
                <DictionaryPopover
                    ref={dictionaryRef}
                    data={dictionaryData}
                    vietnameseTranslation={vietnameseTranslation}
                    isLoading={isDictionaryLoading}
                    position={dictionaryPosition}
                    word={selectedWord}
                    onClose={() => {
                        setDictionaryPosition(null);
                        setSelectedWord('');
                    }}
                />
            )}
        </div>
    );
};

interface PdfJsViewerProps {
    pdfBuffer: ArrayBuffer;
    title: string;
}

const PdfJsViewer: React.FC<PdfJsViewerProps> = ({ pdfBuffer, title }) => {
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.2);
    const [isRendering, setIsRendering] = useState<boolean>(false);
    const [isLibLoaded, setIsLibLoaded] = useState<boolean>(false);
    const [isTranslationMode, setIsTranslationMode] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamically load PDF.js script from CDN
    useEffect(() => {
        if ((window as any).pdfjsLib) {
            setIsLibLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            setIsLibLoaded(true);
        };
        document.body.appendChild(script);
    }, []);

    // Load PDF Document when lib is loaded or pdfBuffer changes
    useEffect(() => {
        if (!isLibLoaded || !pdfBuffer) return;

        let active = true;
        const loadPdf = async () => {
            try {
                const bufferCopy = pdfBuffer.slice(0);
                const loadingTask = (window as any).pdfjsLib.getDocument({ data: bufferCopy });
                const pdf = await loadingTask.promise;
                if (active) {
                    setPdfDoc(pdf);
                    setNumPages(pdf.numPages);
                    setPageNumber(1);
                }
            } catch (err) {
                console.error("PDF.js loading error:", err);
            }
        };

        loadPdf();
        return () => {
            active = false;
        };
    }, [isLibLoaded, pdfBuffer]);

    // Render Page when pdfDoc, pageNumber, or scale changes
    useEffect(() => {
        if (!pdfDoc) return;

        let active = true;
        const renderPage = async () => {
            if (isRendering) return;
            setIsRendering(true);

            try {
                const page = await pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas || !active) return;
                const context = canvas.getContext('2d');
                if (!context) return;

                // Adjust for High-DPI / Retina screens to make rendering ultra-crisp!
                // Enforce a minimum DPR of 2.0 to make sure the text and details are rendered at double resolution for absolute crispness!
                const dpr = Math.max(window.devicePixelRatio || 1, 2);
                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;

                // Reset transforms and apply DPR scale
                context.setTransform(dpr, 0, 0, dpr, 0, 0);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };
                
                await page.render(renderContext).promise;

                // Render text layer (perfectly aligned with canvas style dimensions)
                const textLayerDiv = textLayerRef.current;
                if (textLayerDiv && active) {
                    textLayerDiv.innerHTML = '';
                    textLayerDiv.style.height = `${viewport.height}px`;
                    textLayerDiv.style.width = `${viewport.width}px`;

                    const textContent = await page.getTextContent();
                    await (window as any).pdfjsLib.renderTextLayer({
                        textContent: textContent,
                        container: textLayerDiv,
                        viewport: viewport,
                        textDivs: []
                    }).promise;
                }
            } catch (err) {
                console.error("PDF.js rendering error:", err);
            } finally {
                setIsRendering(false);
            }
        };

        renderPage();
        return () => {
            active = false;
        };
    }, [pdfDoc, pageNumber, scale]);

    if (!isLibLoaded || !pdfDoc) {
        return (
            <div className="pdf-loading-spinner" style={{ height: '100%', fontFamily: 'var(--font-body)', gap: '12px' }}>
                <div style={{
                    border: '3px solid var(--color-canvas-parchment)',
                    borderTop: '3px solid var(--color-primary)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '14px', color: 'var(--color-ink-muted-80)' }}>Đang khởi tạo trình xem PDF...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--color-canvas-parchment)' }}>
            {/* Apple-style Pearl Button Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '8px 16px',
                background: 'var(--color-canvas)',
                borderBottom: '1px solid var(--color-hairline)',
                flexShrink: 0,
                fontFamily: 'var(--font-body)',
            }}>
                <Button
                    variant="pearl"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    style={{ height: '28px', fontSize: '12px', padding: '0 10px' }}
                >
                    Trang trước
                </Button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink-muted-80)' }}>
                    Trang {pageNumber} / {numPages}
                </span>
                <Button
                    variant="pearl"
                    disabled={pageNumber >= numPages}
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    style={{ height: '28px', fontSize: '12px', padding: '0 10px' }}
                >
                    Trang sau
                </Button>

                <div style={{ borderLeft: '1px solid var(--color-hairline)', height: '16px', margin: '0 4px' }} />

                <Button variant="pearl" style={{ height: '28px', fontSize: '12px', padding: '0 10px' }} onClick={() => setScale(s => Math.max(0.8, s - 0.1))}>-</Button>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink-muted-80)', minWidth: '44px', textAlign: 'center' }}>
                    {Math.round(scale * 100)}%
                </span>
                <Button variant="pearl" style={{ height: '28px', fontSize: '12px', padding: '0 10px' }} onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>+</Button>

                <div style={{ borderLeft: '1px solid var(--color-hairline)', height: '16px', margin: '0 4px' }} />

                <Button
                    variant={isTranslationMode ? 'primary' : 'pearl'}
                    onClick={() => setIsTranslationMode(prev => !prev)}
                    style={{ height: '28px', fontSize: '12px', padding: '0 10px' }}
                    icon={Languages}
                >
                    {isTranslationMode ? 'Bản gốc' : 'Chế độ dịch'}
                </Button>
            </div>

            {/* Canvas Viewer Container */}
            <div 
                ref={containerRef}
                className={isTranslationMode ? "translation-mode-active" : ""}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                }}
            >
                <div style={{ position: 'relative', background: 'white', boxShadow: 'var(--shadow-product)', borderRadius: '6px' }}>
                    <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '6px' }} />
                    <div 
                        ref={textLayerRef} 
                        className="textLayer"
                    />
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
