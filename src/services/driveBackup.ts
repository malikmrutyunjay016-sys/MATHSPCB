import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sanitizeForFirestore, markDatabaseAsSeeded } from './db';
import {
  Faculty,
  Student,
  StudentCredential,
  Facility,
  Book,
  QuestionPaper,
  Notice,
  Committee,
  ImportantContact,
  ContactMessage,
  DepartmentSettings,
  TimeTableSlot,
  Syllabus,
  GalleryPhoto,
  CalendarEvent,
} from '../types';

export const BACKUP_FILE_NAME = 'math_dept_database_backup.json';

export interface DepartmentBackupData {
  version: string;
  backupDate: string;
  departmentName: string;
  collegeName: string;
  data: {
    credentials: StudentCredential[];
    faculty: Faculty[];
    students: Student[];
    syllabuses: Syllabus[];
    timeTable: TimeTableSlot[];
    pyq: QuestionPaper[];
    books: Book[];
    facilities: Facility[];
    galleryPhotos: GalleryPhoto[];
    notices: Notice[];
    committees: Committee[];
    contacts: ImportantContact[];
    inquiries: ContactMessage[];
    settings?: DepartmentSettings;
    calendarEvents?: CalendarEvent[];
  };
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Searches for the app's backup file in the user's Google Drive.
 */
export async function findDriveBackupFile(accessToken: string): Promise<DriveFileInfo | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILE_NAME}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size,webViewLink)&pageSize=1`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to query Google Drive: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileInfo;
  }
  return null;
}

/**
 * Syncs the current full dataset into Google Drive.
 * If the file already exists, updates it. If not, creates it.
 */
export async function syncBackupToGoogleDrive(
  accessToken: string,
  backupData: DepartmentBackupData
): Promise<{ fileId: string; modifiedTime: string; isNew: boolean }> {
  const existingFile = await findDriveBackupFile(accessToken);
  const jsonContent = JSON.stringify(backupData, null, 2);

  if (existingFile) {
    // Update existing file content
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonContent,
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Failed to update Drive backup: ${updateRes.status} ${err}`);
    }

    const updated = await updateRes.json();
    return {
      fileId: updated.id || existingFile.id,
      modifiedTime: updated.modifiedTime || new Date().toISOString(),
      isNew: false,
    };
  } else {
    // Create new file via multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: 'Department of Mathematics - Official Database Backup & Sync File',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create Drive backup file: ${createRes.status} ${err}`);
    }

    const created = await createRes.json();
    return {
      fileId: created.id,
      modifiedTime: created.modifiedTime || new Date().toISOString(),
      isNew: true,
    };
  }
}

/**
 * Downloads and parses the backup JSON file from Google Drive.
 */
export async function downloadBackupFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<DepartmentBackupData> {
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to download backup file from Drive: ${res.status} ${err}`);
  }

  const json = await res.json();
  if (!json || !json.data) {
    throw new Error('Invalid backup file format: missing department data container.');
  }

  return json as DepartmentBackupData;
}

/**
 * Restores all downloaded records into Cloud Firestore using high-performance atomic write batches.
 */
export async function restoreAllDataToFirestore(
  backup: DepartmentBackupData
): Promise<{ counts: Record<string, number> }> {
  const d = backup.data;
  const counts: Record<string, number> = {
    credentials: 0,
    faculty: 0,
    students: 0,
    syllabuses: 0,
    timeTable: 0,
    pyq: 0,
    books: 0,
    facilities: 0,
    galleryPhotos: 0,
    notices: 0,
    committees: 0,
    contacts: 0,
    inquiries: 0,
    settings: 0,
  };

  const operations: { ref: any; data: any }[] = [];

  // 1. Settings
  if (d.settings) {
    operations.push({
      ref: doc(db, 'department_settings', 'general'),
      data: sanitizeForFirestore(d.settings),
    });
    counts.settings = 1;
  }

  // 2. Student IDs & Passwords
  if (Array.isArray(d.credentials)) {
    for (const cred of d.credentials) {
      const docId = cred.uniqueId || cred.id || cred.rollNumber;
      if (docId) {
        operations.push({
          ref: doc(db, 'student_credentials', docId),
          data: sanitizeForFirestore(cred),
        });
        counts.credentials++;
      }
    }
  }

  // 3. Faculty
  if (Array.isArray(d.faculty)) {
    for (const fac of d.faculty) {
      if (fac.id) {
        operations.push({
          ref: doc(db, 'faculty', fac.id),
          data: sanitizeForFirestore(fac),
        });
        counts.faculty++;
      }
    }
  }

  // 4. Students
  if (Array.isArray(d.students)) {
    for (const stu of d.students) {
      if (stu.id) {
        operations.push({
          ref: doc(db, 'students', stu.id),
          data: sanitizeForFirestore(stu),
        });
        counts.students++;
      }
    }
  }

  // 5. Course Syllabi
  if (Array.isArray(d.syllabuses)) {
    for (const syl of d.syllabuses) {
      if (syl.id) {
        operations.push({
          ref: doc(db, 'syllabuses', syl.id),
          data: sanitizeForFirestore(syl),
        });
        counts.syllabuses++;
      }
    }
  }

  // 6. Time Table
  if (Array.isArray(d.timeTable)) {
    for (const slot of d.timeTable) {
      if (slot.id) {
        operations.push({
          ref: doc(db, 'timetables', slot.id),
          data: sanitizeForFirestore(slot),
        });
        counts.timeTable++;
      }
    }
  }

  // 7. Question Papers
  if (Array.isArray(d.pyq)) {
    for (const p of d.pyq) {
      if (p.id) {
        operations.push({
          ref: doc(db, 'question_papers', p.id),
          data: sanitizeForFirestore(p),
        });
        counts.pyq++;
      }
    }
  }

  // 8. Library Books
  if (Array.isArray(d.books)) {
    for (const b of d.books) {
      if (b.id) {
        operations.push({
          ref: doc(db, 'books', b.id),
          data: sanitizeForFirestore(b),
        });
        counts.books++;
      }
    }
  }

  // 9. Facilities / Showcase Photos
  if (Array.isArray(d.facilities)) {
    for (const f of d.facilities) {
      if (f.id) {
        operations.push({
          ref: doc(db, 'facilities', f.id),
          data: sanitizeForFirestore(f),
        });
        counts.facilities++;
      }
    }
  }

  // 10. Gallery Photos
  if (Array.isArray(d.galleryPhotos)) {
    for (const g of d.galleryPhotos) {
      if (g.id) {
        operations.push({
          ref: doc(db, 'gallery', g.id),
          data: sanitizeForFirestore(g),
        });
        counts.galleryPhotos++;
      }
    }
  }

  // 11. Notices
  if (Array.isArray(d.notices)) {
    for (const n of d.notices) {
      if (n.id) {
        operations.push({
          ref: doc(db, 'notices', n.id),
          data: sanitizeForFirestore(n),
        });
        counts.notices++;
      }
    }
  }

  // 12. Committees
  if (Array.isArray(d.committees)) {
    for (const c of d.committees) {
      if (c.id) {
        operations.push({
          ref: doc(db, 'committees', c.id),
          data: sanitizeForFirestore(c),
        });
        counts.committees++;
      }
    }
  }

  // 13. Directory Contacts
  if (Array.isArray(d.contacts)) {
    for (const con of d.contacts) {
      if (con.id) {
        operations.push({
          ref: doc(db, 'important_contacts', con.id),
          data: sanitizeForFirestore(con),
        });
        counts.contacts++;
      }
    }
  }

  // 14. Inquiries
  if (Array.isArray(d.inquiries)) {
    for (const inq of d.inquiries) {
      if (inq.id) {
        operations.push({
          ref: doc(db, 'contact_messages', inq.id),
          data: sanitizeForFirestore(inq),
        });
        counts.inquiries++;
      }
    }
  }

  // 15. Calendar Events & Holidays
  if (Array.isArray(d.calendarEvents) && d.calendarEvents.length > 0) {
    operations.push({
      ref: doc(db, 'department_settings', 'calendar_events'),
      data: sanitizeForFirestore({
        events: d.calendarEvents,
        updatedAt: new Date().toISOString(),
      }),
    });
  }

  // Always sync restored data into localStorage so local offline state updates immediately
  try {
    if (d.settings) localStorage.setItem('dept_settings', JSON.stringify(d.settings));
    if (d.credentials) localStorage.setItem('student_credentials', JSON.stringify(d.credentials));
    if (d.faculty) localStorage.setItem('dept_faculty', JSON.stringify(d.faculty));
    if (d.students) localStorage.setItem('dept_students', JSON.stringify(d.students));
    if (d.syllabuses) localStorage.setItem('dept_syllabuses', JSON.stringify(d.syllabuses));
    if (d.timeTable) localStorage.setItem('dept_timetables', JSON.stringify(d.timeTable));
    if (d.pyq) localStorage.setItem('dept_pyq', JSON.stringify(d.pyq));
    if (d.books) localStorage.setItem('dept_books', JSON.stringify(d.books));
    if (d.facilities) localStorage.setItem('dept_facilities', JSON.stringify(d.facilities));
    if (d.galleryPhotos) localStorage.setItem('dept_gallery', JSON.stringify(d.galleryPhotos));
    if (d.notices) localStorage.setItem('dept_notices', JSON.stringify(d.notices));
    if (d.committees) localStorage.setItem('dept_committees', JSON.stringify(d.committees));
    if (d.contacts) localStorage.setItem('dept_contacts', JSON.stringify(d.contacts));
    if (d.inquiries) localStorage.setItem('dept_inquiries', JSON.stringify(d.inquiries));
    if (d.calendarEvents) localStorage.setItem('dept_calendar_events_v2', JSON.stringify(d.calendarEvents));
  } catch (e) {
    console.warn('Local storage sync notice:', e);
  }

  // Commit all writes in batches of 400 items
  try {
    const BATCH_SIZE = 400;
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const chunk = operations.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(op.ref, op.data, { merge: true });
      }
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Firestore write batch notice (restored data saved locally):', err);
  }

  markDatabaseAsSeeded();

  return { counts };
}
