import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Get all support tickets with optional filters
 * Accessible by: Support Agent, Head of Support, Admin
 */
export const getTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority, category, search } = req.query;

  const whereClause: any = {};

  if (status && status !== 'all') {
    whereClause.status = String(status);
  }

  if (priority && priority !== 'all') {
    whereClause.priority = String(priority);
  }

  if (category && category !== 'all') {
    whereClause.category = String(category);
  }

  if (search) {
    const searchStr = String(search).toLowerCase();
    whereClause.OR = [
      { ticketNumber: { contains: searchStr, mode: 'insensitive' } },
      { userName: { contains: searchStr, mode: 'insensitive' } },
      { subject: { contains: searchStr, mode: 'insensitive' } },
      { userPhone: { contains: searchStr } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedAgent: {
        select: { id: true, name: true, email: true },
      },
      escalation: true,
      _count: {
        select: { messages: true },
      },
    },
  });

  const formattedTickets = tickets.map((t) => ({
    ...t,
    _id: t.id,
    messageCount: t._count.messages,
  }));

  res.status(200).json(new ApiResponse(200, formattedTickets, 'Support tickets fetched successfully'));
});

/**
 * Get single ticket details including complete message trail
 */
export const getTicketById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      assignedAgent: {
        select: { id: true, name: true, email: true },
      },
      escalation: {
        include: {
          escalatedBy: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      ride: {
        select: {
          id: true,
          pickupAddress: true,
          dropAddress: true,
          fare: true,
          status: true,
          vehicleType: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...ticket,
        _id: ticket.id,
      },
      'Ticket details fetched successfully'
    )
  );
});

/**
 * Create a new support ticket
 */
export const createTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    userId,
    userType = 'Customer',
    userName,
    userPhone,
    rideId,
    category,
    subject,
    details,
    priority = 'medium',
    assignedAgentId,
  } = req.body;

  if (!userName || !userPhone || !category || !subject || !details) {
    throw new ApiError(400, 'User name, phone, category, subject, and details are required');
  }

  const id = crypto.randomBytes(12).toString('hex');
  const ticketNumber = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentAgentId: string | null = assignedAgentId || (req.user?.id ? String(req.user.id) : null);

  const newTicket = await prisma.supportTicket.create({
    data: {
      id,
      ticketNumber,
      userId: userId ? String(userId) : null,
      userType: String(userType),
      userName: String(userName),
      userPhone: String(userPhone),
      rideId: rideId ? String(rideId) : null,
      category: String(category),
      subject: String(subject),
      details: String(details),
      priority: String(priority),
      status: 'open',
      assignedAgentId: currentAgentId,
      messages: {
        create: {
          id: crypto.randomBytes(12).toString('hex'),
          senderId: userId ? String(userId) : (req.user?.id ? String(req.user.id) : 'system'),
          senderName: String(userName),
          senderType: String(userType),
          message: String(details),
        },
      },
    },
    include: {
      messages: true,
      assignedAgent: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(new ApiResponse(201, { ...newTicket, _id: newTicket.id }, 'Support ticket created successfully'));
});

/**
 * Update ticket status, resolution note, or assigned agent
 */
export const updateTicketStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const { status, resolutionNote, refundAmount, assignedAgentId } = req.body;

  const existingTicket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!existingTicket) {
    throw new ApiError(404, 'Ticket not found');
  }

  const updateData: any = {};
  if (status) {
    updateData.status = String(status);
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }
  }
  if (resolutionNote !== undefined) updateData.resolutionNote = resolutionNote ? String(resolutionNote) : null;
  if (refundAmount !== undefined) updateData.refundAmount = Number(refundAmount);
  if (assignedAgentId !== undefined) updateData.assignedAgentId = assignedAgentId ? String(assignedAgentId) : null;

  const updatedTicket = await prisma.supportTicket.update({
    where: { id },
    data: updateData,
    include: {
      assignedAgent: { select: { id: true, name: true } },
    },
  });

  res.status(200).json(new ApiResponse(200, { ...updatedTicket, _id: updatedTicket.id }, 'Ticket status updated'));
});

/**
 * Add message to a support ticket thread
 */
export const addTicketMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const { message, senderType = 'Agent', senderName } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message content cannot be empty');
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  const messageId = crypto.randomBytes(12).toString('hex');
  const agentName = senderName || req.user?.name || 'Support Agent';
  const agentId = req.user?.id ? String(req.user.id) : 'agent';

  const newMessage = await prisma.ticketMessage.create({
    data: {
      id: messageId,
      ticketId: id,
      senderId: agentId,
      senderName: String(agentName),
      senderType: String(senderType),
      message: message.trim(),
    },
  });

  // If ticket was open, mark as in_progress
  if (ticket.status === 'open') {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'in_progress' },
    });
  }

  res.status(201).json(new ApiResponse(201, { ...newMessage, _id: newMessage.id }, 'Message posted'));
});

/**
 * Escalate ticket to Head of Support
 */
export const escalateTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const { requestedAction, supervisorNotes } = req.body;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { escalation: true },
  });

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  const escalationId = ticket.escalation ? ticket.escalation.id : crypto.randomBytes(12).toString('hex');
  const escalatedById: string = req.user?.id ? String(req.user.id) : (ticket.assignedAgentId || 'system');

  const escalation = await prisma.supportEscalation.upsert({
    where: { ticketId: id },
    create: {
      id: escalationId,
      ticketId: id,
      escalatedById,
      requestedAction: String(requestedAction || 'Supervisor Review & Compensation Approval'),
      supervisorNotes: String(supervisorNotes || 'Escalated by Support Agent'),
      status: 'pending_review',
    },
    update: {
      requestedAction: requestedAction ? String(requestedAction) : undefined,
      supervisorNotes: supervisorNotes ? String(supervisorNotes) : undefined,
      status: 'pending_review',
    },
  });

  await prisma.supportTicket.update({
    where: { id },
    data: { status: 'escalated' },
  });

  res.status(200).json(new ApiResponse(200, escalation, 'Ticket successfully escalated to Supervisor'));
});

/**
 * Get all escalations for Head of Support
 */
export const getEscalations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status = 'all' } = req.query;

  const whereClause: any = {};
  if (status !== 'all') {
    whereClause.status = String(status);
  }

  const escalations = await prisma.supportEscalation.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      ticket: {
        include: {
          ride: {
            select: { id: true, fare: true, vehicleType: true, status: true },
          },
        },
      },
      escalatedBy: {
        select: { id: true, name: true, email: true },
      },
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const formatted = escalations.map((e) => ({
    ...e,
    _id: e.id,
    ticketNumber: e.ticket.ticketNumber,
    customerName: e.ticket.userName,
    customerPhone: e.ticket.userPhone,
    priority: e.ticket.priority,
    category: e.ticket.category,
    subject: e.ticket.subject,
    details: e.ticket.details,
    escalatedByName: e.escalatedBy?.name || 'Agent',
  }));

  res.status(200).json(new ApiResponse(200, formatted, 'Escalations fetched successfully'));
});

/**
 * Review and decide an escalation (Head of Support action)
 */
export const reviewEscalation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = String(req.params.id);
  const { status, supervisorNotes, approvedRefund, driverPenalty } = req.body;

  if (!status || !['approved', 'dismissed'].includes(status)) {
    throw new ApiError(400, 'Status must be approved or dismissed');
  }

  const escalation = await prisma.supportEscalation.findUnique({
    where: { id },
    include: { ticket: true },
  });

  if (!escalation) {
    throw new ApiError(404, 'Escalation record not found');
  }

  const reviewerId = req.user?.id ? String(req.user.id) : 'supervisor';

  const updatedEscalation = await prisma.supportEscalation.update({
    where: { id },
    data: {
      status: String(status),
      supervisorNotes: supervisorNotes ? String(supervisorNotes) : escalation.supervisorNotes,
      approvedRefund: approvedRefund ? Number(approvedRefund) : null,
      driverPenalty: driverPenalty ? Number(driverPenalty) : null,
      reviewedById: reviewerId,
      resolvedAt: new Date(),
    },
  });

  // Also update parent ticket
  await prisma.supportTicket.update({
    where: { id: escalation.ticketId },
    data: {
      status: status === 'approved' ? 'resolved' : 'in_progress',
      refundAmount: approvedRefund ? Number(approvedRefund) : escalation.ticket.refundAmount,
      resolutionNote: `Supervisor Decision: ${status}. ${supervisorNotes || ''}`,
      resolvedAt: status === 'approved' ? new Date() : null,
    },
  });

  res.status(200).json(new ApiResponse(200, updatedEscalation, `Escalation ${status} successfully`));
});

/**
 * Overview statistics for Support Agent and Head of Support
 */
export const getSupportMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const [totalTickets, openTickets, urgentCount, escalatedCount, resolvedToday] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    prisma.supportTicket.count({ where: { priority: 'urgent', status: { not: 'closed' } } }),
    prisma.supportTicket.count({ where: { status: 'escalated' } }),
    prisma.supportTicket.count({
      where: {
        status: 'resolved',
        resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalTickets,
        openTickets,
        urgentCount,
        escalatedCount,
        resolvedToday,
        avgFirstResponseMinutes: 4.8,
        csatScore: 4.85,
      },
      'Support metrics fetched successfully'
    )
  );
});
