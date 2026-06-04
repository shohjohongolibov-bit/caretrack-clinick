const fs = require('fs');
const path = require('path');

const dataPath = file => path.join(__dirname, '..', 'data', file);

const readData = file => JSON.parse(fs.readFileSync(dataPath(file)));
const writeData = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

const parseAppointmentDateTime = (date, time) => {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const validateDoctorSchedule = (patients, doctorId, appointmentDateTime, currentPatientId = null) => {
  return patients.some(item => {
    if (Number(item.doctorId) !== Number(doctorId)) return false;
    if (currentPatientId && Number(item.id) === Number(currentPatientId)) return false;
    const existingDate = parseAppointmentDateTime(item.appointmentDate, item.appointmentTime);
    if (!existingDate) return false;
    const diffMinutes = Math.abs(existingDate - appointmentDateTime) / 60000;
    return diffMinutes < 60;
  });
};

exports.listPatients = (req, res, next) => {
  try {
    const patients = readData('patients.json');
    const doctors = readData('doctors.json');
    const { search, doctorId } = req.query;
    let filtered = patients;

    if (doctorId) {
      filtered = filtered.filter(item => Number(item.doctorId) === Number(doctorId));
    }
    if (search) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.phone.includes(search));
    }

    const payload = filtered.map(patient => ({
      ...patient,
      doctorName: doctors.find(doc => doc.id === Number(patient.doctorId))?.name || 'Aniqlanmadi',
    }));

    res.json(payload);
  } catch (error) {
    next(error);
  }
};

exports.getPatient = (req, res, next) => {
  try {
    const patients = readData('patients.json');
    const doctors = readData('doctors.json');
    const diagnoses = readData('diagnoses.json');
    const patient = patients.find(item => item.id === Number(req.params.id));

    if (!patient) {
      return res.status(404).json({ error: 'Bemor topilmadi' });
    }

    const doctor = doctors.find(item => item.id === Number(patient.doctorId)) || {};
    const patientDiagnoses = diagnoses.filter(item => Number(item.patientId) === Number(patient.id));

    res.json({
      ...patient,
      doctor,
      diagnoses: patientDiagnoses,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPatient = (req, res, next) => {
  try {
    const { name, phone, address, doctorId, appointmentDate, appointmentTime } = req.body;
    if (!name || !phone || !address || !doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Bemorning barcha majburiy ma’lumotlari to‘ldirilishi kerak' });
    }
    const patients = readData('patients.json');
    const doctors = readData('doctors.json');
    const doctor = doctors.find(item => item.id === Number(doctorId));
    if (!doctor) {
      return res.status(400).json({ error: 'Mavjud shifokor tanlanishi kerak' });
    }

    const appointmentDateTime = parseAppointmentDateTime(appointmentDate, appointmentTime);
    if (!appointmentDateTime) {
      return res.status(400).json({ error: 'Qabul sanasi yoki vaqti noto‘g‘ri formatda' });
    }
    const now = new Date();

if (appointmentDateTime < now) {
  return res.status(400).json({
    error: 'O‘tib ketgan sana yoki vaqtni tanlash mumkin emas'
  });
}

    if (validateDoctorSchedule(patients, doctorId, appointmentDateTime)) {
      return res.status(400).json({ error: 'Bu shifokor uchun keyingi bemor oldingi bemordan kamida 1 soat keyin bo‘lishi kerak' });
    }

    const newPatient = {
      id: patients.length ? Math.max(...patients.map(item => item.id)) + 1 : 1,
      name,
      phone,
      address,
      doctorId: Number(doctorId),
      appointmentDate,
      appointmentTime,
    };
    patients.push(newPatient);
    writeData('patients.json', patients);
    res.status(201).json(newPatient);
  } catch (error) {
    next(error);
  }
};

exports.updatePatient = (req, res, next) => {
  try {
    const patients = readData('patients.json');
    const patient = patients.find(item => item.id === Number(req.params.id));
    if (!patient) {
      return res.status(404).json({ error: 'Bemor topilmadi' });
    }

    const { name, phone, address, doctorId, appointmentDate, appointmentTime } = req.body;
    const updatedDoctorId = doctorId ? Number(doctorId) : patient.doctorId;
    const newAppointmentDate = appointmentDate !== undefined ? appointmentDate : patient.appointmentDate;
    const newAppointmentTime = appointmentTime !== undefined ? appointmentTime : patient.appointmentTime;

    if ((appointmentDate && !appointmentTime) || (!appointmentDate && appointmentTime)) {
      return res.status(400).json({ error: 'Qabul sanasi va vaqti bir vaqtning o‘zida to‘ldirilishi kerak' });
    }

    const appointmentDateTime = parseAppointmentDateTime(newAppointmentDate, newAppointmentTime);
    if (!appointmentDateTime) {
      return res.status(400).json({ error: 'Qabul sanasi yoki vaqti noto‘g‘ri formatda' });
    }
    const now = new Date();

if (appointmentDateTime < now) {
  return res.status(400).json({
    error: 'O‘tib ketgan sana yoki vaqtni tanlash mumkin emas'
  });
}

    if (validateDoctorSchedule(patients, updatedDoctorId, appointmentDateTime, patient.id)) {
      return res.status(400).json({ error: 'Bu shifokor uchun keyingi bemor oldingi bemordan kamida 1 soat keyin bo‘lishi kerak' });
    }

    patient.name = name || patient.name;
    patient.phone = phone || patient.phone;
    patient.address = address || patient.address;
    patient.doctorId = updatedDoctorId;
    patient.appointmentDate = newAppointmentDate;
    patient.appointmentTime = newAppointmentTime;

    writeData('patients.json', patients);
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

exports.deletePatient = (req, res, next) => {
  try {
    const patients = readData('patients.json');
    const patientIndex = patients.findIndex(item => item.id === Number(req.params.id));
    if (patientIndex === -1) {
      return res.status(404).json({ error: 'Bemor topilmadi' });
    }
    patients.splice(patientIndex, 1);
    writeData('patients.json', patients);
    res.json({ message: 'Bemor o‘chirildi' });
  } catch (error) {
    next(error);
  }
};
