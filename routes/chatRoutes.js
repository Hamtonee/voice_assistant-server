import express from 'express';
import auth from '../middleware/auth.js';
import {
  listChats,
  getChat,
  createChat,
  createScenarioChat,
  createFeatureChat,
  addMessage,
  updateTitle,
  deleteChat
} from '../controllers/chatController.js';
import { generateChatTitle } from '../controllers/chatTitleController.js';

const router = express.Router();

// Protect all routes
router.use(auth);

// Chat list & single fetch
router.get('/', listChats);
router.get('/:id', getChat);

// Chat creation routes
router.post('/', createChat);
router.post('/scenario', createScenarioChat);
router.post('/feature', createFeatureChat);

// Title generation route
router.post('/chat-title', generateChatTitle);

// Add new message
router.post('/:id/messages', addMessage);

// Update chat title
router.put('/:id/rename', updateTitle);

// Delete a chat
router.delete('/:id', deleteChat);

export default router;
