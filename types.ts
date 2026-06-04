export interface VideoData {
  courseTitle: string;
  videoTitle: string;
  duration?: number;
  progress?: number;
}

export enum DocumentType {
    PDF = 'pdf',
    TEXT = 'txt',
    HTML = 'html',
}

export interface CourseDocument {
    name: string;
    type: DocumentType;
    driveFileId?: string;
}

export interface Lesson {
    id: string;
    title: string;
    videoDriveId?: string;
    documents: CourseDocument[];
    duration?: number;
    thumbnailLink?: string;
}

export interface Selection {
    name: string;
    lessons: Lesson[];
    workbooks?: CourseDocument[];
    mocktests?: CourseDocument[];
    documents?: CourseDocument[];
}

export interface Course {
    name: string;
    selections: Selection[];
    isDrive?: boolean;
    driveFolderId?: string;
    workbookFolderId?: string;
    mocktestFolderId?: string;
}

// New types for progress tracking
export interface ProgressRecord {
    progress: number;
    completed: boolean;
    courseTitle: string;
    videoTitle: string;
    lessonId: string;
    lastWatched: number;
    duration: number;
    selectionsCount?: number;
    isDrive?: boolean;
    driveFolderId?: string;
    thumbnailLink?: string;
}

export type ProgressData = Record<string, ProgressRecord>;