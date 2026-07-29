const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/resourceController');

router.get('/', auth, getDepartments);
router.post('/', auth, createDepartment);
router.put('/:id', auth, updateDepartment);
router.delete('/:id', auth, deleteDepartment);

module.exports = router;
