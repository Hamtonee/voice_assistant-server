// server/routes/chatRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import {
  listChats,
  getChat,
  createChat,
  createScenarioChat,
  createFeatureChat, // ← for 'sema' or 'tusome'
  addMessage,
  updateChat,
  updateTitle,
  deleteChat,
} from '../controllers/chatController.js';
import { generateChatTitle } from '../controllers/chatTitleController.js';

const router = express.Router();

// 🔐 Protect all routes
router.use(auth);

// ✅ Chat list & single fetch
router.get('/', listChats);
router.get('/:id', getChat);

// ✅ Chat creation routes
router.post('/', createChat);                        // Generic chat creation
router.post('/scenario', createScenarioChat);        // Scenario-based 'chat'
router.post('/feature', createFeatureChat);          // 'sema' or 'tusome' session

// 🧠 Title generation route
router.post('/chat-title', generateChatTitle);

// 📩 Add new message
router.post('/:id/messages', addMessage);

// ✏️ Update chat instance (general update)
router.put('/:id', updateChat);

// ✏️ Update chat title
router.put('/:id/rename', updateTitle);

// ❌ Delete a chat
router.delete('/:id', deleteChat);

export default router;
