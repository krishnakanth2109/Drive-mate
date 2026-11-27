import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  addTicketMessage,
  escalateTicket,
  getEscalations,
  reviewEscalation,
  getSupportMetrics,
  getSupportFaqs,
} from '../controllers/supportController.js';

const router = Router();

// Support Metrics & FAQs
router.get('/metrics', getSupportMetrics);
router.get('/faqs', getSupportFaqs);

// Ticket Management
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id', getTicketById);
router.patch('/tickets/:id', updateTicketStatus);
router.post('/tickets/:id/messages', addTicketMessage);
router.post('/tickets/:id/escalate', escalateTicket);

// Supervisor Escalations
router.get('/escalations', getEscalations);
router.post('/escalations/:id/review', reviewEscalation);

export default router;
