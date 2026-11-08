import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './services/prisma.js';

// Import route modules
import authRoutes from './modules/auth/auth.routes.js';
import academicRoutes from './modules/academics/academics.routes.js';
import admissionsRoutes from './modules/admissions/admissions.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import feesRoutes from './modules/fees/fees.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import timetableRoutes from './modules/timetable/timetable.routes.js';
import examRoutes from './modules/exams/exams.routes.js';
import lmsRoutes from './modules/lms/lms.routes.js';
import communicationRoutes from './modules/communication/communication.routes.js';
import staffRoutes from './modules/staff/staff.routes.js';
import libraryRoutes from './modules/library/library.routes.js';
import transportRoutes from './modules/transport/transport.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import accountsRoutes from './modules/accounts/accounts.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';

export const createApp = (): Express => {
  const app = express();

  // 1. Security & Core Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Idempotency-Key'],
      exposedHeaders: ['X-Idempotent-Replay'],
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (config.env === 'development') {
    app.use(morgan('dev'));
  }

  // 2. Health & Verification Endpoint
  app.get(`${config.apiPrefix}/health`, async (_req: Request, res: Response) => {
    let dbStatus = 'connected';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    return res.status(200).json({
      status: 'ok',
      service: 'School ERP Modular Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: config.env,
    });
  });

  // 3. API V1 Routes
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/academics`, academicRoutes);
  app.use(`${config.apiPrefix}/admissions`, admissionsRoutes);
  app.use(`${config.apiPrefix}/students`, studentsRoutes);
  app.use(`${config.apiPrefix}/attendance`, attendanceRoutes);
  app.use(`${config.apiPrefix}/fees`, feesRoutes);
  app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${config.apiPrefix}/timetable`, timetableRoutes);
  app.use(`${config.apiPrefix}/exams`, examRoutes);
  app.use(`${config.apiPrefix}/lms`, lmsRoutes);
  app.use(`${config.apiPrefix}/communication`, communicationRoutes);
  app.use(`${config.apiPrefix}/staff`, staffRoutes);
  app.use(`${config.apiPrefix}/library`, libraryRoutes);
  app.use(`${config.apiPrefix}/transport`, transportRoutes);
  app.use(`${config.apiPrefix}/inventory`, inventoryRoutes);
  app.use(`${config.apiPrefix}/accounts`, accountsRoutes);
  app.use(`${config.apiPrefix}/users`, usersRoutes);
  app.use(`${config.apiPrefix}/audit`, auditRoutes);
  app.use(`${config.apiPrefix}/notifications`, notificationRoutes);

  // 4. Fallback 404 handler
  app.use((_req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'The requested API route does not exist.',
    });
  });

  // 5. Centralized Error Handler
  app.use(errorHandler);

  return app;
};
