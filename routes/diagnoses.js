const express = require('express');
const router = express.Router();
const diagnosisController = require('../controllers/diagnosisController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, diagnosisController.listDiagnoses);
router.get('/:id', authMiddleware.verifyToken, diagnosisController.getDiagnosis);
router.post('/', authMiddleware.verifyToken, authMiddleware.authorize('administrator', 'clinician'), diagnosisController.createDiagnosis);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.authorize('administrator', 'clinician'), diagnosisController.updateDiagnosis);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.authorize('administrator'), diagnosisController.deleteDiagnosis);

module.exports = router;
