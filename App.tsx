import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MobileHeader from './components/MobileHeader';
import LearningSection from './components/LearningSection';
import CoursePlayer from './components/CoursePlayer';
import Button from './components/Button';
import type { Course, Lesson, CourseDocument, Selection } from './types';
import { sortSelectionsLessons } from './components/courseUtils';

// Extend window interface to support Google APIs
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'player'>('home');
  const [course, setCourse] = useState<Course | null>(null);
  const [startingLessonId, setStartingLessonId] = useState<string | null>(null);

  // Google API Settings
  const googleConfig = useMemo(() => ({
    clientId: localStorage.getItem('gdrive_client_id') || ((import.meta as any).env.VITE_GOOGLE_CLIENT_ID || ''),
    apiKey: localStorage.getItem('gdrive_api_key') || ((import.meta as any).env.VITE_GOOGLE_API_KEY || '')
  }), []);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(() => localStorage.getItem('google_access_token'));

  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCourseName, setImportCourseName] = useState('');
  const [selectedVideoFolder, setSelectedVideoFolder] = useState<{ id: string; name: string } | null>(null);
  const [selectedWorkbookFolder, setSelectedWorkbookFolder] = useState<{ id: string; name: string } | null>(null);
  const [selectedMocktestFolder, setSelectedMocktestFolder] = useState<{ id: string; name: string } | null>(null);

  // Effect to load GAPI client library on mount
  useEffect(() => {
    const initGapi = () => {
      if (window.gapi) {
        window.gapi.load('client', () => {
          // GAPI client initialized
        });
      }
    };
    if (window.gapi) {
      initGapi();
    } else {
      const interval = setInterval(() => {
        if (window.gapi) {
          initGapi();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Auto-load default (pinned) course or last active course on mount
  useEffect(() => {
    const defaultCourseName = localStorage.getItem('gdrive_default_course_name');
    const courseNameToLoad = defaultCourseName || localStorage.getItem('last_active_course_name');
    
    if (courseNameToLoad) {
      const cachedCourse = localStorage.getItem(`gdrive_course_${courseNameToLoad}`);
      if (cachedCourse) {
        try {
          const parsed = JSON.parse(cachedCourse);
          if (parsed && typeof parsed === 'object' && parsed.name && Array.isArray(parsed.selections)) {
            parsed.selections = sortSelectionsLessons(parsed.selections);
            setCourse(parsed);
            // Don't auto-navigate to player — let user land on homepage (watch history tab)
            
            // Find the last watched lesson in this course
            let progress: Record<string, any> = {};
            try {
              const storedProgress = localStorage.getItem('videoProgress');
              progress = storedProgress ? JSON.parse(storedProgress) : {};
            } catch (err) {
              console.error("Error parsing videoProgress", err);
            }
            
            let latestLessonId: string | null = null;
            let maxTime = 0;
            for (const key in progress) {
              const record = progress[key];
              if (record && record.courseTitle === parsed.name && record.lastWatched > maxTime) {
                maxTime = record.lastWatched;
                latestLessonId = record.lessonId;
              }
            }
            if (latestLessonId) {
              setStartingLessonId(latestLessonId);
            }
          } else {
            console.warn("Invalid cached course structure ignored:", parsed);
            localStorage.removeItem(`gdrive_course_${courseNameToLoad}`);
          }
        } catch (e) {
          console.error("Error auto-loading course cache", e);
        }
      }
    }
  }, []);

  const handleNavigateHome = () => {
    setCourse(null);
    setView('home');
    setStartingLessonId(null);
  };

  // Google OAuth2 Token Request
  const authenticateGoogleDrive = (callback: (token: string) => void) => {
    if (!googleConfig.clientId || !googleConfig.apiKey) {
      alert('Vui lòng thiết lập Client ID và API Key trong tệp .env.local để kết nối Google Drive.');
      return;
    }

    if (typeof window.google === 'undefined' || !window.google.accounts) {
      alert('Đang tải thư viện xác thực của Google, vui lòng thử lại sau vài giây.');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: googleConfig.clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response: any) => {
        if (response.error) {
          console.error(response);
          alert('Lỗi xác thực Google: ' + response.error_description);
          return;
        }
        const token = response.access_token;
        setGoogleToken(token);
        localStorage.setItem('google_access_token', token);
        localStorage.setItem('google_token_expiry', (Date.now() + response.expires_in * 1000).toString());
        callback(token);
      }
    });

    client.requestAccessToken();
  };

  // Google Picker Folder Selector (maps to type)
  const openGooglePicker = (token: string, type: 'video' | 'workbook' | 'mocktest') => {
    if (typeof window.gapi === 'undefined') {
      alert('Đang khởi tạo thư viện kết nối Google APIs, vui lòng thử lại sau giây lát.');
      return;
    }

    window.gapi.load('picker', () => {
      if (typeof window.google === 'undefined' || typeof window.google.picker === 'undefined') {
        alert('Không thể khởi tạo dịch vụ Google Picker. Vui lòng kiểm tra lại cấu hình API Key trong tệp .env.local hoặc liên kết mạng.');
        return;
      }

      const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
        .setMimeTypes('application/vnd.google-apps.folder')
        .setSelectFolderEnabled(true);

      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(token)
        .setDeveloperKey(googleConfig.apiKey)
        .setOrigin(window.location.origin)
        .setCallback((data: any) => {
          if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
            const doc = data[window.google.picker.Response.DOCUMENTS][0];
            const folderId = doc[window.google.picker.Document.ID];
            const folderName = doc[window.google.picker.Document.NAME];
            
            if (type === 'video') {
              setSelectedVideoFolder({ id: folderId, name: folderName });
              setImportCourseName(prev => prev.trim() ? prev : folderName);
            } else if (type === 'workbook') {
              setSelectedWorkbookFolder({ id: folderId, name: folderName });
            } else if (type === 'mocktest') {
              setSelectedMocktestFolder({ id: folderId, name: folderName });
            }
          }
        })
        .build();

      picker.setVisible(true);
    });
  };

  const handlePickFolder = (type: 'video' | 'workbook' | 'mocktest') => {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_token_expiry');
    const isExpired = expiry ? Date.now() > parseInt(expiry) : true;

    if (token && !isExpired) {
      openGooglePicker(token, type);
    } else {
      authenticateGoogleDrive((freshToken) => {
        openGooglePicker(freshToken, type);
      });
    }
  };

  // Helper to match files by subject keywords
  const getSubjectKey = (name: string): string => {
    const upper = name.toUpperCase().replace(/_/g, ' ');
    
    // Check standalone abbreviations first (highest priority) to avoid matching substrings like "ci" in "efficiency"
    if (/\bQUANT\b/i.test(upper)) return 'QUANT';
    if (/\bECON\b/i.test(upper)) return 'ECON';
    if (/\b(FSA|FAS|FRA)\b/i.test(upper)) return 'FSA';
    if (/\bCI\b/i.test(upper)) return 'CI';
    if (/\b(EI|EQUITY)\b/i.test(upper)) return 'EQUITY';
    if (/\bFI\b/i.test(upper)) return 'FI';
    if (/\b(DER|DERIV|DERIVATIVES)\b/i.test(upper)) return 'DER';
    if (/\b(AI|ALTS)\b/i.test(upper)) return 'AI';
    if (/\bPM\b/i.test(upper)) return 'PM';
    if (/\bETHICS?\b/i.test(upper)) return 'ETHICS';

    // Fallback to substring / word checks if abbreviations are not present
    if (upper.includes('QUANTITATIVE')) return 'QUANT';
    if (upper.includes('ECONOMICS')) return 'ECON';
    if (upper.includes('FINANCIAL STATEMENT') || upper.includes('REPORTING')) return 'FSA';
    if (upper.includes('CORPORATE')) return 'CI';
    if (upper.includes('FIXED INCOME')) return 'FI';
    if (upper.includes('ALTERNATIVE')) return 'AI';
    if (upper.includes('PORTFOLIO')) return 'PM';
    
    return '';
  };

  // Helper to extract volumes or indexes from folder/file name (e.g. V1 -> 1, Phần 4 -> 4, 1. Quant -> 1)
  const extractNumber = (name: string): number | null => {
    const vMatch = name.match(/V(\d+)/i);
    if (vMatch) return parseInt(vMatch[1], 10);
    const phanMatch = name.match(/Phần\s*(\d+)/i);
    if (phanMatch) return parseInt(phanMatch[1], 10);
    const numMatch = name.match(/^(\d+)/);
    if (numMatch) return parseInt(numMatch[1], 10);
    const parenMatch = name.match(/\((\d+)\)/);
    if (parenMatch) return parseInt(parenMatch[1], 10);
    return null;
  };

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

  // Recursive fetcher for Google Drive folder structure (handles nested selections & matches workbook/mocktest)
  const fetchDriveFolderContents = async (
    videoFolderId: string, 
    token: string, 
    workbookFolderId?: string,
    mocktestFolderId?: string,
    customCourseName?: string
  ): Promise<Course> => {
    
    // 1. Fetch metadata to get the course name
    let courseName = customCourseName || '';
    if (!courseName) {
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${videoFolderId}?fields=name`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (metaRes.ok) {
        const folderMeta = await metaRes.json();
        courseName = folderMeta.name || 'Google Drive Course';
      } else {
        courseName = 'Google Drive Course';
      }
    }

    const selectionsMap = new Map<string, Map<string, Partial<Lesson>>>();

    // Recursive function to scan video folders
    const scanFolder = async (currentFolderId: string, folderName: string) => {
      const listUrl = `https://www.googleapis.com/drive/v3/files?q='${currentFolderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,videoMediaMetadata,thumbnailLink)&pageSize=1000`;
      const res = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const listData = await res.json();
      const items = listData.files || [];

      const subfolders = items.filter((item: any) => item.mimeType === 'application/vnd.google-apps.folder');
      const files = items.filter((item: any) => item.mimeType !== 'application/vnd.google-apps.folder');

      if (files.length > 0) {
        const processFilesList = (filesList: any[], sectionName: string) => {
          if (!selectionsMap.has(sectionName)) {
            selectionsMap.set(sectionName, new Map<string, Partial<Lesson>>());
          }
          const lessonsMap = selectionsMap.get(sectionName)!;

          for (const file of filesList) {
            const fileName = file.name;
            if (!fileName.includes('.')) continue;

            const nameParts = fileName.split('.');
            const extension = nameParts.pop()?.toLowerCase();
            let baseName = nameParts.join('.');

            // Skip SRT/subtitle files completely
            if (extension === 'srt') continue;

            if (!lessonsMap.has(baseName)) {
              let title = baseName.replace(/^\d+\s*[-._]?\s*/, '');
              if (title.trim() === '') {
                title = baseName;
              }
              lessonsMap.set(baseName, { id: baseName, title, documents: [] });
            }
            const lesson = lessonsMap.get(baseName)!;

            switch (extension) {
              case 'mp4':
                lesson.videoDriveId = file.id;
                lesson.thumbnailLink = file.thumbnailLink;
                if (file.videoMediaMetadata && file.videoMediaMetadata.durationMillis) {
                  lesson.duration = Math.round(Number(file.videoMediaMetadata.durationMillis) / 1000);
                }
                break;
              case 'pdf':
                lesson.documents.push({ name: fileName, type: 'pdf' as any, driveFileId: file.id });
                break;
              case 'txt':
                lesson.documents.push({ name: fileName, type: 'txt' as any, driveFileId: file.id });
                break;
              case 'html':
                lesson.documents.push({ name: fileName, type: 'html' as any, driveFileId: file.id });
                break;
            }
          }
        };

        processFilesList(files, folderName);
      }

      await Promise.all(subfolders.map(sub => scanFolder(sub.id, sub.name)));
    };

    // Helper to fetch files from a flat or nested folder (up to 1 level of subfolders)
    const fetchFolderFiles = async (fId: string): Promise<CourseDocument[]> => {
      const listUrl = `https://www.googleapis.com/drive/v3/files?q='${fId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&pageSize=1000`;
      const res = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const listData = await res.json();
      const items = listData.files || [];

      const files: any[] = [];
      const subfolders: any[] = [];

      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          subfolders.push(item);
        } else {
          files.push(item);
        }
      }

      // Fetch files from subfolders in parallel
      const subfolderFilesPromises = subfolders.map(async (folder) => {
        const subListUrl = `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&pageSize=1000`;
        const subRes = await fetch(subListUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!subRes.ok) return [];
        const subListData = await subRes.json();
        const subFiles = subListData.files || [];
        // Prefix file names with parent folder name for smart mapping
        return subFiles
          .filter((file: any) => file.mimeType !== 'application/vnd.google-apps.folder')
          .map((file: any) => ({
            ...file,
            name: `${folder.name} - ${file.name}`
          }));
      });

      const subfoldersFilesArrays = await Promise.all(subfolderFilesPromises);
      const allFiles = [...files, ...subfoldersFilesArrays.flat()];

      return allFiles
        .map((file: any) => {
          const nameParts = file.name.split('.');
          const extension = nameParts.pop()?.toLowerCase();
          return {
            name: file.name,
            type: extension as any,
            driveFileId: file.id
          };
        })
        .filter((doc: any) => doc.type === 'pdf' || doc.type === 'txt' || doc.type === 'html');
    };

    // Run fetches in parallel
    const [_, workbookFiles, mocktestFiles] = await Promise.all([
      scanFolder(videoFolderId, courseName),
      workbookFolderId ? fetchFolderFiles(workbookFolderId) : Promise.resolve([]),
      mocktestFolderId ? fetchFolderFiles(mocktestFolderId) : Promise.resolve([])
    ]);

    // Convert selections map to sorted selections array
    const selections: Selection[] = Array.from(selectionsMap.entries()).map(([name, lessonsMap], sIndex) => {
      // Helper to extract a Date from a lesson title for chronological sorting
      const extractDateFromTitle = (title: string): Date | null => {
        // Format 1: dd.MM.yyyy (e.g. "Buổi 1 - 05.01.2025")
        const dotDate = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (dotDate) {
          return new Date(parseInt(dotDate[3]), parseInt(dotDate[2]) - 1, parseInt(dotDate[1]));
        }
        // Format 2: _YYYY_MMDD or _YYYY_DDMM (e.g. "CFA_ETHICS_2025_0115" or "CFA1_ETHICS_2024_0812")
        const underscoreDate = title.match(/(?:^|_)(\d{4})_(\d{2})(\d{2})(?:\D|$)/);
        if (underscoreDate) {
          const y = parseInt(underscoreDate[1], 10);
          const n1 = parseInt(underscoreDate[2], 10);
          const n2 = parseInt(underscoreDate[3], 10);
          let d = n1;
          let m = n2;
          // If second part is not a valid month (> 12), it must be the day, so first part is month
          if (n2 > 12 && n1 <= 12) {
            d = n2;
            m = n1;
          } else if (n2 <= 12 && n1 <= 31) {
            // Otherwise, default to DD/MM as requested by the user
            d = n1;
            m = n2;
          }
          return new Date(y, m - 1, d);
        }
        // Format 3: YYYY-MM-DD
        const isoDate = title.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoDate) {
          return new Date(parseInt(isoDate[1]), parseInt(isoDate[2]) - 1, parseInt(isoDate[3]));
        }
        return null;
      };

      const sortedLessons = Array.from(lessonsMap.values())
        .filter(l => l.videoDriveId || (l.documents && l.documents.length > 0))
        .sort((a, b) => {
          const titleA = a.title || a.id || '';
          const titleB = b.title || b.id || '';

          // Primary sort: by date extracted from title (chronological)
          const dateA = extractDateFromTitle(titleA);
          const dateB = extractDateFromTitle(titleB);
          if (dateA && dateB) {
            const diff = dateA.getTime() - dateB.getTime();
            if (diff !== 0) return diff;
          }
          // If only one has a date, put it first
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;

          // Secondary sort: by session number (Buổi X)
          const sessionRegex = /bu[ốo]i\s*(\d+)/i;
          const matchA = titleA.match(sessionRegex);
          const matchB = titleB.match(sessionRegex);
          
          if (matchA && matchB) {
            const numA = parseInt(matchA[1], 10);
            const numB = parseInt(matchB[1], 10);
            if (numA !== numB) {
              return numA - numB;
            }
          }
          
          // Fallback: lexicographic
          return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
        }) as Lesson[];

      // Smart match workbooks and mocktests
      const selectionSubject = getSubjectKey(name);
      const selectionNum = extractNumber(name) || (sIndex + 1);

      const matchingWorkbooks = workbookFiles.filter(file => {
        const fileNum = extractNumber(file.name);
        const fileSubject = getSubjectKey(file.name);

        // If both have starting numbers, they MUST match to avoid mixups (e.g. section 4 vs section 6)
        if (fileNum !== null && selectionNum !== null) {
          if (fileNum !== selectionNum) return false;
        }
        // Fallback to comparing subject keywords
        if (fileSubject && selectionSubject) {
          return fileSubject === selectionSubject;
        }
        // Last fallback: match on number if subject is undetermined
        return fileNum !== null && fileNum === selectionNum;
      });

      const matchingMocktests = mocktestFiles.filter(file => {
        const fileNum = extractNumber(file.name);
        const fileSubject = getSubjectKey(file.name);

        // If both have starting numbers, they MUST match to avoid mixups (e.g. section 4 vs section 6)
        if (fileNum !== null && selectionNum !== null) {
          if (fileNum !== selectionNum) return false;
        }
        // Fallback to comparing subject keywords
        if (fileSubject && selectionSubject) {
          return fileSubject === selectionSubject;
        }
        // Last fallback: match on number if subject is undetermined
        return fileNum !== null && fileNum === selectionNum;
      });

      return { 
        name, 
        lessons: sortedLessons,
        workbooks: sortDocsByReading(matchingWorkbooks),
        mocktests: sortDocsByReading(matchingMocktests)
      };
    }).filter(s => s.lessons.length > 0).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    if (selections.length === 0) {
      throw new Error('Không tìm thấy tệp video hoặc tài liệu hợp lệ trong thư mục này hoặc các thư mục con.');
    }

    const loadedCourse: Course = {
      name: courseName,
      selections: selections,
      isDrive: true,
      driveFolderId: videoFolderId,
      workbookFolderId: workbookFolderId,
      mocktestFolderId: mocktestFolderId
    };

    // Save to cache
    localStorage.setItem(`gdrive_course_${courseName}`, JSON.stringify(loadedCourse));

    return loadedCourse;
  };

  const handleAddDriveCourse = () => {
    setSelectedVideoFolder(null);
    setSelectedWorkbookFolder(null);
    setSelectedMocktestFolder(null);
    setImportCourseName('');
    setShowImportModal(true);
  };

  const handleStartImport = () => {
    if (!selectedVideoFolder) {
      alert('Vui lòng chọn thư mục chứa Video (Bắt buộc).');
      return;
    }

    setShowImportModal(false);
    setIsLoadingDrive(true);
    const token = localStorage.getItem('google_access_token');

    fetchDriveFolderContents(
      selectedVideoFolder.id,
      token || '',
      selectedWorkbookFolder?.id,
      selectedMocktestFolder?.id,
      importCourseName.trim()
    )
      .then((newCourse) => {
        setCourse(newCourse);
        localStorage.setItem('last_active_course_name', newCourse.name);
        setView('player');
      })
      .catch(err => {
        console.error(err);
        alert('Lỗi tải cấu trúc thư mục từ Google Drive. Vui lòng kiểm tra lại quyền truy cập hoặc cấu trúc thư mục.');
      })
      .finally(() => {
        setIsLoadingDrive(false);
      });
  };

  const handleSyncCourse = async (folderId: string, courseName: string, workbookFolderId?: string, mocktestFolderId?: string) => {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_token_expiry');
    const isExpired = expiry ? Date.now() > parseInt(expiry) : true;

    const runSync = async (authToken: string) => {
      setIsLoadingDrive(true);
      try {
        const freshCourse = await fetchDriveFolderContents(folderId, authToken, workbookFolderId, mocktestFolderId, courseName);
        setCourse(freshCourse);
        alert('Đã đồng bộ và cập nhật danh sách bài giảng mới nhất từ Google Drive!');
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Lỗi đồng bộ. Vui lòng kiểm tra lại quyền truy cập hoặc đăng nhập lại Google.');
      } finally {
        setIsLoadingDrive(false);
      }
    };

    if (token && !isExpired) {
      await runSync(token);
    } else {
      authenticateGoogleDrive(async (freshToken) => {
        await runSync(freshToken);
      });
    }
  };

  const handleNavigateToPlayer = (courseName: string, lessonId: string, isDrive?: boolean, driveFolderId?: string) => {
    setStartingLessonId(lessonId);

    const folderId = driveFolderId || localStorage.getItem('gdrive_default_folder_id');
    if (!folderId) {
      alert('Không tìm thấy Folder ID của Google Drive.');
      return;
    }

    const cachedCourse = localStorage.getItem(`gdrive_course_${courseName}`);
    if (cachedCourse) {
      try {
        const parsed = JSON.parse(cachedCourse);
        if (parsed && typeof parsed === 'object' && parsed.name && Array.isArray(parsed.selections)) {
          parsed.selections = sortSelectionsLessons(parsed.selections);
          setCourse(parsed);
          localStorage.setItem('last_active_course_name', parsed.name);
          setView('player');
          return;
        } else {
          console.warn("Invalid cached course structure on navigation:", parsed);
        }
      } catch (e) {
        console.error('Error loading cached course structure', e);
      }
    }

    // Fallback to fetch
    const workbookFolderId = localStorage.getItem('gdrive_default_workbook_folder_id') || undefined;
    const mocktestFolderId = localStorage.getItem('gdrive_default_mocktest_folder_id') || undefined;
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_token_expiry');
    const isExpired = expiry ? Date.now() > parseInt(expiry) : true;

    if (token && !isExpired) {
      setIsLoadingDrive(true);
      fetchDriveFolderContents(folderId, token, workbookFolderId, mocktestFolderId, courseName)
        .then((newCourse) => {
          setCourse(newCourse);
          localStorage.setItem('last_active_course_name', newCourse.name);
          setView('player');
        })
        .catch(() => {
          authenticateGoogleDrive((freshToken) => {
            setIsLoadingDrive(true);
            fetchDriveFolderContents(folderId, freshToken, workbookFolderId, mocktestFolderId, courseName)
              .then((c) => {
                setCourse(c);
                localStorage.setItem('last_active_course_name', c.name);
                setView('player');
              })
              .catch(() => alert('Không thể kết nối lại Google Drive.'))
              .finally(() => setIsLoadingDrive(false));
          });
        })
        .finally(() => setIsLoadingDrive(false));
    } else {
      authenticateGoogleDrive((freshToken) => {
        setIsLoadingDrive(true);
        fetchDriveFolderContents(folderId, freshToken, workbookFolderId, mocktestFolderId, courseName)
          .then((newCourse) => {
            setCourse(newCourse);
            localStorage.setItem('last_active_course_name', newCourse.name);
            setView('player');
          })
          .catch(() => alert('Lỗi đồng bộ hóa tiến độ khóa học từ Google Drive.'))
          .finally(() => setIsLoadingDrive(false));
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas-parchment)',
        fontFamily: 'var(--font-body)',
        height: view === 'player' ? '100vh' : 'auto',
        minHeight: '100vh',
        overflow: view === 'player' ? 'hidden' : 'visible',
      }}
    >
      {view === 'home' && (
        <Header onLogoClick={handleNavigateHome} onAddDriveCourse={handleAddDriveCourse} />
      )}
      
      <div style={{ height: view === 'player' ? '100%' : 'auto' }}>
        {view === 'player' ? (
          <CoursePlayer
            onNavigateHome={handleNavigateHome}
            course={course}
            startingLessonId={startingLessonId || undefined}
            onSyncDriveCourse={() => course?.driveFolderId && handleSyncCourse(course.driveFolderId, course.name, course.workbookFolderId, course.mocktestFolderId)}
          />
        ) : (
          <LearningSection 
            onNavigateToPlayer={handleNavigateToPlayer} 
            onAddDriveCourse={handleAddDriveCourse}
          />
        )}
      </div>

      {/* Import Course Modal (Video, Workbook, Mocktest) */}
      {showImportModal && (
        <div
          className="modal-overlay-blur"
          style={{
            position: 'fixed', inset: 0,
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="modal-playful"
            style={{
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-hairline)',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                backgroundColor: 'var(--color-canvas)',
                borderBottom: '1px solid var(--color-hairline)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600, fontSize: '17px', color: 'var(--color-ink)', margin: 0,
                }}
              >
                Nhập khóa học từ Drive
              </h3>
              <Button
                variant="pearl"
                onClick={() => setShowImportModal(false)}
                aria-label="Đóng cửa sổ nhập khóa học"
                title="Đóng"
                style={{
                  width: '28px',
                  height: '28px',
                  padding: '0',
                  borderRadius: '50%',
                  fontSize: '12px',
                }}
              >
                ✕
              </Button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--color-canvas)' }}>

              {/* Course name input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '12px',
                    textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-muted-48)',
                  }}
                >
                  Tên khóa học hiển thị
                </label>
                <input
                  className="search-input"
                  type="text"
                  value={importCourseName}
                  onChange={(e) => setImportCourseName(e.target.value)}
                  placeholder="Nhập tên khóa học"
                />
              </div>

              {/* Folder picking rows */}
              {[
                {
                  label: 'Thư mục Video',
                  required: true,
                  type: 'video' as const,
                  selected: selectedVideoFolder,
                  defaultText: 'Bắt buộc (chứa file MP4)',
                },
                {
                  label: 'Thư mục Workbook',
                  required: false,
                  type: 'workbook' as const,
                  selected: selectedWorkbookFolder,
                  defaultText: 'Tùy chọn (chứa PDF bài tập)',
                },
                {
                  label: 'Thư mục Mocktest',
                  required: false,
                  type: 'mocktest' as const,
                  selected: selectedMocktestFolder,
                  defaultText: 'Tùy chọn (chứa PDF đề thi)',
                },
              ].map(({ label, required, type, selected, defaultText }) => (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-hairline)'}`,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: selected ? 'rgba(0, 102, 204, 0.04)' : 'var(--color-canvas-parchment)',
                    transition: 'border-color 200ms ease, background-color 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 600, fontSize: '13px',
                        color: 'var(--color-ink)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      {label}
                      {required && (
                        <span style={{ color: '#EF4444', fontSize: '11px' }}>*</span>
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: selected ? 'var(--color-primary)' : 'var(--color-ink-muted-48)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {selected ? `✓ ${selected.name}` : defaultText}
                    </span>
                  </div>
                  <Button
                    variant="pearl"
                    onClick={() => handlePickFolder(type)}
                    style={{
                      flexShrink: 0,
                      fontSize: '12px',
                      padding: '4px 10px',
                      height: '28px',
                    }}
                  >
                    Chọn
                  </Button>
                </div>
              ))}

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-hairline)',
                  marginTop: '8px',
                }}
              >
                <Button
                  variant="pearl"
                  onClick={() => setShowImportModal(false)}
                  style={{ padding: '8px 18px', height: '36px', fontSize: '14px' }}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStartImport}
                  disabled={!selectedVideoFolder}
                  style={{
                    padding: '8px 18px',
                    fontSize: '14px',
                    height: '36px',
                  }}
                >
                  Bắt đầu tải
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Loading Overlay */}
      {isLoadingDrive && (
        <div
          className="modal-overlay-blur"
          style={{
            position: 'fixed', inset: 0,
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            className="modal-playful"
            style={{
              padding: '40px 32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
              textAlign: 'center',
              maxWidth: '360px',
              width: '90%',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-hairline)',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* CSS Spinner */}
            <div
              style={{
                width: '40px', height: '40px',
                border: '3px solid var(--color-canvas-parchment)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '17px', color: 'var(--color-ink)', margin: 0 }}>
                Kết nối Google Drive…
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted-48)', margin: 0, lineHeight: 1.4 }}>
                Đang quét và xây dựng cấu trúc khóa học từ đám mây…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
