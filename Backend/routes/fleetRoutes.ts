import { Router } from 'express';
import {
  getOnboardingApplicants,
  getApplicantDetails,
  updateApplicantStatus,
  submitVehicleInspection,
  getFleetZones,
  getFleetMetrics,
} from '../controllers/fleetController.js';

const router = Router();

// Fleet Metrics & Overview
router.get('/metrics', getFleetMetrics);
router.get('/zones', getFleetZones);

// Driver Onboarding Pipeline
router.get('/onboarding', getOnboardingApplicants);
router.get('/onboarding/:id', getApplicantDetails);
router.patch('/onboarding/:id', updateApplicantStatus);

// Safety & Inspections
router.post('/inspections', submitVehicleInspection);

export default router;
