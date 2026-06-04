const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const dataPath = file => path.join(__dirname, '..', 'data', file);

router.get('/stats', authMiddleware.verifyToken, (req, res, next) => {
  try {
    const doctors = JSON.parse(fs.readFileSync(dataPath('doctors.json')));
    const patients = JSON.parse(fs.readFileSync(dataPath('patients.json')));
    const diagnoses = JSON.parse(fs.readFileSync(dataPath('diagnoses.json')));

    const severityCount = diagnoses.reduce((acc, item) => {
      acc[item.severity] = (acc[item.severity] || 0) + 1;
      return acc;
    }, {});

    res.json({
      doctors: doctors.length,
      patients: patients.length,
      diagnoses: diagnoses.length,
      severityCount,
      departments: doctors.reduce((acc, item) => {
        acc[item.department] = (acc[item.department] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
