import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
  getCommunityPosts,
  createCommunityPost,
  getCommunityProfiles,
  connectUserProfile,
  getUserConnections,
  getDirectMessages,
  sendDirectMessage,
} from '../controllers/communityController.js';

const router = Router();

// Community Ride Share Posts & Feed
router.get('/posts', getCommunityPosts);
router.post('/posts', auth, createCommunityPost);

// Member Profiles & Networking
router.get('/profiles', getCommunityProfiles);
router.post('/connect/:id', auth, connectUserProfile);
router.get('/connections', auth, getUserConnections);

// Direct Messaging & Inbox
router.get('/messages/:recipientId', auth, getDirectMessages);
router.post('/messages/:recipientId', auth, sendDirectMessage);

export default router;
