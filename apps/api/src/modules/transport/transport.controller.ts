import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateVehicleInput,
  CreateTransportRouteInput,
  AssignTransportInput,
} from '@school-erp/shared';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get Vehicles
 */
export async function getVehicles(_req: Request, res: Response, next: NextFunction) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        routes: true,
      },
      orderBy: { vehicleNumber: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create Vehicle
 */
export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateVehicleInput = req.body;

    const existing = await prisma.vehicle.findUnique({
      where: { vehicleNumber: input.vehicleNumber },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this registration number already exists.',
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber: input.vehicleNumber,
        driverName: input.driverName,
        driverPhone: input.driverPhone,
        capacity: input.capacity,
        status: 'ACTIVE',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: vehicle,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Routes with stops and student occupancy
 */
export async function getRoutes(_req: Request, res: Response, next: NextFunction) {
  try {
    const routes = await prisma.transportRoute.findMany({
      include: {
        vehicle: true,
        stops: { orderBy: { order: 'asc' } },
        assignments: {
          include: {
            student: {
              include: {
                enrolments: {
                  where: { status: 'ACTIVE' },
                  include: { class: true, section: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = routes.map((r) => ({
      ...r,
      studentCount: r.assignments.length,
      availableCapacity: r.vehicle ? Math.max(0, r.vehicle.capacity - r.assignments.length) : null,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Create Transport Route with Stops
 */
export async function createRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateTransportRouteInput = req.body;

    const route = await prisma.transportRoute.create({
      data: {
        name: input.name,
        vehicleId: input.vehicleId || null,
        stops: {
          create: input.stops.map((s, idx) => ({
            stopName: s.stopName,
            pickupTime: s.pickupTime,
            dropTime: s.dropTime,
            fare: new Decimal(s.fare || 0),
            order: s.order || idx + 1,
          })),
        },
      },
      include: {
        vehicle: true,
        stops: { orderBy: { order: 'asc' } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Transport route created successfully.',
      data: route,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Assign Student to Route and Stop with Capacity Validation
 */
export async function assignStudentTransport(req: Request, res: Response, next: NextFunction) {
  try {
    const input: AssignTransportInput = req.body;

    const assignment = await prisma.$transaction(async (tx) => {
      const route = await tx.transportRoute.findUnique({
        where: { id: input.routeId },
        include: { vehicle: true },
      });

      if (!route) {
        throw new AppError('Transport route not found.', 404, 'NOT_FOUND');
      }

      if (route.vehicle) {
        const currentCount = await tx.studentTransportAssignment.count({
          where: {
            routeId: input.routeId,
            studentId: { not: input.studentId },
          },
        });

        if (currentCount >= route.vehicle.capacity) {
          throw new AppError(
            `Vehicle ${route.vehicle.vehicleNumber} has reached its physical capacity limit (${route.vehicle.capacity} seats).`,
            409,
            'CAPACITY_EXCEEDED'
          );
        }
      }

      return tx.studentTransportAssignment.upsert({
        where: { studentId: input.studentId },
        update: {
          routeId: input.routeId,
          stopName: input.stopName,
        },
        create: {
          studentId: input.studentId,
          routeId: input.routeId,
          stopName: input.stopName,
        },
        include: {
          route: { include: { vehicle: true } },
          student: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `Transport assigned: ${assignment.student.firstName} allocated to ${assignment.route.name} at stop ${assignment.stopName}.`,
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Remove Student Transport Assignment
 */
export async function removeStudentTransport(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = String(req.params.studentId);

    await prisma.studentTransportAssignment.deleteMany({
      where: { studentId },
    });

    return res.status(200).json({
      success: true,
      message: 'Transport allocation cancelled.',
    });
  } catch (error) {
    return next(error);
  }
}
