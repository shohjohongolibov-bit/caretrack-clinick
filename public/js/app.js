const token = localStorage.getItem('caretrack-token');
const role = localStorage.getItem('caretrack-role');
const name = localStorage.getItem('caretrack-name');

if (!token) {
  window.location.href = '/';
}

const toast = document.getElementById('toast');
const welcomeText = document.getElementById('welcomeText');
const roleLabel = document.getElementById('roleLabel');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section-grid');
const reloadBtn = document.getElementById('reloadBtn');
const logoutBtn = document.getElementById('logoutBtn');

const patientSearch = document.getElementById('patientSearch');
const patientDoctorFilter = document.getElementById('patientDoctorFilter');
const patientTable = document.getElementById('patientTable');
const patientDetailPanel = document.getElementById('patientDetailPanel');
const detailName = document.getElementById('detailName');
const detailPhone = document.getElementById('detailPhone');
const detailAddress = document.getElementById('detailAddress');
const detailDoctor = document.getElementById('detailDoctor');
const detailAppointmentDate = document.getElementById('detailAppointmentDate');
const detailAppointmentTime = document.getElementById('detailAppointmentTime');
const detailDiagnosisList = document.getElementById('detailDiagnosisList');
const newPatientBtn = document.getElementById('newPatientBtn');

const doctorSearch = document.getElementById('doctorSearch');
const doctorDepartmentFilter = document.getElementById('doctorDepartmentFilter');
const doctorTable = document.getElementById('doctorTable');
const newDoctorBtn = document.getElementById('newDoctorBtn');

const diagnosisSearch = document.getElementById('diagnosisSearch');
const diagnosisSeverityFilter = document.getElementById('diagnosisSeverityFilter');
const diagnosisTable = document.getElementById('diagnosisTable');
const newDiagnosisBtn = document.getElementById('newDiagnosisBtn');

const doctorsCount = document.getElementById('doctorsCount');
const patientsCount = document.getElementById('patientsCount');
const diagnosesCount = document.getElementById('diagnosesCount');
const severitySummary = document.getElementById('severitySummary');

const modalLayer = document.getElementById('modalLayer');
const patientModal = document.getElementById('patientModal');
const patientForm = document.getElementById('patientForm');
const patientDoctorSelect = document.getElementById('patientDoctorSelect');
const diagnosisModal = document.getElementById('diagnosisModal');
const diagnosisForm = document.getElementById('diagnosisForm');
const sidebarToggle = document.getElementById('sidebarToggle');
const dashboardShell = document.querySelector('.dashboard-shell');
const diagnosisPatientSelect = document.getElementById('diagnosisPatientSelect');
const doctorModal = document.getElementById('doctorModal');
const doctorForm = document.getElementById('doctorForm');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
const editPatientBtn = document.getElementById('editPatientBtn');
const deletePatientBtn = document.getElementById('deletePatientBtn');

let doctors = [];
let confirmAction = null;
let patients = [];
let diagnoses = [];
let selectedPatientId = null;
let editDoctorId = null;
let editPatientId = null;
let editDiagnosisId = null;

const showToast = (message, type = 'success') => {
  toast.textContent = message;
  toast.style.background = type === 'error' ? 'rgba(220, 38, 38, 0.95)' : 'rgba(15, 23, 42, 0.95)';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
};

const formatDate = dateStr => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = timeStr => timeStr || '-';

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'So‘rov bajarilmadi');
  }
  return payload;
};

const setActiveSection = id => {
  sections.forEach(section => section.classList.toggle('hidden', section.id !== id));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.section === id));
};

const fillUserProfile = () => {
  welcomeText.innerHTML = `Salom, <span class="text-accent">${name || 'Foydalanuvchi'}</span>`;
  roleLabel.textContent = `Rol: ${role?.replace('administrator', 'Administrator').replace('clinician', 'Klinitsist').replace('receptionist', 'Qabulxona')}`;
  if (role !== 'administrator') {
    newDoctorBtn?.classList.add('hidden');
  }
  if (role === 'receptionist') {
    newDiagnosisBtn?.classList.add('hidden');
  }
};

const populateDoctorSelects = () => {
  patientDoctorSelect.innerHTML = doctors.map(doctor => `<option value="${doctor.id}">${doctor.name} — ${doctor.specialty}</option>`).join('');
  diagnosisPatientSelect.innerHTML = patients.map(patient => `<option value="${patient.id}">${patient.name}</option>`).join('');
  patientDoctorFilter.innerHTML = `<option value="">Barcha shifokorlar</option>${doctors.map(doctor => `<option value="${doctor.id}">${doctor.name}</option>`).join('')}`;
};

const renderDashboard = data => {
  doctorsCount.textContent = data.doctors;
  patientsCount.textContent = data.patients;
  diagnosesCount.textContent = data.diagnoses;
  severitySummary.innerHTML = Object.entries(data.severityCount || {}).map(([level, value]) => `<div class="severity-item"><span>${level}</span><strong>${value}</strong></div>`).join('');
};

const renderPatients = () => {
  const search = patientSearch.value.trim().toLowerCase();
  const doctorId = patientDoctorFilter.value;
  const list = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(search) || patient.phone.includes(search) || patient.address.toLowerCase().includes(search);
    const matchesDoctor = !doctorId || Number(patient.doctorId) === Number(doctorId);
    return matchesSearch && matchesDoctor;
  });
  patientTable.innerHTML = list.map(patient => {
    const doctorName = doctors.find(doc => doc.id === Number(patient.doctorId))?.name || 'Aniqlanmadi';
    return `<tr class="clickable" data-id="${patient.id}"><td>${patient.name}</td><td>${patient.phone}</td><td>${doctorName}</td><td>${formatDate(patient.appointmentDate)}</td><td>${formatTime(patient.appointmentTime)}</td><td>${patient.address}</td></tr>`;
  }).join('');
  document.querySelectorAll('#patientTable tr').forEach(row => row.addEventListener('click', () => showPatientDetail(Number(row.dataset.id))));
  if (!selectedPatientId && list.length) showPatientDetail(list[0].id);
};

const renderDoctors = () => {
  const search = doctorSearch.value.trim().toLowerCase();
  const department = doctorDepartmentFilter.value;
  const list = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(search) || doctor.specialty.toLowerCase().includes(search);
    const matchesDepartment = !department || doctor.department === department;
    return matchesSearch && matchesDepartment;
  });
  doctorTable.innerHTML = list.map(doctor => `<tr><td>${doctor.name}</td><td>${doctor.specialty}</td><td>${doctor.department}</td><td>${doctor.phone}<br><small>${doctor.email || '-'}</small></td><td>${role === 'administrator' ? `<button class="btn btn-secondary btn-small" data-edit-doctor="${doctor.id}">Tahrirlash</button> <button class="btn btn-danger btn-small" data-delete-doctor="${doctor.id}">O‘chirish</button>` : '-'}</td></tr>`).join('');
  document.querySelectorAll('[data-edit-doctor]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    openDoctorModal('edit', Number(btn.dataset.editDoctor));
  }));
  document.querySelectorAll('[data-delete-doctor]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    deleteDoctor(Number(btn.dataset.deleteDoctor));
  }));
};

const renderDiagnoses = () => {
  const search = diagnosisSearch.value.trim().toLowerCase();
  const severity = diagnosisSeverityFilter.value;
  const list = diagnoses.filter(item => {
    const matchesSearch = item.icd.toLowerCase().includes(search) || item.description.toLowerCase().includes(search) || item.patientName?.toLowerCase().includes(search);
    const matchesSeverity = !severity || item.severity === severity;
    return matchesSearch && matchesSeverity;
  });
  diagnosisTable.innerHTML = list.map(item => `<tr><td>${item.patientName}</td><td>${item.icd}</td><td>${item.description}</td><td>${item.severity}</td><td>${role !== 'receptionist' ? `<button class="btn btn-secondary btn-small" data-edit-diagnosis="${item.id}">Tahrirlash</button> <button class="btn btn-danger btn-small" data-delete-diagnosis="${item.id}">O‘chirish</button>` : '-'}</td></tr>`).join('');
  document.querySelectorAll('[data-edit-diagnosis]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    openDiagnosisModal('edit', Number(btn.dataset.editDiagnosis));
  }));
  document.querySelectorAll('[data-delete-diagnosis]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    deleteDiagnosis(Number(btn.dataset.deleteDiagnosis));
  }));
};

const showPatientDetail = async id => {
  const patient = patients.find(item => item.id === id);
  if (!patient) return;
  selectedPatientId = id;
  detailName.textContent = patient.name;
  detailPhone.textContent = patient.phone;
  detailAddress.textContent = patient.address;
  detailDoctor.textContent = doctors.find(doc => doc.id === Number(patient.doctorId))?.name || 'Aniqlanmadi';
  detailAppointmentDate.textContent = formatDate(patient.appointmentDate);
  detailAppointmentTime.textContent = formatTime(patient.appointmentTime);
  const history = diagnoses.filter(item => Number(item.patientId) === id);
  detailDiagnosisList.innerHTML = history.length ? history.map(item => `<li><strong>${item.icd}</strong> — ${item.description} <span class="small-text">(${item.severity})</span></li>`).join('') : '<li class="small-text">Tashxislar yo‘q</li>';
};

const openModal = modal => {
  modalLayer.classList.remove('hidden');
  modal.classList.remove('hidden');
};

const closeModal = () => {
  modalLayer.classList.add('hidden');
  document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
  editDoctorId = null;
  editPatientId = null;
  editDiagnosisId = null;
  patientForm.reset();
  doctorForm.reset();
  diagnosisForm.reset();
};

const openPatientModal = (mode = 'create', id = null) => {
  patientForm.reset();
  editPatientId = null;
  document.getElementById('patientModalTitle').textContent = mode === 'edit' ? 'Bemorga o‘zgarish kiritish' : 'Yangi bemor qo‘shish';
  if (mode === 'edit' && id) {
    const item = patients.find(row => row.id === id);
    if (item) {
      editPatientId = id;
      patientForm.elements.name.value = item.name;
      patientForm.elements.phone.value = item.phone;
      patientForm.elements.address.value = item.address;
      patientForm.elements.appointmentDate.value = item.appointmentDate || '';
      patientForm.elements.appointmentTime.value = item.appointmentTime || '';
      patientForm.elements.doctorId.value = item.doctorId;
    }
  }
  openModal(patientModal);
};

const openDiagnosisModal = (mode = 'create', id = null) => {
  diagnosisForm.reset();
  editDiagnosisId = null;
  document.getElementById('diagnosisModalTitle').textContent = mode === 'edit' ? 'Tashxisni tahrirlash' : 'Yangi tashxis qo‘shish';
  if (mode === 'edit') {
    const item = diagnoses.find(row => row.id === id);
    if (!item) return;
    editDiagnosisId = id;
    diagnosisForm.elements.icd.value = item.icd;
    diagnosisForm.elements.description.value = item.description;
    diagnosisForm.elements.severity.value = item.severity;
    diagnosisForm.elements.patientId.value = item.patientId;
  }
  openModal(diagnosisModal);
};

const openDoctorModal = (mode = 'create', id = null) => {
  doctorForm.reset();
  editDoctorId = null;
  document.getElementById('doctorModalTitle').textContent = mode === 'edit' ? 'Shifokorni tahrirlash' : 'Yangi shifokor qo‘shish';
  if (mode === 'edit') {
    const item = doctors.find(row => row.id === id);
    if (!item) return;
    editDoctorId = id;
    doctorForm.elements.name.value = item.name;
    doctorForm.elements.specialty.value = item.specialty;
    doctorForm.elements.department.value = item.department;
    doctorForm.elements.phone.value = item.phone;
    doctorForm.elements.email.value = item.email;
  }
  openModal(doctorModal);
};

const loadStats = async () => {
  const stats = await request('/api/dashboard/stats');
  renderDashboard(stats);
};

const loadDoctors = async () => {
  doctors = await request('/api/doctors');
  renderDoctors();
  populateDoctorSelects();
  renderPatients();
};

const loadPatients = async () => {
  patients = await request('/api/patients');
  renderPatients();
  populateDoctorSelects();
};

const loadDiagnoses = async () => {
  diagnoses = await request('/api/diagnoses');
  renderDiagnoses();
};

const openConfirm = (message, action) => {
  confirmMessage.textContent = message;
  confirmAction = action;
  openModal(confirmModal);
};

const closeConfirm = () => {
  confirmAction = null;
  closeModal();
};

confirmYesBtn.addEventListener('click', async () => {
  if (typeof confirmAction === 'function') {
    try {
      await confirmAction();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
  closeConfirm();
});

confirmNoBtn.addEventListener('click', closeConfirm);

const deleteDoctor = async id => {
  openConfirm('Shifokorni o‘chirib tashlamoqchimisiz?', async () => {
    await request(`/api/doctors/${id}`, { method: 'DELETE' });
    showToast('Shifokor muvaffaqiyatli o‘chirildi');
    await refreshData();
  });
};

const deletePatient = async id => {
  openConfirm('Bemorni o‘chirib tashlamoqchimisiz?', async () => {
    await request(`/api/patients/${id}`, { method: 'DELETE' });
    showToast('Bemor muvaffaqiyatli o‘chirildi');
    selectedPatientId = null;
    await refreshData();
  });
};

const deleteDiagnosis = async id => {
  openConfirm('Tashxisni o‘chirib tashlamoqchimisiz?', async () => {
    await request(`/api/diagnoses/${id}`, { method: 'DELETE' });
    showToast('Tashxis muvaffaqiyatli o‘chirildi');
    await refreshData();
  });
};

const refreshData = async () => {
  try {
    await Promise.all([loadStats(), loadDoctors(), loadPatients(), loadDiagnoses()]);
    renderPatients();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    setActiveSection(item.dataset.section);
    if (isMobileLayout()) {
      dashboardShell.classList.add('collapsed');
    }
  });
});

const toggleSidebar = () => {
  dashboardShell.classList.toggle('collapsed');
};

sidebarToggle?.addEventListener('click', toggleSidebar);

const isMobileLayout = () => window.matchMedia('(max-width: 1040px)').matches;

const setResponsiveSidebarState = () => {
  if (isMobileLayout()) {
    dashboardShell.classList.add('collapsed');
  }
};

setResponsiveSidebarState();
window.addEventListener('resize', setResponsiveSidebarState);

if (reloadBtn) {
  reloadBtn.addEventListener('click', refreshData);
}
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('caretrack-token');
  localStorage.removeItem('caretrack-role');
  localStorage.removeItem('caretrack-name');
  window.location.href = '/';
});

patientSearch.addEventListener('input', renderPatients);
patientDoctorFilter.addEventListener('change', renderPatients);
doctorSearch.addEventListener('input', renderDoctors);
doctorDepartmentFilter.addEventListener('change', renderDoctors);
if (diagnosisSearch) diagnosisSearch.addEventListener('input', renderDiagnoses);

diagnosisSeverityFilter.addEventListener('change', renderDiagnoses);

newPatientBtn.addEventListener('click', () => openPatientModal('create'));
newDoctorBtn.addEventListener('click', () => openDoctorModal('create'));
newDiagnosisBtn.addEventListener('click', () => openDiagnosisModal('create'));
editPatientBtn?.addEventListener('click', () => {
  if (selectedPatientId) openPatientModal('edit', selectedPatientId);
});
deletePatientBtn?.addEventListener('click', () => {
  if (selectedPatientId) deletePatient(selectedPatientId);
});

modalLayer.addEventListener('click', closeModal);
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));

patientForm.addEventListener('submit', async event => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(patientForm).entries());

  if (!fields.appointmentDate || !fields.appointmentTime) {
    showToast('Qabul sanasi va vaqtini to‘liq kiriting', 'error');
    return;
  }

  try {
    if (editPatientId) {
      await request(`/api/patients/${editPatientId}`, { method: 'PUT', body: JSON.stringify(fields) });
      showToast('Bemor ma’lumotlari yangilandi');
    } else {
      await request('/api/patients', { method: 'POST', body: JSON.stringify(fields) });
      showToast('Yangi bemor muvaffaqiyatli qo‘shildi');
    }
    closeModal();
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

doctorForm.addEventListener('submit', async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(doctorForm).entries());
  try {
    if (editDoctorId) {
      await request(`/api/doctors/${editDoctorId}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Shifokor ma’lumotlari yangilandi');
    } else {
      await request('/api/doctors', { method: 'POST', body: JSON.stringify(body) });
      showToast('Yangi shifokor qo‘shildi');
    }
    closeModal();
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

diagnosisForm.addEventListener('submit', async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(diagnosisForm).entries());
  try {
    if (editDiagnosisId) {
      await request(`/api/diagnoses/${editDiagnosisId}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Tashxis yangilandi');
    } else {
      await request('/api/diagnoses', { method: 'POST', body: JSON.stringify(body) });
      showToast('Yangi tashxis qo‘shildi');
    }
    closeModal();
    await refreshData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

fillUserProfile();
refreshData();
