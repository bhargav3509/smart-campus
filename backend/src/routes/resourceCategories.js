const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/resourceController');

router.get('/', auth, getCategories);
router.post('/', auth, createCategory);
router.put('/:id', auth, updateCategory);
router.delete('/:id', auth, deleteCategory);

module.exports = router;
