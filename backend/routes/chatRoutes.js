const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  startChat,
  sendMessage,
  getChatHistory,
  getChatSession
} = require('../controllers/chatController');

router.use(protect);

router.post('/start', startChat);

router.post('/:sessionId/message', sendMessage);

router.get('/history', getChatHistory);

router.get('/:sessionId', getChatSession);

module.exports = router;
