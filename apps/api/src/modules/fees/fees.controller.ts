import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { Prisma } from '@prisma/client';
import {
  CreateFeeStructureInput,
  GenerateInvoiceInput,
  RecordPaymentInput,
  RecordSplitPaymentInput,
  InvoiceStatus,
} from '@school-erp/shared';

export async function getFeeStructures(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, academicYearId } = req.query;
    const structures = await prisma.feeStructure.findMany({
      where: {
        ...(classId && { classId: String(classId) }),
        ...(academicYearId && { academicYearId: String(academicYearId) }),
      },
      include: {
        class: true,
        academicYear: true,
        components: true,
      },
    });
    return res.json({ success: true, data: structures });
  } catch (error) {
    next(error);
  }
}

export async function createFeeStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const data: CreateFeeStructureInput = req.body;
    const totalAmount = data.components.reduce((acc, c) => acc + c.amount, 0);

    const structure = await prisma.feeStructure.create({
      data: {
        name: data.name,
        classId: data.classId,
        academicYearId: data.academicYearId,
        totalAmount: new Prisma.Decimal(totalAmount),
        components: {
          create: data.components.map((c) => ({
            name: c.name,
            amount: new Prisma.Decimal(c.amount),
            isMandatory: c.isMandatory !== undefined ? c.isMandatory : true,
          })),
        },
      },
      include: { components: true },
    });

    return res.status(201).json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, status, academicYearId, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const take = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status) where.status = String(status);
    if (academicYearId) where.academicYearId = String(academicYearId);
    if (studentId) where.studentId = String(studentId);

    const searchStr = search ? String(search).trim() : '';
    if (searchStr) {
      where.OR = [
        { invoiceNumber: { contains: searchStr, mode: 'insensitive' } },
        { title: { contains: searchStr, mode: 'insensitive' } },
        { student: { admissionNumber: { contains: searchStr, mode: 'insensitive' } } },
        { student: { firstName: { contains: searchStr, mode: 'insensitive' } } },
        { student: { lastName: { contains: searchStr, mode: 'insensitive' } } },
        { student: { guardians: { some: { guardian: { phone: { contains: searchStr, mode: 'insensitive' } } } } } },
        { student: { guardians: { some: { guardian: { name: { contains: searchStr, mode: 'insensitive' } } } } } },
      ];
    }

    // Parent scoping
    if (req.user?.role === 'PARENT') {
      if (!req.user.guardianId) {
        return res.json({ success: true, data: [], meta: { total: 0, page: pageNum, limit: take, totalPages: 0 } });
      }
      where.student = {
        guardians: { some: { guardianId: req.user.guardianId } },
      };
    }

    // Student scoping
    if (req.user?.role === 'STUDENT') {
      if (!req.user.studentId) {
        return res.json({ success: true, data: [], meta: { total: 0, page: pageNum, limit: take, totalPages: 0 } });
      }
      where.studentId = req.user.studentId;
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          student: true,
          feeStructure: true,
          payments: true,
          lines: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: invoices,
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function generateInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const data: GenerateInvoiceInput = req.body;

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: data.feeStructureId },
      include: { components: true },
    });

    if (!feeStructure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found.' });
    }

    // Determine target students
    let studentIds: string[] = [];
    if (data.studentId) {
      studentIds = [data.studentId];
    } else {
      const enrolments = await prisma.enrolment.findMany({
        where: {
          academicYearId: data.academicYearId,
          ...(data.classId && { classId: data.classId }),
          ...(data.sectionId && { sectionId: data.sectionId }),
          status: 'ACTIVE',
        },
        select: { studentId: true },
      });
      studentIds = enrolments.map((e) => e.studentId);
    }

    if (studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active enrolled students found for the selected criteria.',
      });
    }

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();

    const createdInvoices = await prisma.$transaction(async (tx) => {
      const list = [];
      let currentNumber = count + 1;

      for (const sId of studentIds) {
        // Prevent duplicate invoice generation for the same student, academic year, and fee plan
        const existing = await tx.invoice.findFirst({
          where: {
            studentId: sId,
            academicYearId: data.academicYearId,
            feeStructureId: data.feeStructureId,
            title: data.title,
          },
        });
        if (existing) continue;

        const invoiceNumber = `INV-${year}-${String(currentNumber++).padStart(5, '0')}`;
        const total = feeStructure.totalAmount;

        const inv = await tx.invoice.create({
          data: {
            invoiceNumber,
            studentId: sId,
            academicYearId: data.academicYearId,
            feeStructureId: data.feeStructureId,
            title: data.title,
            dueDate: new Date(data.dueDate),
            subtotal: total,
            totalAmount: total,
            balance: total,
            paidAmount: new Prisma.Decimal(0.0),
            status: InvoiceStatus.UNPAID,
            lines: {
              create: feeStructure.components.map((c) => ({
                description: c.name,
                amount: c.amount,
              })),
            },
          },
          include: { lines: true },
        });
        list.push(inv);
      }

      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'INVOICES_GENERATED',
          entity: 'Invoice',
          metadata: { count: list.length, feeStructureId: data.feeStructureId },
        },
      });

      return list;
    });

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${createdInvoices.length} invoices.`,
      count: createdInvoices.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data: RecordPaymentInput = req.body;
    const paymentAmount = new Prisma.Decimal(data.amount);

    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { student: true },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (paymentAmount.greaterThan(invoice.balance)) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds invoice outstanding balance (${invoice.balance}).`,
      });
    }

    const year = new Date().getFullYear();
    const paymentCount = await prisma.payment.count();
    const receiptNumber = `REC-${year}-${String(paymentCount + 1).padStart(5, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
          paidAt: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          collectedById: req.user?.staffId || null,
        },
      });

      // 2. Update invoice balance and status
      const newPaidAmount = invoice.paidAmount.add(paymentAmount);
      const newBalance = invoice.totalAmount.sub(newPaidAmount);
      const newStatus = newBalance.isZero()
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIALLY_PAID;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
        },
      });

      // 3. Record audit log
      await tx.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'FEE_PAYMENT_COLLECTED',
          entity: 'Payment',
          entityId: payment.id,
          metadata: {
            receiptNumber,
            invoiceNumber: invoice.invoiceNumber,
            amount: data.amount,
            method: data.paymentMethod,
            studentAdmissionNo: invoice.student.admissionNumber,
          },
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully and receipt issued.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHouseholdBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const { search } = req.query;
    if (!search || !String(search).trim()) {
      return res.json({ success: true, data: [] });
    }
    const searchStr = String(search).trim();

    // Find guardians matching name, phone, or linked student details
    const guardians = await prisma.guardian.findMany({
      where: {
        OR: [
          { phone: { contains: searchStr, mode: 'insensitive' } },
          { name: { contains: searchStr, mode: 'insensitive' } },
          {
            students: {
              some: {
                student: {
                  OR: [
                    { admissionNumber: { contains: searchStr, mode: 'insensitive' } },
                    { firstName: { contains: searchStr, mode: 'insensitive' } },
                    { lastName: { contains: searchStr, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ],
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrolments: {
                  where: { status: 'ACTIVE' },
                  include: { class: true, section: true },
                  take: 1,
                },
                invoices: {
                  where: {
                    status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
                  },
                  orderBy: { dueDate: 'asc' },
                  include: {
                    lines: true,
                    payments: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const results = guardians.map((g) => {
      let totalHouseholdBalance = 0;
      let totalHouseholdBilled = 0;
      let totalHouseholdPaid = 0;

      const siblings = g.students.map((sg) => {
        const s = sg.student;
        const currentEnrolment = s.enrolments[0] || null;
        const unpaidInvoices = s.invoices;

        const studentBilled = unpaidInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
        const studentPaid = unpaidInvoices.reduce((acc, inv) => acc + Number(inv.paidAmount), 0);
        const studentBalance = unpaidInvoices.reduce((acc, inv) => acc + Number(inv.balance), 0);

        totalHouseholdBilled += studentBilled;
        totalHouseholdPaid += studentPaid;
        totalHouseholdBalance += studentBalance;

        return {
          studentId: s.id,
          admissionNumber: s.admissionNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          className: currentEnrolment?.class?.name || 'Unassigned',
          sectionName: currentEnrolment?.section?.name || '-',
          isPrimary: sg.isPrimary,
          invoices: unpaidInvoices,
          studentBilled,
          studentPaid,
          studentBalance,
        };
      });

      return {
        guardianId: g.id,
        guardianName: g.name,
        relation: g.relation,
        phone: g.phone,
        email: g.email,
        siblings,
        totalHouseholdBilled,
        totalHouseholdPaid,
        totalHouseholdBalance,
      };
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}

export async function recordSplitPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data: RecordSplitPaymentInput = req.body;
    const year = new Date().getFullYear();

    const result = await prisma.$transaction(async (tx) => {
      const processedPayments = [];
      let paymentCount = await tx.payment.count();

      for (const alloc of data.allocations) {
        const allocAmount = new Prisma.Decimal(alloc.amount);
        if (allocAmount.lessThanOrEqualTo(0)) continue;

        const invoice = await tx.invoice.findUnique({
          where: { id: alloc.invoiceId },
          include: { student: true },
        });

        if (!invoice) {
          throw new Error(`Invoice ID ${alloc.invoiceId} not found.`);
        }

        if (allocAmount.greaterThan(invoice.balance)) {
          throw new Error(
            `Split amount (${allocAmount}) exceeds invoice ${invoice.invoiceNumber} balance (${invoice.balance}).`
          );
        }

        paymentCount += 1;
        const receiptNumber = `REC-${year}-${String(paymentCount).padStart(5, '0')}`;

        const payment = await tx.payment.create({
          data: {
            receiptNumber,
            invoiceId: invoice.id,
            amount: allocAmount,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber || null,
            notes: data.notes || 'Household Split Payment',
            paidAt: data.paymentDate ? new Date(data.paymentDate) : new Date(),
            collectedById: req.user?.staffId || null,
          },
          include: { invoice: { include: { student: true } } },
        });

        const newPaidAmount = invoice.paidAmount.add(allocAmount);
        const newBalance = invoice.totalAmount.sub(newPaidAmount);
        const newStatus = newBalance.isZero()
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID;

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: req.user?.id,
            action: 'FEE_SPLIT_PAYMENT_COLLECTED',
            entity: 'Payment',
            entityId: payment.id,
            metadata: {
              receiptNumber,
              invoiceNumber: invoice.invoiceNumber,
              amount: alloc.amount,
              method: data.paymentMethod,
              studentAdmissionNo: invoice.student.admissionNumber,
            },
          },
        });

        processedPayments.push({ payment, invoice: updatedInvoice });
      }

      return processedPayments;
    });

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${result.length} split payments.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
