const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getEvents,
  getEvent,
  createEvent,
  publishEvent,
  registerForEvent
} = require('../controllers/eventController');

router.get('/', auth, getEvents);
router.get('/:id', auth, getEvent);
router.post('/', auth, createEvent);
router.put('/:id/publish', auth, publishEvent);
router.post('/:id/register', auth, registerForEvent);

module.exports = router;