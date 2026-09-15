const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  listUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getStats,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);

module.exports = router;
