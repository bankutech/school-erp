import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { CreateExpenseInput } from '@school-erp/shared';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get School Expenses
 */
export async function getExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, startDate, endDate } = req.query;

    const where: any = {};
    if (category) where.category = String(category);
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(String(startDate));
      if (endDate) where.expenseDate.lte = new Date(String(endDate));
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return res.status(200).json({
      success: true,
      totalExpense,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create School Expense
 */
export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateExpenseInput = req.body;

    if (input.amount <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be greater than zero.' });
    }

    const expense = await prisma.expense.create({
      data: {
        category: input.category,
        title: input.title,
        amount: new Decimal(input.amount),
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
        paymentMode: input.paymentMode || 'BANK_TRANSFER',
        receiptUrl: input.receiptUrl || null,
        remarks: input.remarks || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      data: expense,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Comprehensive Financial Summary & Ledger
 */
export async function getFinancialSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Total fee income collected
    const paymentAggregate = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalFeeIncome = Number(paymentAggregate._sum.amount || 0);

    // 2. Total pending fee dues
    const invoiceAggregate = await prisma.invoice.aggregate({
      _sum: { balance: true, totalAmount: true },
      _count: { id: true },
    });
    const totalOutstandingDues = Number(invoiceAggregate._sum.balance || 0);
    const totalBilled = Number(invoiceAggregate._sum.totalAmount || 0);

    // 3. Total expenses
    const expenseAggregate = await prisma.expense.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    });
    const totalExpenses = Number(expenseAggregate._sum.amount || 0);

    // 4. Net operational surplus
    const netSurplus = totalFeeIncome - totalExpenses;

    // 5. Category-wise expense breakdown
    const expenses = await prisma.expense.findMany();
    const categoryMap: Record<string, number> = {};
    for (const exp of expenses) {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + Number(exp.amount);
    }

    const expenseBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalFeeIncome,
        totalOutstandingDues,
        totalBilled,
        totalExpenses,
        netSurplus,
        collectionRate: totalBilled > 0 ? ((totalFeeIncome / totalBilled) * 100).toFixed(1) : 0,
        expenseBreakdown,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Export Students as CSV
 */
export async function exportStudentsCsv(_req: Request, res: Response, next: NextFunction) {
  try {
    const students = await prisma.student.findMany({
      include: {
        enrolments: {
          where: { status: 'ACTIVE' },
          include: { class: true, section: true },
        },
        guardians: {
          include: { guardian: true },
        },
      },
      orderBy: { admissionNumber: 'asc' },
    });

    let csv = 'Admission No,First Name,Last Name,Gender,Class,Section,Guardian Name,Guardian Phone,Email\n';
    for (const s of students) {
      const enr = s.enrolments[0];
      const g = s.guardians[0]?.guardian;
      csv += `"${s.admissionNumber}","${s.firstName}","${s.lastName}","${s.gender}","${enr?.class?.name || ''}","${enr?.section?.name || ''}","${g?.name || ''}","${g?.phone || ''}","${s.email || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students-directory.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
}

/**
 * Export Fee Collections as CSV
 */
export async function exportFeeCollectionsCsv(_req: Request, res: Response, next: NextFunction) {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    let csv = 'Receipt No,Invoice No,Student Name,Admission No,Amount,Payment Method,Reference No,Date\n';
    for (const p of payments) {
      const student = p.invoice?.student;
      csv += `"${p.receiptNumber}","${p.invoice?.invoiceNumber || ''}","${student ? student.firstName + ' ' + student.lastName : ''}","${student?.admissionNumber || ''}","${p.amount}","${p.paymentMethod}","${p.referenceNumber || ''}","${p.paidAt.toISOString().split('T')[0]}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fee-collections.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
}
