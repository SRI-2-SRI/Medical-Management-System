// Data Storage (in a real app, this would be server-side)
let patients = JSON.parse(localStorage.getItem('patients')) || [];
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let medicalRecords = JSON.parse(localStorage.getItem('medicalRecords')) || [];

// DOM Elements
const patientsTab = document.getElementById('patientsTab');
const appointmentsTab = document.getElementById('appointmentsTab');
const recordsTab = document.getElementById('recordsTab');
const patientsSection = document.getElementById('patientsSection');
const appointmentsSection = document.getElementById('appointmentsSection');
const recordsSection = document.getElementById('recordsSection');

const addPatientBtn = document.getElementById('addPatientBtn');
const patientModal = document.getElementById('patientModal');
const patientForm = document.getElementById('patientForm');
const patientsList = document.getElementById('patientsList');
const patientSearch = document.getElementById('patientSearch');

const addAppointmentBtn = document.getElementById('addAppointmentBtn');
const appointmentModal = document.getElementById('appointmentModal');
const appointmentForm = document.getElementById('appointmentForm');
const calendarView = document.getElementById('calendarView');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const currentWeekSpan = document.getElementById('currentWeek');
const appointmentPatientSelect = document.getElementById('appointmentPatient');

const patientSelect = document.getElementById('patientSelect');
const recordsList = document.getElementById('recordsList');
const recordModal = document.getElementById('recordModal');
const recordForm = document.getElementById('recordForm');

// Current week for calendar
let currentWeek = new Date();
currentWeek.setHours(0, 0, 0, 0);

// Tab Switching
function switchTab(tab, section) {
    // Remove active class from all tabs and sections
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    
    // Add active class to selected tab and section
    tab.classList.add('active');
    section.classList.add('active');
}

patientsTab.addEventListener('click', () => switchTab(patientsTab, patientsSection));
appointmentsTab.addEventListener('click', () => switchTab(appointmentsTab, appointmentsSection));
recordsTab.addEventListener('click', () => switchTab(recordsTab, recordsSection));

// Patient Management
function renderPatients(filter = '') {
    patientsList.innerHTML = '';
    
    const filteredPatients = filter 
        ? patients.filter(p => 
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(filter.toLowerCase()) ||
            p.phone.includes(filter))
        : patients;
    
    filteredPatients.forEach(patient => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.firstName} ${patient.lastName}</td>
            <td>${formatDate(patient.dob)}</td>
            <td>${patient.gender}</td>
            <td>${patient.phone}</td>
            <td>
                <button class="action-btn view-btn" data-id="${patient.id}">View</button>
                <button class="action-btn edit-btn" data-id="${patient.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${patient.id}">Delete</button>
            </td>
        `;
        patientsList.appendChild(tr);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewPatient(btn.dataset.id));
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editPatient(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePatient(btn.dataset.id));
    });
}

function openPatientModal(mode = 'add', patient = null) {
    const modalTitle = document.getElementById('modalTitle');
    
    if (mode === 'add') {
        modalTitle.textContent = 'Add New Patient';
        patientForm.reset();
        document.getElementById('patientId').value = '';
    } else {
        modalTitle.textContent = 'Edit Patient';
        document.getElementById('patientId').value = patient.id;
        document.getElementById('firstName').value = patient.firstName;
        document.getElementById('lastName').value = patient.lastName;
        document.getElementById('dob').value = patient.dob;
        document.querySelector(`input[name="gender"][value="${patient.gender}"]`).checked = true;
        document.getElementById('phone').value = patient.phone;
        document.getElementById('email').value = patient.email || '';
        document.getElementById('address').value = patient.address || '';
        document.getElementById('bloodType').value = patient.bloodType || '';
        document.getElementById('allergies').value = patient.allergies ? patient.allergies.join(', ') : '';
    }
    
    patientModal.style.display = 'block';
}

function closeModal() {
    patientModal.style.display = 'none';
    appointmentModal.style.display = 'none';
    recordModal.style.display = 'none';
}

function savePatient(e) {
    e.preventDefault();
    
    const id = document.getElementById('patientId').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const dob = document.getElementById('dob').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const bloodType = document.getElementById('bloodType').value;
    const allergies = document.getElementById('allergies').value.split(',').map(a => a.trim()).filter(a => a);
    
    const patientData = {
        id: id || generateId(),
        firstName,
        lastName,
        dob,
        gender,
        phone,
        email,
        address,
        bloodType,
        allergies,
        createdAt: new Date().toISOString()
    };
    
    if (id) {
        // Update existing patient
        const index = patients.findIndex(p => p.id === id);
        if (index !== -1) {
            patients[index] = patientData;
        }
    } else {
        // Add new patient
        patients.push(patientData);
    }
    
    localStorage.setItem('patients', JSON.stringify(patients));
    renderPatients();
    populatePatientSelects();
    closeModal();
}

function viewPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (patient) {
        openPatientModal('edit', patient);
        // In a real app, you might have a separate view mode
    }
}

function editPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (patient) {
        openPatientModal('edit', patient);
    }
}

function deletePatient(id) {
    if (confirm('Are you sure you want to delete this patient?')) {
        patients = patients.filter(p => p.id !== id);
        localStorage.setItem('patients', JSON.stringify(patients));
        renderPatients();
        populatePatientSelects();
    }
}

// Appointment Management
function renderCalendar() {
    calendarView.innerHTML = '';
    
    // Calculate start and end of week
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Update current week display
    currentWeekSpan.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    
    // Add day headers
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = `${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.getDate()}`;
        calendarView.appendChild(dayHeader);
    }
    
    // Add day cells
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        day.setHours(0, 0, 0, 0);
        
        const dayCell = document.createElement('div');
        dayCell.className = 'day';
        dayCell.dataset.date = day.toISOString().split('T')[0];
        
        // Filter appointments for this day
        const dayAppointments = appointments.filter(appt => {
            const apptDate = new Date(appt.date);
            return apptDate.toDateString() === day.toDateString();
        });
        
        // Sort appointments by time
        dayAppointments.sort((a, b) => {
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            return timeA[0] - timeB[0] || timeA[1] - timeB[1];
        });
        
        // Add appointments to day cell
        dayAppointments.forEach(appt => {
            const patient = patients.find(p => p.id === appt.patientId);
            const appointmentEl = document.createElement('div');
            appointmentEl.className = 'appointment';
            appointmentEl.innerHTML = `
                <strong>${appt.time}</strong><br>
                ${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown patient'}<br>
                ${appt.reason || ''}
            `;
            appointmentEl.dataset.id = appt.id;
            appointmentEl.addEventListener('click', () => viewAppointment(appt.id));
            dayCell.appendChild(appointmentEl);
        });
        
        calendarView.appendChild(dayCell);
    }
}

function openAppointmentModal() {
    appointmentForm.reset();
    appointmentModal.style.display = 'block';
    
    // Set default date to today
    const today = new Date();
    document.getElementById('appointmentDate').value = today.toISOString().split('T')[0];
    
    // Set default time to next half hour
    const now = new Date();
    const minutes = now.getMinutes();
    const nextHalfHour = new Date(now);
    nextHalfHour.setMinutes(minutes < 30 ? 30 : 60, 0, 0);
    document.getElementById('appointmentTime').value = `${nextHalfHour.getHours().toString().padStart(2, '0')}:${nextHalfHour.getMinutes().toString().padStart(2, '0')}`;
}

function saveAppointment(e) {
    e.preventDefault();
    
    const patientId = document.getElementById('appointmentPatient').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const duration = document.getElementById('appointmentDuration').value;
    const reason = document.getElementById('appointmentReason').value;
    
    const appointment = {
        id: generateId(),
        patientId,
        date,
        time,
        duration,
        reason,
        createdAt: new Date().toISOString()
    };
    
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    renderCalendar();
    closeModal();
}

function viewAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        const patient = patients.find(p => p.id === appointment.patientId);
        
        alert(`Appointment Details:\n
Date: ${formatDate(appointment.date)}\n
Time: ${appointment.time}\n
Patient: ${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown patient'}\n
Duration: ${appointment.duration} minutes\n
Reason: ${appointment.reason || 'Not specified'}`);
    }
}

// Medical Records Management
function populatePatientSelects() {
    // Clear existing options
    appointmentPatientSelect.innerHTML = '<option value="">Select a patient</option>';
    patientSelect.innerHTML = '<option value="">Select a patient</option>';
    
    // Add patients to selects
    patients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = `${patient.firstName} ${patient.lastName}`;
        
        appointmentPatientSelect.appendChild(option.cloneNode(true));
        patientSelect.appendChild(option);
    });
}

function renderRecords(patientId) {
    recordsList.innerHTML = '';
    
    const filteredRecords = patientId 
        ? medicalRecords.filter(r => r.patientId === patientId)
        : medicalRecords;
    
    if (filteredRecords.length === 0) {
        recordsList.innerHTML = '<p>No records found</p>';
        return;
    }
    
    filteredRecords.forEach(record => {
        const patient = patients.find(p => p.id === record.patientId);
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';
        recordCard.innerHTML = `
            <h3>${record.diagnosis}</h3>
            <p class="record-date">${formatDate(record.date)}</p>
            <p><strong>Treatment:</strong> ${record.treatment}</p>
            ${record.prescriptions ? `<p><strong>Prescriptions:</strong> ${record.prescriptions}</p>` : ''}
            <p><strong>Patient:</strong> ${patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}</p>
        `;
        recordsList.appendChild(recordCard);
    });
}

function openRecordModal(patientId = '') {
    recordForm.reset();
    document.getElementById('recordPatientId').value = patientId || '';
    
    // Set default date to today
    const today = new Date();
    document.getElementById('recordDate').value = today.toISOString().split('T')[0];
    
    recordModal.style.display = 'block';
}

function saveRecord(e) {
    e.preventDefault();
    
    const patientId = document.getElementById('recordPatientId').value;
    const date = document.getElementById('recordDate').value;
    const diagnosis = document.getElementById('recordDiagnosis').value;
    const treatment = document.getElementById('recordTreatment').value;
    const prescriptions = document.getElementById('recordPrescriptions').value;
    const notes = document.getElementById('recordNotes').value;
    
    const record = {
        id: generateId(),
        patientId,
        date,
        diagnosis,
        treatment,
        prescriptions,
        notes,
        createdAt: new Date().toISOString()
    };
    
    medicalRecords.push(record);
    localStorage.setItem('medicalRecords', JSON.stringify(medicalRecords));
    renderRecords(patientId);
    closeModal();
}

// Helper Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize data
    renderPatients();
    renderCalendar();
    populatePatientSelects();
    
    // Patient events
    addPatientBtn.addEventListener('click', () => openPatientModal());
    patientSearch.addEventListener('input', (e) => renderPatients(e.target.value));
    patientForm.addEventListener('submit', savePatient);
    
    // Appointment events
    addAppointmentBtn.addEventListener('click', openAppointmentModal);
    appointmentForm.addEventListener('submit', saveAppointment);
    prevWeekBtn.addEventListener('click', () => {
        currentWeek.setDate(currentWeek.getDate() - 7);
        renderCalendar();
    });
    nextWeekBtn.addEventListener('click', () => {
        currentWeek.setDate(currentWeek.getDate() + 7);
        renderCalendar();
    });
    
    // Record events
    patientSelect.addEventListener('change', (e) => renderRecords(e.target.value));
    recordForm.addEventListener('submit', saveRecord);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Add record button (would be in patient view in a real app)
    document.getElementById('patientsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('view-btn')) {
            const patientId = e.target.dataset.id;
            openRecordModal(patientId);
        }
    });
});