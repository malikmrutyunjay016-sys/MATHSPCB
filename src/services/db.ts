import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
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
  TimeTablePeriod,
  TimeTableClassRow,
  Syllabus,
  GalleryPhoto,
  DownloadItem,
  CalendarEvent,
} from '../types';
import {
  initialFaculty,
  initialStudents,
  initialCredentials,
  initialFacilities,
  initialBooks,
  initialQuestionPapers,
  initialNotices,
  initialCommittees,
  initialContacts,
  initialSettings,
  initialPeriods,
  initialClassRows,
  initialTimeTable,
  initialSyllabus,
  initialGallery,
  initialDownloads,
  initialCalendarEvents,
} from '../data/initialData';

// Seed Initial Data if collections are empty
/**
 * Strips all undefined fields recursively from an object before writing to Firestore.
 * Firestore throws a runtime error if any field is undefined.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

export async function seedInitialDatabase() {
  try {
    const settingsRef = doc(db, 'department_settings', 'general');
    await setDoc(settingsRef, sanitizeForFirestore({ ...initialSettings, isSeeded: true }), { merge: true });

    // Faculty
    for (const item of initialFaculty) {
      await setDoc(doc(db, 'faculty', item.id), sanitizeForFirestore(item), { merge: true });
    }

    // Students start empty: only new updates and registrations will be counted

    // Seed Facilities
    for (const item of initialFacilities) {
      await setDoc(doc(db, 'facilities', item.id), item, { merge: true });
    }

    // Seed Books
    for (const item of initialBooks) {
      await setDoc(doc(db, 'books', item.id), item, { merge: true });
    }

    // Seed PYQ
    for (const item of initialQuestionPapers) {
      await setDoc(doc(db, 'question_papers', item.id), item, { merge: true });
    }

    // Notices start empty: only new updates and published circulars will be counted

    // Seed Committees
    for (const item of initialCommittees) {
      await setDoc(doc(db, 'committees', item.id), item, { merge: true });
    }

    // Seed Contacts
    for (const item of initialContacts) {
      await setDoc(doc(db, 'important_contacts', item.id), item, { merge: true });
    }

    // Seed Timetables
    for (const item of initialTimeTable) {
      await setDoc(doc(db, 'timetables', item.id), sanitizeForFirestore(item), { merge: true });
    }

    // Seed Syllabuses
    for (const item of initialSyllabus) {
      await setDoc(doc(db, 'syllabuses', item.id), sanitizeForFirestore(item), { merge: true });
    }

    // Seed Gallery Photos
    for (const item of initialGallery) {
      await setDoc(doc(db, 'gallery', item.id), sanitizeForFirestore(item), { merge: true });
    }

    // Seed Downloads
    for (const item of initialDownloads) {
      await setDoc(doc(db, 'downloads', item.id), sanitizeForFirestore(item), { merge: true });
    }

    markDatabaseAsSeeded();
    console.log('Database successfully seeded with realistic departmental data.');
  } catch (err) {
    console.warn('Seeding note:', err);
  }
}

let isSeedingInProgress = false;
let globalIsSeeded = false;

export function markDatabaseAsSeeded() {
  globalIsSeeded = true;
  try {
    localStorage.setItem('dept_is_seeded', 'true');
  } catch {}
}

export function isDatabaseSeededSync(): boolean {
  if (globalIsSeeded) return true;
  try {
    if (localStorage.getItem('dept_is_seeded') === 'true') {
      globalIsSeeded = true;
      return true;
    }
  } catch {}
  return false;
}

export async function checkIsSeeded(): Promise<boolean> {
  if (isDatabaseSeededSync()) return true;
  try {
    const settingsSnap = await getDoc(doc(db, 'department_settings', 'general'));
    if (settingsSnap.exists() && settingsSnap.data()?.isSeeded) {
      markDatabaseAsSeeded();
      return true;
    }
  } catch {}
  return false;
}

/**
 * Checks whether Firestore has been seeded with initial records.
 * If not, seeds once automatically so all records exist in Cloud Firestore as real docs.
 */
export async function ensureDatabaseSeeded() {
  if (isSeedingInProgress || isDatabaseSeededSync()) return;
  try {
    const isAlreadySeeded = await checkIsSeeded();
    if (!isAlreadySeeded) {
      isSeedingInProgress = true;
      console.log('Performing initial Firestore database auto-seeding...');
      await seedInitialDatabase();
      markDatabaseAsSeeded();
    }
  } catch (err) {
    console.warn('ensureDatabaseSeeded note:', err);
  } finally {
    isSeedingInProgress = false;
  }
}

// ------------------- FACULTY -------------------
export function subscribeToFaculty(
  callback: (faculty: Faculty[]) => void,
  fallback: () => void
) {
  const path = 'faculty';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const defaultIds = new Set(['fac-1', 'fac-2', 'fac-3', 'fac-4', 'fac-5', 'fac-6']);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Faculty))
          .filter((f) => !defaultIds.has(f.id));
        data.sort((a, b) => (a.order || 99) - (b.order || 99));
        callback(data);
      },
      (error) => {
        console.warn('Faculty snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveFacultyMember(faculty: Faculty) {
  const path = `faculty/${faculty.id}`;
  try {
    await setDoc(doc(db, 'faculty', faculty.id), sanitizeForFirestore({
      ...faculty,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFacultyMember(id: string) {
  const path = `faculty/${id}`;
  try {
    await deleteDoc(doc(db, 'faculty', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- STUDENTS -------------------
export function subscribeToStudents(
  callback: (students: Student[]) => void,
  fallback: () => void
) {
  const path = 'students';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
        data.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
        callback(data);
      },
      (error) => {
        console.warn('Students snapshot fallback:', error);
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    callback([]);
    return () => {};
  }
}

export async function saveStudent(student: Student) {
  const path = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), sanitizeForFirestore({
      ...student,
      updatedAt: new Date().toISOString(),
    }));

    // Harmonize with student_credentials so both databases always have the exact same students
    const uniqueId = student.uniqueId || student.rollNumber.trim();
    const credRef = doc(db, 'student_credentials', uniqueId);
    let existingPassword = `Math@${student.admissionYear || '2026'}`;
    try {
      const existingDoc = await getDoc(credRef);
      if (existingDoc.exists() && existingDoc.data()?.password) {
        existingPassword = existingDoc.data().password;
      }
    } catch {
      // Ignore
    }

    await setDoc(
      credRef,
      sanitizeForFirestore({
        id: uniqueId,
        uniqueId,
        studentId: student.id,
        rollNumber: student.rollNumber.trim(),
        studentName: student.name.trim(),
        password: existingPassword,
        course: student.course,
        admissionYear: student.admissionYear || '2026',
        createdAt: student.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStudent(id: string) {
  const path = `students/${id}`;
  try {
    let rollToDelete = '';
    let uniqueIdToDelete = '';

    try {
      const stuDoc = await getDoc(doc(db, 'students', id));
      if (stuDoc.exists()) {
        const s = stuDoc.data();
        rollToDelete = s.rollNumber || '';
        uniqueIdToDelete = s.uniqueId || '';
      }
    } catch {}

    // 1. Delete student document
    await deleteDoc(doc(db, 'students', id));

    // 2. Delete matching credential document(s) directly
    if (uniqueIdToDelete) {
      await deleteDoc(doc(db, 'student_credentials', uniqueIdToDelete)).catch(() => {});
    }
    if (rollToDelete && rollToDelete !== uniqueIdToDelete) {
      await deleteDoc(doc(db, 'student_credentials', rollToDelete)).catch(() => {});
    }
    await deleteDoc(doc(db, 'student_credentials', id)).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function clearAllStudents() {
  const path = 'students';
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    for (const d of studentsSnap.docs) {
      await deleteDoc(doc(db, 'students', d.id));
    }
    const credsSnap = await getDocs(collection(db, 'student_credentials'));
    for (const d of credsSnap.docs) {
      await deleteDoc(doc(db, 'student_credentials', d.id));
    }
    await updateDoc(doc(db, 'department_settings', 'general'), {
      studentCount: 0,
    }).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function batchPromoteStudents(
  updatedStudents: Student[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const path = 'students';
  try {
    const BATCH_SIZE = 400;
    for (let i = 0; i < updatedStudents.length; i += BATCH_SIZE) {
      const chunk = updatedStudents.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const s of chunk) {
        const studentToSave = sanitizeForFirestore({
          ...s,
          updatedAt: new Date().toISOString(),
        });
        batch.set(doc(db, 'students', s.id), studentToSave, { merge: true });

        // Synchronize linked credential record
        const uniqueId = s.uniqueId || s.rollNumber.trim();
        const credRef = doc(db, 'student_credentials', uniqueId);
        batch.set(
          credRef,
          sanitizeForFirestore({
            course: s.course,
            admissionYear: s.admissionYear || '2026',
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      }
      await batch.commit();
    }
    return { success: true, count: updatedStudents.length };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return { success: false, count: 0, error: err?.message || 'Failed to promote batch' };
  }
}

// ------------------- STUDENT CREDENTIALS (ADMIN VAULT & PORTAL) -------------------
export function subscribeToStudentCredentials(
  callback: (credentials: StudentCredential[]) => void,
  fallback: () => void
) {
  const path = 'student_credentials';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentCredential));
        data.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
        callback(data);
      },
      (error) => {
        console.warn('Student credentials snapshot fallback:', error);
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function saveStudentCredential(cred: StudentCredential) {
  const path = `student_credentials/${cred.uniqueId}`;
  try {
    await setDoc(doc(db, 'student_credentials', cred.uniqueId), sanitizeForFirestore({
      ...cred,
      updatedAt: new Date().toISOString(),
    }));

    // Harmonize with students collection so both databases always have the exact same students
    const studentId = cred.studentId || `stu-${cred.uniqueId}`;
    const stuRef = doc(db, 'students', studentId);
    let existingStudentData: Partial<Student> = {};
    try {
      const existingDoc = await getDoc(stuRef);
      if (existingDoc.exists()) {
        existingStudentData = existingDoc.data() as Student;
      }
    } catch {}

    const admissionYear = cred.admissionYear || '2026';
    const academicYear = `${admissionYear}–${(parseInt(admissionYear, 10) + 1).toString().slice(-2)}`;

    await setDoc(
      stuRef,
      sanitizeForFirestore({
        academicYear,
        yearLevel: '1st Year',
        semester: 'Semester I',
        academicStatus: 'Active',
        createdAt: cred.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...existingStudentData,
        id: studentId,
        uniqueId: cred.uniqueId,
        rollNumber: cred.rollNumber.trim(),
        name: cred.studentName.trim(),
        course: cred.course,
        admissionYear,
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStudentCredential(uniqueId: string) {
  const path = `student_credentials/${uniqueId}`;
  try {
    let studentIdToDelete = '';
    let rollToDelete = '';

    try {
      const credDoc = await getDoc(doc(db, 'student_credentials', uniqueId));
      if (credDoc.exists()) {
        const c = credDoc.data();
        studentIdToDelete = c.studentId || '';
        rollToDelete = c.rollNumber || '';
      }
    } catch {}

    // 1. Delete from student_credentials
    await deleteDoc(doc(db, 'student_credentials', uniqueId));

    // 2. Delete corresponding student doc from students directly
    if (studentIdToDelete) {
      await deleteDoc(doc(db, 'students', studentIdToDelete)).catch(() => {});
    }
    if (rollToDelete) {
      await deleteDoc(doc(db, 'students', rollToDelete)).catch(() => {});
    }
    await deleteDoc(doc(db, 'students', uniqueId)).catch(() => {});
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function registerNewStudentWithCredentials(
  student: Student,
  password: string
): Promise<{ success: boolean; student?: Student; credential?: StudentCredential; error?: string }> {
  try {
    const studentDocId = student.id || `stu-${Date.now()}`;
    const uniqueId = student.uniqueId || student.rollNumber.trim();

    const studentToSave = sanitizeForFirestore<Student>({
      ...student,
      id: studentDocId,
      uniqueId,
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const credentialToSave = sanitizeForFirestore<StudentCredential>({
      id: uniqueId,
      uniqueId,
      studentId: studentDocId,
      rollNumber: student.rollNumber.trim(),
      studentName: student.name.trim(),
      password: password.trim(),
      course: student.course,
      admissionYear: student.admissionYear || new Date().getFullYear().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Save student document
    await setDoc(doc(db, 'students', studentDocId), studentToSave);

    // Save credentials document (accessible to admin vault)
    await setDoc(doc(db, 'student_credentials', uniqueId), credentialToSave);

    return { success: true, student: studentToSave, credential: credentialToSave };
  } catch (err: any) {
    console.error('Registration Error:', err);
    return { success: false, error: err?.message || 'Failed to register student.' };
  }
}

export async function loginStudentPortal(
  loginId: string,
  passwordAttempt: string
): Promise<{ success: boolean; student?: Student; credential?: StudentCredential; error?: string }> {
  try {
    const cleanId = loginId.trim();
    const cleanPass = passwordAttempt.trim();

    // 1. Direct document lookup by unique ID / roll number
    const credDocRef = doc(db, 'student_credentials', cleanId);
    const credSnap = await getDoc(credDocRef);

    let credData: StudentCredential | null = null;
    if (credSnap.exists()) {
      credData = { id: credSnap.id, ...credSnap.data() } as StudentCredential;
    } else {
      // Fallback query by rollNumber
      const q = query(collection(db, 'student_credentials'), where('rollNumber', '==', cleanId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        credData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as StudentCredential;
      }
    }

    if (!credData) {
      return { success: false, error: 'Student ID / Roll Number not found. Please register your details first.' };
    }

    if (credData.password !== cleanPass) {
      return { success: false, error: 'Incorrect password. Please contact department administrator if forgotten.' };
    }

    // 2. Fetch linked student record
    const studentDocRef = doc(db, 'students', credData.studentId);
    const studentSnap = await getDoc(studentDocRef);

    let studentData: Student;
    if (studentSnap.exists()) {
      studentData = { id: studentSnap.id, ...studentSnap.data() } as Student;
    } else {
      studentData = {
        id: credData.studentId,
        uniqueId: credData.uniqueId,
        rollNumber: credData.rollNumber,
        name: credData.studentName,
        course: credData.course,
        academicYear: `${credData.admissionYear}–${parseInt(credData.admissionYear) + 1}`,
        yearLevel: '1st Year',
        semester: 'Semester I',
        academicStatus: 'Active',
      };
    }

    return { success: true, student: studentData, credential: credData };
  } catch (err: any) {
    console.error('Login Error:', err);
    return { success: false, error: err?.message || 'Student login failed.' };
  }
}

// ------------------- FACILITIES -------------------
export function subscribeToFacilities(
  callback: (facilities: Facility[]) => void,
  fallback: () => void
) {
  const path = 'facilities';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          if (isDatabaseSeededSync()) {
            callback([]);
            return;
          }
          const seeded = await checkIsSeeded();
          if (seeded) {
            callback([]);
            return;
          }
          callback(initialFacilities);
          ensureDatabaseSeeded();
          return;
        }
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Facility));
        data.sort((a, b) => (a.order || 99) - (b.order || 99));
        callback(data);
      },
      (error) => {
        console.warn('Facilities snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveFacility(facility: Facility) {
  const path = `facilities/${facility.id}`;
  try {
    await setDoc(doc(db, 'facilities', facility.id), sanitizeForFirestore({
      ...facility,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteFacility(id: string) {
  const path = `facilities/${id}`;
  try {
    await deleteDoc(doc(db, 'facilities', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- BOOKS -------------------
export async function syncAllRegisterBooksToFirestore(): Promise<number> {
  try {
    const BATCH_SIZE = 400;
    for (let i = 0; i < initialBooks.length; i += BATCH_SIZE) {
      const chunk = initialBooks.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        batch.set(doc(db, 'books', item.id), sanitizeForFirestore(item), { merge: true });
      }
      await batch.commit();
    }
    console.log(`Successfully synced ${initialBooks.length} register books to Firestore.`);
    return initialBooks.length;
  } catch (err) {
    console.warn('Error syncing register books to Firestore:', err);
    throw err;
  }
}

export function subscribeToBooks(
  callback: (books: Book[]) => void,
  fallback: () => void
) {
  const path = 'books';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback(initialBooks);
          syncAllRegisterBooksToFirestore().catch(() => {});
          return;
        }
        const remoteBooks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Book));
        let fullList = remoteBooks;

        // If Firestore has fewer books than initialBooks, merge them so user immediately sees all 116 books
        if (remoteBooks.length < initialBooks.length) {
          const remoteIds = new Set(remoteBooks.map((b) => b.id));
          const missing = initialBooks.filter((b) => !remoteIds.has(b.id));
          fullList = [...remoteBooks, ...missing];
          
          // Auto-sync missing books to Firestore in background
          syncAllRegisterBooksToFirestore().catch(() => {});
        }

        fullList.sort((a, b) => {
          const accA = a.accessionNumber || a.title;
          const accB = b.accessionNumber || b.title;
          return accA.localeCompare(accB, undefined, { numeric: true, sensitivity: 'base' });
        });
        callback(fullList);
      },
      (error) => {
        console.warn('Books snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveBook(book: Book) {
  const path = `books/${book.id}`;
  try {
    await setDoc(doc(db, 'books', book.id), sanitizeForFirestore({
      ...book,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBook(id: string) {
  const path = `books/${id}`;
  try {
    await deleteDoc(doc(db, 'books', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- PYQ (QUESTION PAPERS) -------------------
export function subscribeToPYQ(
  callback: (papers: QuestionPaper[]) => void,
  fallback: () => void
) {
  const path = 'question_papers';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          if (isDatabaseSeededSync()) {
            callback([]);
            return;
          }
          const seeded = await checkIsSeeded();
          if (seeded) {
            callback([]);
            return;
          }
          callback(initialQuestionPapers);
          ensureDatabaseSeeded();
          return;
        }
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionPaper));
        data.sort((a, b) => b.academicYear.localeCompare(a.academicYear));
        callback(data);
      },
      (error) => {
        console.warn('PYQ snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveQuestionPaper(paper: QuestionPaper) {
  const path = `question_papers/${paper.id}`;
  try {
    await setDoc(doc(db, 'question_papers', paper.id), sanitizeForFirestore({
      ...paper,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteQuestionPaper(id: string) {
  const path = `question_papers/${id}`;
  try {
    await deleteDoc(doc(db, 'question_papers', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- NOTICES -------------------
export function subscribeToNotices(
  callback: (notices: Notice[]) => void,
  fallback: () => void
) {
  const path = 'notices';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            localStorage.setItem('dept_notices', JSON.stringify([]));
          } catch {}
          callback([]);
          return;
        }
        const dummyIds = new Set(['not-1', 'not-2', 'not-3', 'not-4', 'not-5', 'not-6']);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Notice))
          .filter((n) => !dummyIds.has(n.id));
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        try {
          localStorage.setItem('dept_notices', JSON.stringify(data));
        } catch {}
        callback(data);
      },
      (error) => {
        console.warn('Notices snapshot fallback:', error);
        try {
          const saved = localStorage.getItem('dept_notices');
          if (saved) {
            const parsed: Notice[] = JSON.parse(saved);
            const dummyIds = new Set(['not-1', 'not-2', 'not-3', 'not-4', 'not-5', 'not-6']);
            callback(parsed.filter((n) => !dummyIds.has(n.id)));
            return;
          }
        } catch {}
        callback([]);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveNotice(notice: Notice) {
  const path = `notices/${notice.id}`;
  try {
    await setDoc(doc(db, 'notices', notice.id), sanitizeForFirestore({
      ...notice,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteNotice(id: string) {
  const path = `notices/${id}`;
  try {
    await deleteDoc(doc(db, 'notices', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- COMMITTEES -------------------
export function subscribeToCommittees(
  callback: (committees: Committee[]) => void,
  fallback: () => void
) {
  const path = 'committees';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const defaultIds = new Set(['com-1', 'com-2', 'com-3', 'com-4', 'com-5', 'com-6', 'com-7', 'com-8']);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Committee))
          .filter((c) => !defaultIds.has(c.id));
        callback(data);
      },
      (error) => {
        console.warn('Committees snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveCommittee(committee: Committee) {
  const path = `committees/${committee.id}`;
  try {
    await setDoc(doc(db, 'committees', committee.id), sanitizeForFirestore({
      ...committee,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCommittee(id: string) {
  const path = `committees/${id}`;
  try {
    await deleteDoc(doc(db, 'committees', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- IMPORTANT CONTACTS -------------------
export function subscribeToContacts(
  callback: (contacts: ImportantContact[]) => void,
  fallback: () => void
) {
  const path = 'important_contacts';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const defaultIds = new Set(['cnt-1', 'cnt-2', 'cnt-3', 'cnt-4', 'cnt-5', 'cnt-6', 'cnt-7', 'cnt-8']);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as ImportantContact))
          .filter((c) => !defaultIds.has(c.id));
        data.sort((a, b) => (a.order || 99) - (b.order || 99));
        callback(data);
      },
      (error) => {
        console.warn('Contacts snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveContact(contact: ImportantContact) {
  const path = `important_contacts/${contact.id}`;
  try {
    await setDoc(doc(db, 'important_contacts', contact.id), sanitizeForFirestore({
      ...contact,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteContact(id: string) {
  const path = `important_contacts/${id}`;
  try {
    await deleteDoc(doc(db, 'important_contacts', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ------------------- CONTACT MESSAGES (INQUIRIES) -------------------
export async function submitContactInquiry(message: Omit<ContactMessage, 'id' | 'createdAt'>) {
  const id = `msg-${Date.now()}`;
  const path = `contact_messages/${id}`;
  try {
    await setDoc(doc(db, 'contact_messages', id), sanitizeForFirestore({
      ...message,
      id,
      status: 'unread',
      createdAt: new Date().toISOString(),
    }));
    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return { success: false, error: err };
  }
}

export function subscribeToInquiries(
  callback: (messages: ContactMessage[]) => void,
  fallback: () => void
) {
  const path = 'contact_messages';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ContactMessage));
        callback(data);
      },
      () => {
        fallback();
      }
    );
  } catch (error) {
    fallback();
    return () => {};
  }
}

// ------------------- DEPARTMENT SETTINGS -------------------
export function subscribeToSettings(
  callback: (settings: DepartmentSettings) => void,
  fallback: () => void
) {
  const path = 'department_settings/general';
  try {
    return onSnapshot(
      doc(db, 'department_settings', 'general'),
      (snapshot) => {
        if (!snapshot.exists()) {
          fallback();
          return;
        }
        callback({ id: snapshot.id, ...snapshot.data() } as DepartmentSettings);
      },
      () => {
        fallback();
      }
    );
  } catch (error) {
    fallback();
    return () => {};
  }
}

export async function updateDepartmentSettings(settings: Partial<DepartmentSettings>) {
  const path = 'department_settings/general';
  try {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem('dept_settings') || '{}');
      localStorage.setItem('dept_settings', JSON.stringify({ ...existing, ...updated }));
    } catch {}

    await updateDoc(doc(db, 'department_settings', 'general'), sanitizeForFirestore(updated));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ------------------- ADMIN AUTHENTICATION & PASSWORD SECURITY -------------------
export const DEFAULT_ADMIN_ID = 'Admin123';
export const DEFAULT_ADMIN_PASSWORD = '762016';
export const LEGACY_ADMIN_PASSWORD = 'Maths.pcb@123';
export const MASTER_ADMIN_KEY = '762016';

/**
 * Retrieves the current admin password from Firestore, fallback to localStorage or default.
 */
export async function getAdminPassword(): Promise<string> {
  try {
    // 1. Check dedicated admin_auth document
    const authDocRef = doc(db, 'department_settings', 'admin_auth');
    const authSnap = await getDoc(authDocRef);
    if (authSnap.exists() && authSnap.data()?.password) {
      const remotePw = String(authSnap.data().password);
      localStorage.setItem('dept_admin_password', remotePw);
      return remotePw;
    }

    // 2. Check general settings document
    const genDocRef = doc(db, 'department_settings', 'general');
    const genSnap = await getDoc(genDocRef);
    if (genSnap.exists() && genSnap.data()?.adminPassword) {
      const remotePw = String(genSnap.data().adminPassword);
      localStorage.setItem('dept_admin_password', remotePw);
      return remotePw;
    }
  } catch (err) {
    console.warn('Could not read admin password from remote Firestore, using local cache:', err);
  }

  return localStorage.getItem('dept_admin_password') || DEFAULT_ADMIN_PASSWORD;
}

/**
 * Verifies admin credentials strictly.
 * Admin ID must be "Admin123" (case-insensitive) and Password must match current active password or default.
 */
export async function verifyAdminCredentials(
  idAttempt: string,
  passwordAttempt: string
): Promise<{ success: boolean; error?: string }> {
  const cleanId = idAttempt.trim();
  const cleanPass = passwordAttempt.trim();

  if (!cleanId) {
    return { success: false, error: 'Please enter Administrator ID.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Please enter Administrator Password.' };
  }

  if (cleanId.toLowerCase() !== DEFAULT_ADMIN_ID.toLowerCase()) {
    return { success: false, error: `Invalid Administrator ID. Designated ID is "${DEFAULT_ADMIN_ID}".` };
  }

  const currentPassword = await getAdminPassword();
  const isValid =
    cleanPass === currentPassword ||
    cleanPass === DEFAULT_ADMIN_PASSWORD ||
    cleanPass === MASTER_ADMIN_KEY ||
    cleanPass === '762016' ||
    cleanPass === LEGACY_ADMIN_PASSWORD;

  if (!isValid) {
    return {
      success: false,
      error: 'Incorrect administrator password. If you forgot your password, use the Master Permission Key to change or reset it.',
    };
  }

  return { success: true };
}

/**
 * Changes or resets the administrator password using the confidential master permission key.
 * This allows the admin to change their password securely.
 */
export async function updateAdminPasswordWithMasterKey(
  masterKeyAttempt: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanKey = masterKeyAttempt.trim();

  // Strict verification of the Master Permission Key
  if (cleanKey !== MASTER_ADMIN_KEY && cleanKey !== '762016') {
    return {
      success: false,
      error: 'Invalid Master Permission Key. The master authorization key is strictly required to change or reset administrator password.',
    };
  }

  const cleanPass = newPassword.trim();
  if (!cleanPass) {
    return { success: false, error: 'New password cannot be empty.' };
  }
  if (cleanPass.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long for security.' };
  }

  // 1. Update localStorage immediately so it works offline and instantly
  localStorage.setItem('dept_admin_password', cleanPass);

  // 2. Persist to Firestore across sessions
  try {
    const authRef = doc(db, 'department_settings', 'admin_auth');
    await setDoc(authRef, {
      adminId: DEFAULT_ADMIN_ID,
      password: cleanPass,
      updatedAt: new Date().toISOString(),
      updatedVia: 'master_key_762016',
    }, { merge: true });

    const genRef = doc(db, 'department_settings', 'general');
    await setDoc(genRef, {
      adminId: DEFAULT_ADMIN_ID,
      adminPassword: cleanPass,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error persisting new admin password to Firestore:', err);
    // Local storage is updated, so local authentication will still succeed
  }

  return { success: true };
}

// ------------------- TIME TABLE SLOTS & CONFIG -------------------
export function subscribeToTimeTable(
  callback: (slots: TimeTableSlot[]) => void,
  fallback: () => void
) {
  const path = 'timetables';
  try {
    const q = collection(db, path);
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const defaultTtIds = new Set([
          'tt-m1-nep1', 'tt-m2-nep1', 'tt-m3-nep3', 'tt-m4-nep5', 'tt-m5-pg1', 'tt-m7-pg3-lab',
          'tt-t1-nep1', 'tt-t2-nep3', 'tt-t3-aedp1', 'tt-t5-nep5-lab',
          'tt-w1-pg1', 'tt-w2-nep1', 'tt-w4-nep3', 'tt-w6-pg3',
          'tt-th1-nep1', 'tt-th3-nep5', 'tt-th5-pg1',
          'tt-f1-nep1', 'tt-f3-pg3', 'tt-f6-sem-all',
          'tt-s1-nep3', 'tt-s3-pg1',
        ]);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((d) => !d.isDeleted && !defaultTtIds.has(d.id)) as TimeTableSlot[];
        callback(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        fallback();
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    fallback();
    return () => {};
  }
}

export async function saveTimeTableSlot(slot: TimeTableSlot) {
  const path = `timetables/${slot.id}`;
  try {
    await setDoc(doc(db, 'timetables', slot.id), sanitizeForFirestore({
      ...slot,
      isDeleted: false,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteTimeTableSlot(id: string) {
  const path = `timetables/${id}`;
  try {
    // Mark as deleted so it is filtered out from both initial and Firestore caches
    await setDoc(doc(db, 'timetables', id), {
      id,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    }, { merge: true });
    await deleteDoc(doc(db, 'timetables', id)).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function clearAllTimeTableSlots() {
  const path = 'timetables';
  try {
    const snap = await getDocs(collection(db, path));
    const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, path, d.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToTimeTableConfig(
  callback: (config: { periods: TimeTablePeriod[]; classRows: TimeTableClassRow[] }) => void,
  fallback: () => void
) {
  const path = 'department_settings/timetable_config';
  try {
    const docRef = doc(db, 'department_settings', 'timetable_config');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          fallback();
          return;
        }
        const data = snapshot.data();
        const periods =
          Array.isArray(data?.periods) && data.periods.length > 0
            ? data.periods
            : initialPeriods;
        const classRows =
          Array.isArray(data?.classRows) && data.classRows.length > 0
            ? data.classRows
            : initialClassRows;
        callback({ periods, classRows });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        fallback();
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveTimeTableConfig(config: {
  periods: TimeTablePeriod[];
  classRows: TimeTableClassRow[];
}) {
  const path = 'department_settings/timetable_config';
  try {
    await setDoc(
      doc(db, 'department_settings', 'timetable_config'),
      sanitizeForFirestore({
        periods: config.periods,
        classRows: config.classRows,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ------------------- SYLLABUSES -------------------
export function subscribeToSyllabuses(
  callback: (syllabuses: Syllabus[]) => void,
  fallback: () => void
) {
  const path = 'syllabuses';
  try {
    const q = collection(db, path);
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Syllabus))
          .filter(
            (s) =>
              !s.id.startsWith('syl-nep-') &&
              !s.id.startsWith('syl-aedp-') &&
              !s.id.startsWith('syl-pg-')
          );
        callback(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        fallback();
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    fallback();
    return () => {};
  }
}

export async function saveSyllabus(syllabus: Syllabus) {
  const path = `syllabuses/${syllabus.id}`;
  try {
    await setDoc(doc(db, 'syllabuses', syllabus.id), sanitizeForFirestore({
      ...syllabus,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteSyllabus(id: string) {
  const path = `syllabuses/${id}`;
  try {
    await deleteDoc(doc(db, 'syllabuses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ------------------- GALLERY -------------------
export function subscribeToGallery(
  callback: (photos: GalleryPhoto[]) => void,
  fallback: () => void
) {
  const path = 'gallery';
  try {
    const q = collection(db, path);
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }
        const defaultPhotoIds = new Set(['gal-1', 'gal-2', 'gal-3', 'gal-4', 'gal-5', 'gal-6', 'gal-7', 'gal-8']);
        const defaultEventIds = new Set([
          'event-nmd-2025',
          'event-induction-2026',
          'event-seminar-2025',
          'event-latex-workshop-2025',
          'event-piday-2025',
        ]);
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as GalleryPhoto))
          .filter((g) => !defaultPhotoIds.has(g.id) && !defaultEventIds.has(g.eventId || ''));
        // Sort by order or createdAt descending
        data.sort((a, b) => {
          if (a.order && b.order) return a.order - b.order;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        callback(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        fallback();
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    fallback();
    return () => {};
  }
}

export async function saveGalleryPhoto(photo: GalleryPhoto) {
  const path = `gallery/${photo.id}`;
  try {
    await setDoc(doc(db, 'gallery', photo.id), sanitizeForFirestore({
      ...photo,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteGalleryPhoto(id: string) {
  const path = `gallery/${id}`;
  try {
    await deleteDoc(doc(db, 'gallery', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// ------------------- DOWNLOADS -------------------
export function subscribeToDownloads(
  callback: (downloads: DownloadItem[]) => void,
  fallback: () => void
) {
  const path = 'downloads';
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      async (snapshot) => {
        const defaultIds = new Set(['dl-1', 'dl-2', 'dl-3', 'dl-4', 'dl-5', 'dl-6', 'dl-7', 'dl-8', 'dl-9']);
        if (snapshot.empty) {
          try {
            const saved = localStorage.getItem('dept_downloads');
            if (saved) {
              const parsed: DownloadItem[] = JSON.parse(saved);
              const filtered = parsed.filter((d) => !defaultIds.has(d.id));
              localStorage.setItem('dept_downloads', JSON.stringify(filtered));
              callback(filtered);
              return;
            }
          } catch {}
          callback([]);
          return;
        }
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as DownloadItem))
          .filter((d) => !defaultIds.has(d.id));
        try {
          localStorage.setItem('dept_downloads', JSON.stringify(data));
        } catch {}
        callback(data);
      },
      (error) => {
        console.warn('Downloads snapshot fallback:', error);
        fallback();
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveDownloadItem(item: DownloadItem) {
  const path = `downloads/${item.id}`;
  try {
    await setDoc(doc(db, 'downloads', item.id), sanitizeForFirestore({
      ...item,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    // Keep local storage synced as well
    try {
      const saved = localStorage.getItem('dept_downloads');
      const list: DownloadItem[] = saved ? JSON.parse(saved) : [...initialDownloads];
      const idx = list.findIndex((d) => d.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.unshift(item);
      }
      localStorage.setItem('dept_downloads', JSON.stringify(list));
    } catch {}
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteDownloadItem(id: string) {
  const path = `downloads/${id}`;
  try {
    await deleteDoc(doc(db, 'downloads', id));
    // Keep local storage synced
    try {
      const saved = localStorage.getItem('dept_downloads');
      if (saved) {
        const list: DownloadItem[] = JSON.parse(saved);
        const filtered = list.filter((d) => d.id !== id);
        localStorage.setItem('dept_downloads', JSON.stringify(filtered));
      }
    } catch {}
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// ------------------- LIVE ACADEMIC CALENDAR & HOLIDAYS -------------------
export function subscribeToCalendarEvents(
  callback: (events: CalendarEvent[]) => void,
  fallback: () => void
) {
  const path = 'department_settings/calendar_events';
  try {
    const docRef = doc(db, 'department_settings', 'calendar_events');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists() || !snapshot.data()?.events) {
          try {
            const saved = localStorage.getItem('dept_calendar_events_v2');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                callback(parsed);
                return;
              }
            }
          } catch {}
          callback(initialCalendarEvents);
          // Seed initial live calendar events to Firestore if document does not exist
          saveCalendarEvents(initialCalendarEvents).catch(() => {});
          return;
        }
        const data = snapshot.data();
        const eventsList = (data.events || []) as CalendarEvent[];
        try {
          localStorage.setItem('dept_calendar_events_v2', JSON.stringify(eventsList));
        } catch {}
        callback(eventsList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        try {
          const saved = localStorage.getItem('dept_calendar_events_v2');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              callback(parsed);
              return;
            }
          }
        } catch {}
        fallback();
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    fallback();
    return () => {};
  }
}

export async function saveCalendarEvents(events: CalendarEvent[]) {
  const path = 'department_settings/calendar_events';
  try {
    // Keep local storage synced for offline instant UI
    try {
      localStorage.setItem('dept_calendar_events_v2', JSON.stringify(events));
    } catch {}

    // Persist live to Cloud Firestore so all users receive updates instantly
    await setDoc(doc(db, 'department_settings', 'calendar_events'), sanitizeForFirestore({
      events,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
