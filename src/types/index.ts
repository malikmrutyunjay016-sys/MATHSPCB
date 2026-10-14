export type FacultyCategory = 'regular' | 'regular_guest' | 'guest' | 'visiting';

export interface Faculty {
  id: string;
  name: string;
  designation: string;
  facultyType?: FacultyCategory | string;
  qualification: string;
  specialization: string;
  email: string;
  phone?: string;
  profile: string;
  publications?: string;
  photoUrl: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function getFacultyCategory(f: { designation?: string; facultyType?: string }): FacultyCategory {
  if (f.facultyType === 'regular_guest' || f.facultyType === 'regular guest') return 'regular_guest';
  if (f.facultyType === 'guest') return 'guest';
  if (f.facultyType === 'visiting') return 'visiting';
  if (f.facultyType === 'regular') return 'regular';
  const d = (f.designation || '').toLowerCase();
  if (d.includes('regular guest') || (d.includes('guest') && d.includes('regular'))) return 'regular_guest';
  if (d.includes('visiting')) return 'visiting';
  if (d.includes('guest') || d.includes('consultant') || d.includes('adhoc') || d.includes('ad hoc')) return 'guest';
  return 'regular';
}

export type AllowedCourse = 'UG NEP' | 'UG AEDP' | 'UG CBCS' | 'PG';

export interface Student {
  id: string;
  uniqueId?: string; // Unique Student Portal Login ID
  rollNumber: string;
  registrationNumber?: string;
  name: string;
  fatherMotherName?: string;
  gender?: string;
  dob?: string;
  course: 'UG NEP' | 'UG AEDP' | 'UG CBCS' | 'PG' | string; // Kept strictly to UG NEP, UG AEDP, UG CBCS, PG
  academicYear: string; // e.g. "2026–27", "2025–26", "2024–25"
  yearLevel: string; // "1st Year", "2nd Year", "3rd Year"
  semester: string; // "Semester I", "Semester II", etc.
  mobile?: string;
  email?: string;
  address?: string;
  admissionYear?: string; // Joining year e.g. "2026", "2025"
  category?: string; // Category of students masked on site
  photoUrl?: string;
  academicStatus: string; // "Active", "Alumni", "Graduated"
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentCredential {
  id: string; // Document ID (matching uniqueId)
  uniqueId: string; // Unique student login ID
  studentId: string; // Linked Student document ID
  rollNumber: string;
  studentName: string;
  password: string; // Password (visible only to admin)
  course: 'UG NEP' | 'UG AEDP' | 'UG CBCS' | 'PG' | string;
  admissionYear: string; // e.g. "2026"
  createdAt: string;
  updatedAt?: string;
}

export interface Facility {
  id: string;
  name: string;
  category?: string;
  description: string;
  status?: string; // "Fully Operational", "Available", "Under Upgrade"
  equipment?: string;
  photoUrl: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  edition?: string;
  isbn?: string;
  subject: string; // "Algebra", "Real Analysis", "Calculus", etc.
  accessionNumber?: string;
  copies: number;
  status: 'Available' | 'Issued' | 'Reference Only';
  shelfRack?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  course?: 'UG' | 'PG' | string; // "UG" (B.Sc.) or "PG" (M.Sc.)
  paperCode: string;
  academicYear: string; // "2025–26", "2024–25", "2023–24"
  semester: string; // "Semester I", "Semester II", etc.
  yearLevel: string; // "1st Year", "2nd Year", "3rd Year"
  examination: string; // "Mid-Term Examination", "Semester End Examination"
  fileUrl: string;
  fileName?: string; // Original uploaded file name
  fileFormat?: string; // Original file extension / format (e.g. .pdf, .jpg, .png, .docx)
  fileSize?: string;
  uploadedByRole?: 'admin' | 'student';
  uploaderName?: string; // Name of uploading student (omitted or masked if uploaded by admin)
  uploaderBatch?: string; // Admission batch of uploading student (e.g. "2024 Admission Batch")
  uploaderStudentId?: string; // Student ID / Roll number of uploading student
  createdAt?: string;
  updatedAt?: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  category: 'Academic' | 'Examination' | 'Seminar' | 'Notice' | 'Scholarship';
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isImportant?: boolean;
  isArchived?: boolean;
  isDoingNow?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Committee {
  id: string;
  name: string;
  convener: string;
  members: string;
  designation: string;
  contactNumber?: string;
  email?: string;
  responsibilities: string;
  office: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportantContact {
  id: string;
  name: string;
  designation: string;
  office: string;
  phone: string;
  email: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status?: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface DepartmentSettings {
  id: string;
  facultyCount: number;
  studentCount: number;
  courseCount: number;
  bookCount: number;
  yearsOfService: number;
  studentPublicPrivacy: boolean; // if true, masks phone and address from public
  announcementMarquee: string;
  pyqUploadCode?: string; // Code for student question paper uploads (default 'Mathematics', editable by admin)
  logoUrl?: string; // Custom logo URL or data URI
  welcomeTitle?: string;
  welcomeDescription?: string;
  hodQuote?: string;
  adminId?: string;
  adminPassword?: string;
  updatedAt?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimeTablePeriod {
  id: string;
  periodNumber: number;
  label: string; // e.g. "Period I", "Period II", "Period V / Lab"
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "10:45 AM"
}

export interface TimeTableClassRow {
  id: string;
  course: 'UG NEP' | 'UG AEDP' | 'PG' | 'UG CBCS' | string;
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | string;
  semester: string; // e.g. "Semester I", "Semester II", etc.
  section?: string;
  label: string; // e.g. "UG NEP - 1st Year (Semester I)"
}

export interface TimeTableSlot {
  id: string;
  course: 'UG NEP' | 'UG AEDP' | 'PG' | 'UG CBCS' | string;
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | string;
  semester: string; // e.g. "Semester I", "Semester II", etc.
  dayOfWeek: DayOfWeek;
  periodNumber?: number; // 1 through 11
  spanPeriods?: number; // Number of consecutive periods/cells merged (e.g. 2 or 3 for practical labs)
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "10:45 AM"
  paperCode: string; // e.g. "MATH-CC-101"
  subjectName: string; // e.g. "Calculus & Geometry"
  roomNo: string; // e.g. "Room 104" or "Ramanujan Smart Classroom"
  facultyName: string; // e.g. "Mr. Mrutyunjay Malik (HoD)"
  type: 'Lecture' | 'Practical / Lab' | 'Tutorial' | 'Seminar';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SyllabusCategory = 'Major' | 'Minor' | 'MDC' | 'VAC' | 'SEC' | 'AEC' | 'None';

export interface Syllabus {
  id: string;
  course: 'UG NEP' | 'UG AEDP' | 'PG' | 'UG CBCS' | string;
  yearLevel?: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | string;
  semester?: string; // "Semester I", "Semester II", etc. or "All Semesters"
  session?: string; // e.g. "2025–26", "2024–25", "2026–27"
  admissionBatch?: string; // e.g. "2025–26", "2024–25", "2026–27"
  category?: SyllabusCategory | string; // 'Major' | 'Minor' | 'MDC' | 'VAC' | 'SEC' | 'AEC' | 'None'
  title?: string;
  paperCode?: string;
  academicYear?: string; // e.g. "2026–27"
  credits?: string | number;
  description?: string;
  units?: string[];
  recommendedBooks?: string;
  fileType?: 'url' | 'pdf';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  eventId: string;
  eventName: string;
  eventDate?: string;
  academicYear?: string;
  caption?: string;
  photoUrl: string; // Base64 data URL or secure image URL (strictly <= 500 KB)
  fileSizeBytes?: number;
  fileSizeFormatted?: string; // e.g. "245 KB"
  uploadedBy?: string;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export type DownloadCategory = 'Syllabus' | 'Routine' | 'Form' | 'Calendar' | 'Regulation';
export type DownloadCourseBadge = 'UG NEP' | 'UG CBCS' | 'PG' | 'All';

export interface DownloadItem {
  id: string;
  title: string;
  code?: string;
  category: DownloadCategory;
  courseBadge: DownloadCourseBadge;
  session: string;
  fileSize: string;
  description: string;
  fileUrl: string;
  fileName?: string; // Original uploaded file name
  fileFormat?: string; // Original file extension / format (e.g. .pdf, .jpg, .png, .docx)
  isImportant?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  year: number;
  month: number; // 0-11
  day: number;
  title: string;
  isHoliday: boolean;
  isDoingNow: boolean;
  source?: 'extracted' | 'custom' | 'faculty-leave';
  facultyName?: string;
  leaveType?: string;
  createdAt?: string;
  updatedAt?: string;
}


