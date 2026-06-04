const fs = require('fs');
const path = require('path');

const dataPath = file => path.join(__dirname, '..', 'data', file);

const readData = file => JSON.parse(fs.readFileSync(dataPath(file)));
const writeData = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

exports.listDoctors = (req, res, next) => {
  try {
    const doctors = readData('doctors.json');
    const { search, department } = req.query;
    let filtered = doctors;

    if (department) {
      filtered = filtered.filter(item => item.department.toLowerCase() === department.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.specialty.toLowerCase().includes(search.toLowerCase()));
    }
    res.json(filtered);
  } catch (error) {
    next(error);
  }
};

exports.getDoctor = (req, res, next) => {
  try {
    const doctors = readData('doctors.json');
    const doctor = doctors.find(item => item.id === Number(req.params.id));
    if (!doctor) {
      return res.status(404).json({ error: 'Shifokor topilmadi' });
    }
    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

exports.createDoctor = (req, res, next) => {
  try {
    const { name, specialty, department, phone, email } = req.body;
    if (!name || !specialty || !department || !phone) {
      return res.status(400).json({ error: 'Barcha majburiy maydonlar to‘ldirilishi kerak' });
    }

    const doctors = readData('doctors.json');
    const newDoctor = {
      id: doctors.length ? Math.max(...doctors.map(item => item.id)) + 1 : 1,
      name,
      specialty,
      department,
      phone,
      email: email || '',
    };
    doctors.push(newDoctor);
    writeData('doctors.json', doctors);
    res.status(201).json(newDoctor);
  } catch (error) {
    next(error);
  }
};

exports.updateDoctor = (req, res, next) => {
  try {
    const doctors = readData('doctors.json');
    const doctor = doctors.find(item => item.id === Number(req.params.id));
    if (!doctor) {
      return res.status(404).json({ error: 'Shifokor topilmadi' });
    }
    const { name, specialty, department, phone, email } = req.body;
    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.department = department || doctor.department;
    doctor.phone = phone || doctor.phone;
    doctor.email = email || doctor.email;

    writeData('doctors.json', doctors);
    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

exports.deleteDoctor = (req, res, next) => {
  try {
    const doctors = readData('doctors.json');
    const doctorIndex = doctors.findIndex(item => item.id === Number(req.params.id));
    if (doctorIndex === -1) {
      return res.status(404).json({ error: 'Shifokor topilmadi' });
    }
    doctors.splice(doctorIndex, 1);
    writeData('doctors.json', doctors);
    res.json({ message: 'Shifokor o‘chirildi' });
  } catch (error) {
    next(error);
  }
};
