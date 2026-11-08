import { z } from 'zod';
import { UserRoleType } from './roles.js';
import { Gender, AdmissionStatus, AttendanceStatus, PaymentMethod, NoticeTarget } from './types.js';

// --- AUTH & USER SCHEMAS ---
export const LoginSchema = z.object({
  email: z.string().min(1, 'Email, phone number, or admission number is required').optional(),
  identifier: z.string().min(1).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  keepSessionActive: z.boolean().optional(),
}).refine((data) => Boolean((data.email && data.email.trim()) || (data.identifier && data.identifier.trim())), {
  message: 'Email, phone number, or admission number is required',
  path: ['email'],
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email, phone number, or admission number is required'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRoleType),
  isActive: z.boolean().default(true),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// --- ACADEMIC SETUP SCHEMAS ---
export const CreateAcademicYearSchema = z.object({
  name: z.string().min(1, 'Name is required (e.g., 2026-2027)'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isCurrent: z.boolean().default(false),
});
export type CreateAcademicYearInput = z.infer<typeof CreateAcademicYearSchema>;

export const CreateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required (e.g., Grade 10)'),
  code: z.string().min(1, 'Class code is required (e.g., G10)'),
  order: z.number().int().default(1),
});
export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const CreateSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required (e.g., A)'),
  classId: z.string().min(1, 'Class is required'),
  roomNumber: z.string().optional(),
  capacity: z.number().int().min(1).default(40),
  classTeacherId: z.string().optional(),
});
export type CreateSectionInput = z.infer<typeof CreateSectionSchema>;

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required (e.g., Mathematics)'),
  code: z.string().min(1, 'Subject code is required (e.g., MATH101)'),
  classId: z.string().min(1, 'Class is required'),
  isElective: z.boolean().default(false),
  creditHours: z.number().optional().default(1),
});
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;

export const CreateTeacherAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Teacher staff ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
});
export type CreateTeacherAssignmentInput = z.infer<typeof CreateTeacherAssignmentSchema>;

// --- ADMISSIONS SCHEMAS ---
export const CreateAdmissionApplicationSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Applied class is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().or(z.date()),
  gender: z.nativeEnum(Gender),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  bloodGroup: z.string().optional(),
  previousSchool: z.string().optional(),
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianRelation: z.string().min(1, 'Relation is required'),
  guardianPhone: z.string().min(1, 'Guardian phone is required'),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianOccupation: z.string().optional(),
});
export type CreateAdmissionApplicationInput = z.infer<typeof CreateAdmissionApplicationSchema>;

export const ReviewAdmissionSchema = z.object({
  status: z.nativeEnum(AdmissionStatus),
  reviewNotes: z.string().optional(),
  sectionId: z.string().optional(), // required if status is APPROVED or ENROLLED
});
export type ReviewAdmissionInput = z.infer<typeof ReviewAdmissionSchema>;

// --- SIS & STUDENT SCHEMAS ---
export const CreateStudentSchema = z.object({
  admissionNumber: z.string().min(1, 'Unique admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().or(z.date()),
  gender: z.nativeEnum(Gender),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalNotes: z.string().optional(),
  classId: z.string().min(1, 'Initial class is required'),
  sectionId: z.string().min(1, 'Initial section is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  guardians: z.array(z.object({
    name: z.string().min(1),
    relation: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    occupation: z.string().optional(),
    isPrimary: z.boolean().default(true),
  })).min(1, 'At least one guardian required'),
});
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const PromoteStudentSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Select at least one student'),
  targetAcademicYearId: z.string().min(1, 'Target academic year required'),
  targetClassId: z.string().min(1, 'Target class required'),
  targetSectionId: z.string().min(1, 'Target section required'),
});
export type PromoteStudentInput = z.infer<typeof PromoteStudentSchema>;

// --- ATTENDANCE SCHEMAS ---
export const MarkAttendanceItemSchema = z.object({
  studentId: z.string().min(1),
  status: z.nativeEnum(AttendanceStatus),
  remarks: z.string().optional(),
});

export const BulkAttendanceSchema = z.object({
  date: z.string().or(z.date()),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  periodNumber: z.number().int().optional(),
  records: z.array(MarkAttendanceItemSchema).min(1, 'Attendance list cannot be empty'),
});
export type BulkAttendanceInput = z.infer<typeof BulkAttendanceSchema>;

export const AttendanceCorrectionSchema = z.object({
  attendanceId: z.string().min(1),
  status: z.nativeEnum(AttendanceStatus),
  reason: z.string().min(3, 'Audit reason is required for correction'),
});
export type AttendanceCorrectionInput = z.infer<typeof AttendanceCorrectionSchema>;

// --- FEES SCHEMAS ---
export const FeeComponentSchema = z.object({
  name: z.string().min(1, 'Component name required (e.g., Tuition Fee)'),
  amount: z.number().positive('Amount must be positive'),
  isMandatory: z.boolean().default(true),
});

export const CreateFeeStructureSchema = z.object({
  name: z.string().min(1, 'Structure name required (e.g., Grade 10 Standard)'),
  classId: z.string().min(1, 'Class is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  components: z.array(FeeComponentSchema).min(1, 'At least one fee component required'),
});
export type CreateFeeStructureInput = z.infer<typeof CreateFeeStructureSchema>;

export const GenerateInvoiceSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  studentId: z.string().optional(), // if individual invoice
  feeStructureId: z.string().min(1),
  dueDate: z.string().or(z.date()),
  title: z.string().min(1, 'Invoice title required (e.g. Term 1 Fees)'),
});
export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().or(z.date()).optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const RecordSplitPaymentSchema = z.object({
  allocations: z
    .array(
      z.object({
        invoiceId: z.string().min(1, 'Invoice ID required'),
        amount: z.number().positive('Allocation amount must be greater than zero'),
      })
    )
    .min(1, 'At least one allocation required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().or(z.date()).optional(),
});
export type RecordSplitPaymentInput = z.infer<typeof RecordSplitPaymentSchema>;

// --- EXAMINATIONS SCHEMAS ---
export const CreateExaminationSchema = z.object({
  name: z.string().min(1, 'Exam name required (e.g. Mid-Term Examination)'),
  academicYearId: z.string().min(1),
  termId: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  subjects: z.array(z.object({
    subjectId: z.string().min(1),
    examDate: z.string().or(z.date()),
    maxMarks: z.number().positive().default(100),
    passingMarks: z.number().positive().default(35),
  })).min(1, 'At least one subject required'),
});
export type CreateExaminationInput = z.infer<typeof CreateExaminationSchema>;

export const RecordMarksSchema = z.object({
  examinationId: z.string().min(1),
  subjectId: z.string().min(1),
  marks: z.array(z.object({
    studentId: z.string().min(1),
    marksObtained: z.number().min(0),
    remarks: z.string().optional(),
  })).min(1, 'Marks entry cannot be empty'),
  isFinalSubmission: z.boolean().default(false),
});
export type RecordMarksInput = z.infer<typeof RecordMarksSchema>;

// --- COMMUNICATION SCHEMAS ---
export const CreateNoticeSchema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(1, 'Content required'),
  targetAudience: z.nativeEnum(NoticeTarget),
  targetClassId: z.string().optional(),
  targetSectionId: z.string().optional(),
  expiresAt: z.string().or(z.date()).optional(),
});
export type CreateNoticeInput = z.infer<typeof CreateNoticeSchema>;

export const SendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Recipient is required'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// --- TIMETABLE SCHEMAS ---
export const CreateTimetableEntrySchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  classroomId: z.string().optional().nullable(),
  dayOfWeek: z.number().int().min(1).max(7, 'Day of week must be between 1 (Monday) and 7 (Sunday)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'),
});
export type CreateTimetableEntryInput = z.infer<typeof CreateTimetableEntrySchema>;

export const CreateSubstitutionSchema = z.object({
  timetableEntryId: z.string().min(1, 'Timetable entry ID is required'),
  substituteTeacherId: z.string().min(1, 'Substitute teacher ID is required'),
  date: z.string().or(z.date()),
  reason: z.string().optional(),
});
export type CreateSubstitutionInput = z.infer<typeof CreateSubstitutionSchema>;

// --- LMS SCHEMAS ---
export const CreateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  dueDate: z.string().or(z.date()),
  maxMarks: z.number().min(1).optional().default(100),
  fileUrl: z.string().optional(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

export const SubmitAssignmentSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().optional(),
});
export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;

export const GradeSubmissionSchema = z.object({
  marksGiven: z.number().min(0, 'Marks cannot be negative'),
  feedback: z.string().optional(),
});
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionSchema>;

// --- STAFF, HR & PAYROLL SCHEMAS ---
export const CreateStaffSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  joiningDate: z.string().or(z.date()),
  qualification: z.string().optional(),
  basicSalary: z.number().min(0).default(0),
});
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

export const CreateLeaveRequestSchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().min(1, 'Reason is required'),
});
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;

export const ReviewLeaveRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type ReviewLeaveRequestInput = z.infer<typeof ReviewLeaveRequestSchema>;

export const MarkStaffAttendanceSchema = z.object({
  staffId: z.string().min(1, 'Staff ID is required'),
  date: z.string().or(z.date()),
  status: z.enum(['PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});
export type MarkStaffAttendanceInput = z.infer<typeof MarkStaffAttendanceSchema>;

export const GeneratePayslipSchema = z.object({
  staffId: z.string().min(1, 'Staff ID is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  basicSalary: z.number().min(0),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
});
export type GeneratePayslipInput = z.infer<typeof GeneratePayslipSchema>;

// --- LIBRARY SCHEMAS ---
export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  copiesCount: z.number().int().min(1).default(1),
});
export type CreateBookInput = z.infer<typeof CreateBookSchema>;

export const IssueBookSchema = z.object({
  copyId: z.string().min(1, 'Book copy ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  dueDate: z.string().or(z.date()),
});
export type IssueBookInput = z.infer<typeof IssueBookSchema>;

export const ReturnBookSchema = z.object({
  copyId: z.string().min(1, 'Copy ID is required'),
  fineAmount: z.number().min(0).optional().default(0),
});
export type ReturnBookInput = z.infer<typeof ReturnBookSchema>;

// --- TRANSPORT SCHEMAS ---
export const CreateVehicleSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle registration number is required'),
  driverName: z.string().min(1, 'Driver name is required'),
  driverPhone: z.string().min(1, 'Driver phone is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;

export const CreateTransportRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  vehicleId: z.string().optional().nullable(),
  stops: z.array(z.object({
    stopName: z.string().min(1),
    pickupTime: z.string(),
    dropTime: z.string(),
    fare: z.number().min(0).default(0),
    order: z.number().int().default(1),
  })).min(1, 'At least one stop is required'),
});
export type CreateTransportRouteInput = z.infer<typeof CreateTransportRouteSchema>;

export const AssignTransportSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  routeId: z.string().min(1, 'Route ID is required'),
  stopName: z.string().min(1, 'Stop name is required'),
});
export type AssignTransportInput = z.infer<typeof AssignTransportSchema>;

// --- INVENTORY SCHEMAS ---
export const CreateInventoryItemSchema = z.object({
  itemCode: z.string().min(1, 'Item code is required'),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().default('PCS'),
  minQuantity: z.number().int().min(0).default(5),
  quantity: z.number().int().min(0).default(0),
});
export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;

export const UpdateInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name cannot be empty').optional(),
  category: z.string().min(1, 'Category cannot be empty').optional(),
  unit: z.string().min(1).optional(),
  minQuantity: z.number().int().min(0).optional(),
});
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;

export const RecordInventoryMovementSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  reason: z.string().optional(),
});
export type RecordInventoryMovementInput = z.infer<typeof RecordInventoryMovementSchema>;

// --- ACCOUNTS & EXPENSES SCHEMAS ---
export const CreateExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  expenseDate: z.string().or(z.date()).optional(),
  paymentMode: z.string().default('BANK_TRANSFER'),
  receiptUrl: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

