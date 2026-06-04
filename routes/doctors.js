const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, doctorController.listDoctors);
router.get('/:id', authMiddleware.verifyToken, doctorController.getDoctor);
router.post('/', authMiddleware.verifyToken, authMiddleware.authorize('administrator'), doctorController.createDoctor);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.authorize('administrator'), doctorController.updateDoctor);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorize('administrator'), doctorController.deleteDoctor);

module.exports = router;
