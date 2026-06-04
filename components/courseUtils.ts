import type { Selection, Lesson } from '../types';

export const extractDateFromTitle = (title: string): Date | null => {
  if (!title) return null;
  // Format 1: dd.MM.yyyy (e.g. "Buổi 1 - 05.01.2025")
  const dotDate = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dotDate) {
    return new Date(parseInt(dotDate[3], 10), parseInt(dotDate[2], 10) - 1, parseInt(dotDate[1], 10));
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
    return new Date(parseInt(isoDate[1], 10), parseInt(isoDate[2], 10) - 1, parseInt(isoDate[3], 10));
  }
  return null;
};

export const sortSelectionsLessons = (selections: Selection[]): Selection[] => {
  if (!Array.isArray(selections)) return [];
  return selections.map(selection => {
    if (!selection || !Array.isArray(selection.lessons)) return selection;
    const sortedLessons = [...selection.lessons].sort((a, b) => {
      const titleA = a.title || a.id || '';
      const titleB = b.title || b.id || '';

      const dateA = extractDateFromTitle(titleA);
      const dateB = extractDateFromTitle(titleB);
      if (dateA && dateB) {
        const diff = dateA.getTime() - dateB.getTime();
        if (diff !== 0) return diff;
      }
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

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
      return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
    });
    return { ...selection, lessons: sortedLessons };
  });
};
