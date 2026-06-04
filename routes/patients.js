const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, patientController.listPatients);
router.get('/:id', authMiddleware.verifyToken, patientController.getPatient);
router.post('/', authMiddleware.verifyToken, authMiddleware.authorize('administrator', 'receptionist'), patientController.createPatient);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.authorize('administrator', 'clinician'), patientController.updatePatient);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorize('administrator'), patientController.deletePatient);

module.exports = router;
