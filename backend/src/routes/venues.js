const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getVenues,
  getVenue,
  createVenue,
  updateVenue
} = require('../controllers/venueController');

router.get('/', auth, getVenues);
router.get('/:id', auth, getVenue);
router.post('/', auth, createVenue);
router.put('/:id', auth, updateVenue);

module.exports = router;