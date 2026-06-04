const fs = require('fs');
const path = require('path');

const dataPath = file => path.join(__dirname, '..', 'data', file);

const readData = file => JSON.parse(fs.readFileSync(dataPath(file)));
const writeData = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

exports.listDiagnoses = (req, res, next) => {
  try {
    const diagnoses = readData('diagnoses.json');
    const patients = readData('patients.json');
    const { search, severity, patientId } = req.query;
    let filtered = diagnoses;

    if (severity) {
      filtered = filtered.filter(item => item.severity.toLowerCase() === severity.toLowerCase());
    }
    if (patientId) {
      filtered = filtered.filter(item => Number(item.patientId) === Number(patientId));
    }
    if (search) {
      filtered = filtered.filter(item => item.icd.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()));
    }

    const payload = filtered.map(diagnosis => ({
      ...diagnosis,
      patientName: patients.find(item => item.id === Number(diagnosis.patientId))?.name || 'Aniqlanmadi',
    }));

    res.json(payload);
  } catch (error) {
    next(error);
  }
};

exports.getDiagnosis = (req, res, next) => {
  try {
    const diagnoses = readData('diagnoses.json');
    const diagnosis = diagnoses.find(item => item.id === Number(req.params.id));
    if (!diagnosis) {
      return res.status(404).json({ error: 'Tashxis topilmadi' });
    }
    res.json(diagnosis);
  } catch (error) {
    next(error);
  }
};

exports.createDiagnosis = (req, res, next) => {
  try {
    const { icd, description, severity, patientId } = req.body;
    if (!icd || !description || !severity || !patientId) {
      return res.status(400).json({ error: 'Barcha tashxis maydonlari to‘ldirilishi kerak' });
    }

    const diagnoses = readData('diagnoses.json');
    const patients = readData('patients.json');
    if (!patients.find(item => item.id === Number(patientId))) {
      return res.status(400).json({ error: 'Mavjud bemor tanlanishi kerak' });
    }

    const newDiagnosis = {
      id: diagnoses.length ? Math.max(...diagnoses.map(item => item.id)) + 1 : 1,
      icd,
      description,
      severity,
      patientId: Number(patientId),
      createdAt: new Date().toISOString(),
    };
    diagnoses.push(newDiagnosis);
    writeData('diagnoses.json', diagnoses);
    res.status(201).json(newDiagnosis);
  } catch (error) {
    next(error);
  }
};

exports.updateDiagnosis = (req, res, next) => {
  try {
    const diagnoses = readData('diagnoses.json');
    const diagnosis = diagnoses.find(item => item.id === Number(req.params.id));
    if (!diagnosis) {
      return res.status(404).json({ error: 'Tashxis topilmadi' });
    }
    const { icd, description, severity, patientId } = req.body;
    diagnosis.icd = icd || diagnosis.icd;
    diagnosis.description = description || diagnosis.description;
    diagnosis.severity = severity || diagnosis.severity;
    diagnosis.patientId = patientId ? Number(patientId) : diagnosis.patientId;
    writeData('diagnoses.json', diagnoses);
    res.json(diagnosis);
  } catch (error) {
    next(error);
  }
};

exports.deleteDiagnosis = (req, res, next) => {
  try {
    const diagnoses = readData('diagnoses.json');
    const index = diagnoses.findIndex(item => item.id === Number(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Tashxis topilmadi' });
    }
    diagnoses.splice(index, 1);
    writeData('diagnoses.json', diagnoses);
    res.json({ message: 'Tashxis o‘chirildi' });
  } catch (error) {
    next(error);
  }
};
