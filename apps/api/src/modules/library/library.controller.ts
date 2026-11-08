import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateBookInput,
  IssueBookInput,
  ReturnBookInput,
} from '@school-erp/shared';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get Library Books catalog with copy availability
 */
export async function getBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, category } = req.query;

    const where: any = {};
    if (category) where.category = String(category);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { author: { contains: String(search), mode: 'insensitive' } },
        { isbn: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        copies: true,
      },
      orderBy: { title: 'asc' },
    });

    const catalog = books.map((b) => {
      const totalCopies = b.copies.length;
      const availableCopies = b.copies.filter((c) => c.status === 'AVAILABLE').length;
      return {
        ...b,
        totalCopies,
        availableCopies,
      };
    });

    return res.status(200).json({
      success: true,
      data: catalog,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Add a new Book with auto-generated barcode copies
 */
export async function createBook(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateBookInput = req.body;
    const copiesCount = input.copiesCount || 1;

    const book = await prisma.book.create({
      data: {
        title: input.title,
        author: input.author,
        isbn: input.isbn || null,
        category: input.category,
        publisher: input.publisher || null,
        edition: input.edition || null,
      },
    });

    // Create copies with barcodes
    const timestamp = Date.now().toString().slice(-6);
    const copiesData = Array.from({ length: copiesCount }).map((_, idx) => ({
      bookId: book.id,
      barcode: `BC-${timestamp}-${idx + 1}`,
      status: 'AVAILABLE',
    }));

    await prisma.bookCopy.createMany({
      data: copiesData,
    });

    const createdCopies = await prisma.bookCopy.findMany({
      where: { bookId: book.id },
    });

    return res.status(201).json({
      success: true,
      message: `Book added with ${copiesCount} circulation copies.`,
      data: {
        ...book,
        copies: createdCopies,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Issue a Book copy to student
 */
export async function issueBook(req: Request, res: Response, next: NextFunction) {
  try {
    const input: IssueBookInput = req.body;

    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const issue = await prisma.$transaction(async (tx) => {
      // Atomic Compare-And-Swap: lock and transition status ONLY if currently AVAILABLE
      const updateResult = await tx.bookCopy.updateMany({
        where: { id: input.copyId, status: 'AVAILABLE' },
        data: { status: 'ISSUED' },
      });

      if (updateResult.count === 0) {
        throw new AppError(
          'This book copy is no longer available or was just issued to another borrower.',
          409,
          'RESOURCE_LOCKED'
        );
      }

      const copyWithBook = await tx.bookCopy.findUnique({
        where: { id: input.copyId },
        include: { book: true },
      });

      const newIssue = await tx.bookIssue.create({
        data: {
          copyId: input.copyId,
          studentId: student.id,
          issueDate: new Date(),
          dueDate: new Date(input.dueDate),
          status: 'ISSUED',
        },
        include: {
          copy: { include: { book: true } },
          student: true,
        },
      });

      return { issue: newIssue, title: copyWithBook?.book.title || 'Book' };
    });

    return res.status(201).json({
      success: true,
      message: `Book '${issue.title}' issued to ${student.firstName} ${student.lastName}.`,
      data: issue.issue,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Return an Issued Book
 */
export async function returnBook(req: Request, res: Response, next: NextFunction) {
  try {
    const input: ReturnBookInput = req.body;

    const activeIssue = await prisma.bookIssue.findFirst({
      where: {
        copyId: input.copyId,
        status: { in: ['ISSUED', 'OVERDUE'] },
      },
      include: { copy: { include: { book: true } }, student: true },
    });

    if (!activeIssue) {
      return res.status(404).json({
        success: false,
        message: 'No active issue record found for this book copy.',
      });
    }

    const today = new Date();
    let calculatedFine = input.fineAmount || 0;

    // If fine wasn't specified and overdue, calculate ₹5/day
    if (calculatedFine === 0 && today > activeIssue.dueDate) {
      const diffDays = Math.ceil((today.getTime() - activeIssue.dueDate.getTime()) / (1000 * 3600 * 24));
      calculatedFine = diffDays * 5;
    }

    const returnedRecord = await prisma.$transaction(async (tx) => {
      await tx.bookCopy.update({
        where: { id: input.copyId },
        data: { status: 'AVAILABLE' },
      });

      return tx.bookIssue.update({
        where: { id: activeIssue.id },
        data: {
          returnDate: today,
          status: 'RETURNED',
          fineAmount: new Decimal(calculatedFine),
        },
        include: {
          copy: { include: { book: true } },
          student: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Book returned successfully. Overdue fine: ₹${calculatedFine}.`,
      data: returnedRecord,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Book Issue Records & Overdue list
 */
export async function getBookIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, studentId } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (studentId) where.studentId = String(studentId);

    // Scoping for Student and Parent
    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where.studentId = req.user.studentId;
    }

    if (req.user?.role === 'PARENT') {
      if (!req.user.guardianId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where.student = {
        guardians: { some: { guardianId: req.user.guardianId } },
      };
    }

    const issues = await prisma.bookIssue.findMany({
      where,
      include: {
        copy: { include: { book: true } },
        student: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error) {
    return next(error);
  }
}
