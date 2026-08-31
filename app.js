/* ==========================================================================
   MediConsult - Application Logic & State Management (Scale: 34 Profesionales)
   ========================================================================== */

(function () {
  'use strict';

  // State keys for LocalStorage (v3 for CENTRO GIOVO real data)
  const STORAGE_KEYS = {
    ROOMS: 'giovo_rooms_v3',
    DOCTORS: 'giovo_doctors_v3',
    ASSIGNMENTS: 'giovo_assignments_v3',
    SHIFTS: 'giovo_shifts_v3'
  };

  // Default initial Turno definition details (Horario comercial: 07:00 - 21:00 hs)
  const DEFAULT_SHIFTS = {
    MANANA: { id: 'MANANA', label: 'Mañana', hours: '07:00 - 14:00', icon: 'fa-sun' },
    TARDE: { id: 'TARDE', label: 'Tarde', hours: '14:00 - 21:00', icon: 'fa-cloud-sun' }
  };

  // State
  let state = {
    viewMode: 'day',
    rooms: [],
    doctors: [],
    assignments: [],
    shifts: {},
    initializedDates: [],
    selectedDate: getTodayString(),
    selectedShift: 'ALL',
    selectedStatus: 'ALL',
    selectedEquipment: 'ALL',
    searchQuery: ''
  };

  // Initialize App
  document.addEventListener('DOMContentLoaded', () => {
    initData();
    setupEventListeners();
    renderAll();
  });

  // Helper: Get YYYY-MM-DD for today
  function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const DATA_VERSION = 'giovo_v18_annual_calendar';

  // Master schedule template by day of week (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri)
  const weeklyTemplate = [
    // 0: LUNES
    [
      { roomId: 'RPSICO', shift: 'TARDE', docSearch: 'ANDRIZZI', startTime: '14:00', endTime: '19:00', notes: 'Psicología' },
      { roomId: 'R3', shift: 'MANANA', docSearch: 'MARTINEZ', startTime: '12:30', endTime: '15:50', notes: 'Dermatología' },
      { roomId: 'RLABO', shift: 'MANANA', docSearch: 'PENA', startTime: '07:30', endTime: '10:00', notes: 'Bioquímico' },
      { roomId: 'R6', shift: 'TARDE', docSearch: 'OLIVERO', startTime: '16:00', endTime: '20:00', notes: 'Endocrinología y Diabetes' },
      { roomId: 'R2', shift: 'TARDE', docSearch: 'CRESPO', startTime: '15:00', endTime: '18:00', notes: 'Cosmetología' },
      { roomId: 'R3', shift: 'TARDE', docSearch: 'CHALI', startTime: '16:00', endTime: '20:00', notes: 'Dermatología' },
      { roomId: 'R1', shift: 'MANANA', docSearch: 'PESCO', startTime: '09:20', endTime: '14:00', notes: 'Dermatología' },
      { roomId: 'R5', shift: 'TARDE', docSearch: 'TEIJEIRO', startTime: '17:00', endTime: '20:00', notes: 'Neumonología Alergia' },
      { roomId: 'R1', shift: 'TARDE', docSearch: 'BARAYAZARRA', startTime: '18:00', endTime: '19:00', notes: 'Alergia' },
      { roomId: 'R5', shift: 'MANANA', docSearch: 'ARRIETA', startTime: '13:15', endTime: '16:15', notes: 'Ginecología' },
      { roomId: 'R4', shift: 'TARDE', docSearch: 'MISISIAN', startTime: '14:00', endTime: '19:00', notes: 'Ecógrafo' }
    ],
    // 1: MARTES
    [
      { roomId: 'R1', shift: 'TARDE', docSearch: 'GIOVO', startTime: '16:00', endTime: '19:00', notes: 'Dermatología' },
      { roomId: 'R4', shift: 'TARDE', docSearch: 'REVUELTA', startTime: '15:00', endTime: '18:30', notes: 'Dermatología' },
      { roomId: 'RPSICO', shift: 'TARDE', docSearch: 'DIAZ', startTime: '15:30', endTime: '19:00', notes: 'Psicología' },
      { roomId: 'R3', shift: 'TARDE', docSearch: 'SALICH', startTime: '16:20', endTime: '19:40', notes: 'Dermatología' },
      { roomId: 'RLABO', shift: 'MANANA', docSearch: 'PENA', startTime: '07:30', endTime: '10:00', notes: 'Bioquímico' },
      { roomId: 'RLABO', shift: 'TARDE', docSearch: 'PENA', startTime: '15:00', endTime: '18:00', notes: 'Bioquímico' },
      { roomId: 'R3', shift: 'MANANA', docSearch: 'PESCO', startTime: '13:00', endTime: '16:20', notes: 'Dermatología' },
      { roomId: 'R1', shift: 'MANANA', docSearch: 'GIANA', startTime: '09:20', endTime: '12:00', notes: 'Dermatología' },
      { roomId: 'R5', shift: 'TARDE', docSearch: 'GONZALEZ', startTime: '17:30', endTime: '19:30', notes: 'Dermatología' },
      { roomId: 'R5', shift: 'MANANA', docSearch: 'ORTIZ ROJAS', startTime: '11:20', endTime: '13:00', notes: 'Diabetología' },
      { roomId: 'R2', shift: 'TARDE', docSearch: 'LUCHETTA', startTime: '16:00', endTime: '19:00', notes: 'Cirugía Plástica' },
      { roomId: 'R6', shift: 'MANANA', docSearch: 'SCALERANDI', startTime: '14:00', endTime: '15:15', notes: 'Dermatología' },
      { roomId: 'R6', shift: 'TARDE', docSearch: 'SCALERANDI', startTime: '16:00', endTime: '19:00', notes: 'Dermatología' }
    ],
    // 2: MIÉRCOLES
    [
      { roomId: 'R4', shift: 'TARDE', docSearch: 'REVUELTA', startTime: '15:00', endTime: '19:45', notes: 'Dermatología' },
      { roomId: 'R1', shift: 'TARDE', docSearch: 'ARCE', startTime: '16:00', endTime: '19:00', notes: 'Dermatología' },
      { roomId: 'R5', shift: 'TARDE', docSearch: 'NIEVA', startTime: '15:00', endTime: '19:00', notes: 'Dermatología Infantil' },
      { roomId: 'RPSICO', shift: 'TARDE', docSearch: 'ACEVEDO', startTime: '15:30', endTime: '20:10', notes: 'Psicología' },
      { roomId: 'RPSICO', shift: 'MANANA', docSearch: 'ANDRIZZI', startTime: '10:00', endTime: '13:30', notes: 'Psicología' },
      { roomId: 'RLABO', shift: 'MANANA', docSearch: 'PENA', startTime: '07:30', endTime: '10:00', notes: 'Bioquímico' },
      { roomId: 'R2', shift: 'TARDE', docSearch: 'CRESPO', startTime: '15:00', endTime: '18:00', notes: 'Cosmetología' },
      { roomId: 'R3', shift: 'TARDE', docSearch: 'PESCO', startTime: '15:30', endTime: '19:40', notes: 'Dermatología' },
      { roomId: 'R3', shift: 'MANANA', docSearch: 'HAISAMA', startTime: '10:00', endTime: '14:40', notes: 'Dermatología' },
      { roomId: 'R6', shift: 'MANANA', docSearch: 'GRINBLAT', startTime: '10:30', endTime: '13:30', notes: 'Pediatría' },
      { roomId: 'R6', shift: 'TARDE', docSearch: 'ROMANAZZI', startTime: '13:00', endTime: '18:00', notes: 'Dermatología' },
      { roomId: 'RLABO', shift: 'TARDE', docSearch: 'FUREY', startTime: '15:20', endTime: '17:00', notes: 'Dermatología' }
    ],
    // 3: JUEVES
    [
      { roomId: 'R1', shift: 'MANANA', docSearch: 'ANDRADE', startTime: '08:15', endTime: '12:00', notes: 'Dermatología' },
      { roomId: 'R1', shift: 'TARDE', docSearch: 'PALACIO', startTime: '16:00', endTime: '20:00', notes: 'Dermatología' },
      { roomId: 'RLABO', shift: 'MANANA', docSearch: 'PENA', startTime: '07:30', endTime: '10:00', notes: 'Bioquímico' },
      { roomId: 'R6', shift: 'TARDE', docSearch: 'VERBERCK', startTime: '17:00', endTime: '18:40', notes: 'Flebología' },
      { roomId: 'R2', shift: 'MANANA', docSearch: 'CRESPO', startTime: '09:30', endTime: '12:30', notes: 'Cosmetología' },
      { roomId: 'R4', shift: 'MANANA', docSearch: 'PLUTO', startTime: '09:00', endTime: '11:40', notes: 'Dermatología' },
      { roomId: 'R5', shift: 'TARDE', docSearch: 'TEIJEIRO', startTime: '17:00', endTime: '20:00', notes: 'Neumonología Alergia' },
      { roomId: 'RPSICO', shift: 'TARDE', docSearch: 'MOREYRA', startTime: '14:00', endTime: '18:30', notes: 'Psicología' },
      { roomId: 'R3', shift: 'TARDE', docSearch: 'ORTIZ ROJAS', startTime: '16:00', endTime: '19:00', notes: 'Diabetología' },
      { roomId: 'R4', shift: 'TARDE', docSearch: 'LUCHETTA', startTime: '16:00', endTime: '19:00', notes: 'Cirugía Plástica' }
    ],
    // 4: VIERNES
    [
      { roomId: 'R4', shift: 'TARDE', docSearch: 'REVUELTA', startTime: '15:00', endTime: '19:00', notes: 'Dermatología' },
      { roomId: 'R5', shift: 'TARDE', docSearch: 'NIEVA', startTime: '15:00', endTime: '18:00', notes: 'Dermatología Infantil' },
      { roomId: 'RPSICO', shift: 'TARDE', docSearch: 'ANDRIZZI', startTime: '15:00', endTime: '19:30', notes: 'Psicología' },
      { roomId: 'R3', shift: 'TARDE', docSearch: 'PALACIO', startTime: '16:00', endTime: '20:00', notes: 'Dermatología' },
      { roomId: 'RLABO', shift: 'MANANA', docSearch: 'PENA', startTime: '07:30', endTime: '10:00', notes: 'Bioquímico' },
      { roomId: 'RLABO', shift: 'TARDE', docSearch: 'PENA', startTime: '16:00', endTime: '18:00', notes: 'Bioquímico' },
      { roomId: 'R2', shift: 'TARDE', docSearch: 'OLIVERO', startTime: '16:00', endTime: '20:00', notes: 'Endocrinología y Diabetes' },
      { roomId: 'R1', shift: 'MANANA', docSearch: 'PESCO', startTime: '09:20', endTime: '14:00', notes: 'Dermatología' },
      { roomId: 'R3', shift: 'MANANA', docSearch: 'HAISAMA', startTime: '11:00', endTime: '14:00', notes: 'Dermatología' },
      { roomId: 'R6', shift: 'TARDE', docSearch: 'SANTI', startTime: '16:00', endTime: '20:00', notes: 'Endocrinología y Diabetes' },
      { roomId: 'R5', shift: 'MANANA', docSearch: 'FARRELL', startTime: '09:00', endTime: '13:00', notes: 'Neumonología' }
    ]
  ];

  function findDoc(term) {
    const found = state.doctors.find(d => d.name.toUpperCase().includes(term.toUpperCase()));
    return found ? found.id : (state.doctors[0]?.id || 'D1');
  }

  // Ensure that a date has its template assignments initialized
  function ensureDateInitialized(dateStr) {
    if (!state.initializedDates) {
      state.initializedDates = [];
    }

    if (state.initializedDates.includes(dateStr)) {
      return;
    }

    // Determine day of week (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri)
    const parts = dateStr.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    
    // We only initialize Monday to Friday (1 to 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const templateIndex = dayOfWeek - 1; // 0 to 4
      const template = weeklyTemplate[templateIndex];
      if (template) {
        template.forEach((item, idx) => {
          const doctorId = findDoc(item.docSearch);
          state.assignments.push({
            id: `A_${dateStr}_${idx + 1}`,
            date: dateStr,
            roomId: item.roomId,
            shift: item.shift,
            doctorId: doctorId,
            startTime: item.startTime,
            endTime: item.endTime,
            notes: item.notes
          });
        });
      }
    }

    state.initializedDates.push(dateStr);
    saveData();
  }

  // Load state from localStorage or seed initial real data
  function initData() {
    const currentVersion = localStorage.getItem('giovo_data_version');
    
    if (currentVersion !== DATA_VERSION) {
      localStorage.setItem('giovo_data_version', DATA_VERSION);
      localStorage.removeItem('giovo_selected_date');
      state.selectedDate = getTodayString();
      seedInitialData();
    } else {
      const savedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      const savedDoctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      const savedAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      const savedShifts = localStorage.getItem(STORAGE_KEYS.SHIFTS);

      if (savedRooms && savedDoctors && savedAssignments) {
        state.rooms = JSON.parse(savedRooms);
        state.doctors = JSON.parse(savedDoctors);
        state.assignments = JSON.parse(savedAssignments);
        state.shifts = savedShifts ? JSON.parse(savedShifts) : { ...DEFAULT_SHIFTS };

        const savedInitDates = localStorage.getItem('giovo_initialized_dates_v1');
        state.initializedDates = savedInitDates ? JSON.parse(savedInitDates) : [];

        // Ensure Dr. Misisian Tomás is present and has ECOGRAFO specialty
        const misisianDoc = state.doctors.find(d => d.name.toUpperCase().includes('MISISIAN'));
        if (misisianDoc) {
          misisianDoc.specialty = 'ECOGRAFO';
        }
        saveData();
      } else {
        seedInitialData();
      }
    }

    // Set date input value
    const dateInput = document.getElementById('filterDate');
    if (dateInput) {
      dateInput.value = state.selectedDate;
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(state.rooms));
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(state.doctors));
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(state.assignments));
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(state.shifts));
    localStorage.setItem('giovo_initialized_dates_v1', JSON.stringify(state.initializedDates));
  }

  // Seed Initial Data (Real 34 Doctors and Consultorios for CENTRO GIOVO)
  function seedInitialData() {
    state.rooms = [
      { id: 'R1', name: 'Consultorio 1', floor: '', equipment: ['Camilla', 'Negatoscopio'], status: 'ACTIVE', color: '#255bb3' },
      { id: 'R2', name: 'Consultorio 2', floor: '', equipment: ['Camilla'], status: 'ACTIVE', color: '#f59e0b' },
      { id: 'R3', name: 'Consultorio 3', floor: '', equipment: ['Camilla'], status: 'ACTIVE', color: '#10b981' },
      { id: 'R4', name: 'Consultorio 4', floor: '', equipment: ['Camilla', 'Ecografo'], status: 'ACTIVE', color: '#d93b80' },
      { id: 'R5', name: 'Consultorio 5', floor: '', equipment: ['Camilla'], status: 'ACTIVE', color: '#8b5cf6' },
      { id: 'R6', name: 'Consultorio 6', floor: '', equipment: ['Camilla', 'RayosX'], status: 'ACTIVE', color: '#06b6d4' },
      { id: 'RLABO', name: 'Consultorio Laboratorio (Labo)', floor: '', equipment: ['Camilla'], status: 'ACTIVE', color: '#14b8a6' },
      { id: 'RPSICO', name: 'Consultorio Psicología (Psico)', floor: '', equipment: ['Camilla'], status: 'ACTIVE', color: '#a855f7' }
    ];

    // Real list of 34 Professionals from CENTRO GIOVO list
    const realDoctors = [
      { prefix: 'Dra.', name: 'DE BARAYAZARRA NORMA SUSANA', specialty: 'ALERGIA', roomRef: 'Consultorio 4', color: '#ef4444' },
      { prefix: 'Bioq.', name: 'PENA ANA DEL VALLE', specialty: 'BIOQUIMICO', roomRef: 'Consultorio Laboratorio (Labo)', color: '#14b8a6' },
      { prefix: 'Dr.', name: 'LUCHETTA GASTON HERNAN', specialty: 'CIRUGIA PLASTICA', roomRef: 'Consultorios 2 y 4', color: '#3b82f6' },
      { prefix: 'Csmt.', name: 'CRESPO VALENTINA', specialty: 'COSMETOLOGIA', roomRef: 'Consultorio 2', color: '#ec4899' },
      { prefix: 'Dra.', name: 'ANDRADE MARÍA NOELIA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 1', color: '#255bb3' },
      { prefix: 'Dr.', name: 'ARCE HERNAN', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 1', color: '#1d52a8' },
      { prefix: 'Dra.', name: 'CHALI CECILIA ROSANA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 3', color: '#10b981' },
      { prefix: 'Dra.', name: 'GIANA ANA DANIELA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 1', color: '#3b82f6' },
      { prefix: 'Dra.', name: 'GIOVO MARIA ELSA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 1', color: '#d93b80' },
      { prefix: 'Dra.', name: 'GONZALEZ ELEONORA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 4', color: '#f59e0b' },
      { prefix: 'Dr.', name: 'HAISAMA RODRIGO EZEQUIEL', specialty: 'DERMATOLOGIA', roomRef: 'Consultorios 1 y 3', color: '#8b5cf6' },
      { prefix: 'Dra.', name: 'MARTINEZ CARINA PAOLA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 4', color: '#ec4899' },
      { prefix: 'Dra.', name: 'PALACIO CAROLINA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 1', color: '#06b6d4' },
      { prefix: 'Dra.', name: 'PESCO MARÍA JOSÉ', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 1', color: '#14b8a6' },
      { prefix: 'Dra.', name: 'PLUTO MÓNICA VIVIANA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 4', color: '#f43f5e' },
      { prefix: 'Dra.', name: 'REVUELTA CORINA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 4', color: '#84cc16' },
      { prefix: 'Dra.', name: 'ROMANAZZI CHUMBITA VALENTINA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorios 6 y 1', color: '#a855f7' },
      { prefix: 'Dra.', name: 'SALICH HASSIBE DESIREE', specialty: 'DERMATOLOGIA', roomRef: 'Consultorio 3', color: '#10b981' },
      { prefix: 'Dra.', name: 'SCALERANDI FERMINA', specialty: 'DERMATOLOGIA', roomRef: 'Consultorios 2 y flotante', color: '#eab308' },
      { prefix: 'Dra.', name: 'NIEVA BETIANA DEL VALLE', specialty: 'DERMATOLOGIA INFANTIL', roomRef: 'Consultorio 5', color: '#ec4899' },
      { prefix: 'Dra.', name: 'ORTIZ ROJAS GIULIANA', specialty: 'DIABETOLOGIA', roomRef: 'Sin consultorio fijo', color: '#0284c7' },
      { prefix: 'Dr.', name: 'MISISIAN TOMÁS', specialty: 'ECOGRAFO', roomRef: 'Consultorio 6', color: '#06b6d4' },
      { prefix: 'Dr.', name: 'OLIVERO MARIANO', specialty: 'ENDOCRINOLOGIA Y DIABETES', roomRef: 'Consultorio 6', color: '#4f46e5' },
      { prefix: 'Dra.', name: 'SANTI CAMILA', specialty: 'ENDOCRINOLOGIA Y DIABETES', roomRef: 'Consultorio 6', color: '#f43f5e' },
      { prefix: 'Dr.', name: 'VERBERCK ANDRES WILFREDO', specialty: 'FLEBOLOGIA', roomRef: 'Consultorios 6 y 2', color: '#10b981' },
      { prefix: 'Dra.', name: 'MONTES CECILIA DEL CARMEN', specialty: 'GENETICA MEDICA', roomRef: 'Viene por turnos (Sin consultorio fijo)', color: '#8b5cf6' },
      { prefix: 'Dra.', name: 'ARRIETA MARIA SALOME', specialty: 'GINECOLOGIA Y OBSTETRICIA', roomRef: 'Consultorio 5', color: '#ec4899' },
      { prefix: 'Dra.', name: 'FARRELL PAMELA MARINA RITA', specialty: 'NEUMONOLOGIA', roomRef: 'Sin consultorio fijo', color: '#0284c7' },
      { prefix: 'Dr.', name: 'TEIJEIRO ÁLVARO', specialty: 'NEUMONOLOGIA ALERGIA', roomRef: 'Consultorio 5', color: '#255bb3' },
      { prefix: 'Dra.', name: 'GRINBLAT FLORENCIA', specialty: 'PEDIATRIA', roomRef: 'Consultorio 6', color: '#f59e0b' },
      { prefix: 'Lic.', name: 'ACEVEDO MARIA BELEN', specialty: 'PSICOLOGIA', roomRef: 'Consultorio Psicología (Psico)', color: '#a855f7' },
      { prefix: 'Lic.', name: 'ANDRIZZI VERÓNICA CECILIA', specialty: 'PSICOLOGIA', roomRef: 'Consultorio Psicología (Psico)', color: '#8b5cf6' },
      { prefix: 'Lic.', name: 'DIAZ YAMEL', specialty: 'PSICOLOGIA', roomRef: 'Consultorio Psicología (Psico)', color: '#6366f1' },
      { prefix: 'Lic.', name: 'MOREYRA GASTÓN', specialty: 'PSICOLOGIA', roomRef: 'Consultorio Psicología (Psico)', color: '#4f46e5' },
      { prefix: 'Dra.', name: 'FUREY FABIOLA', specialty: 'DERMATOLOGIA', roomRef: 'Sin consultorio fijo', color: '#10b981' }
    ];

    state.doctors = realDoctors.map((d, index) => ({
      id: `D${index + 1}`,
      name: `${d.prefix} ${d.name}`,
      specialty: d.specialty,
      phone: d.roomRef,
      color: d.color,
      notes: `Ubicación habitual: ${d.roomRef}`
    }));

    state.assignments = [];
    state.initializedDates = [];

    const currentWeekDates = getWeekDates(state.selectedDate);
    currentWeekDates.forEach(w => {
      ensureDateInitialized(w.dateStr);
    });

    // Also ensure 2026-08-03 week if distinct
    const monWeek = getWeekDates('2026-08-03');
    if (monWeek[0].dateStr !== currentWeekDates[0].dateStr) {
      monWeek.forEach(w => {
        ensureDateInitialized(w.dateStr);
      });
    }

    state.shifts = { ...DEFAULT_SHIFTS };
    saveData();
  }

  // Setup UI Event Listeners
  function setupEventListeners() {
    // View mode toggle buttons
    document.getElementById('btnDayView')?.addEventListener('click', () => {
      state.viewMode = 'day';
      document.getElementById('btnDayView').classList.add('active');
      document.getElementById('btnWeekView').classList.remove('active');
      renderAll();
    });
    document.getElementById('btnWeekView')?.addEventListener('click', () => {
      state.viewMode = 'week';
      document.getElementById('btnWeekView').classList.add('active');
      document.getElementById('btnDayView').classList.remove('active');
      renderAll();
    });
    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        const content = document.getElementById(targetTab);
        if (content) content.classList.add('active');

        // Refresh views if needed
        if (targetTab === 'tab-timeline') renderTimeline();
        if (targetTab === 'tab-doctors') renderDoctors();
        if (targetTab === 'tab-rooms') renderRoomsManage();
        if (targetTab === 'tab-print') renderPrintSheet();
      });
    });

    // Date Filters
    const dateInput = document.getElementById('filterDate');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        state.selectedDate = e.target.value;
        localStorage.setItem('giovo_selected_date', state.selectedDate);
        renderAll();
      });
    }

    document.getElementById('btnPrevDay')?.addEventListener('click', () => changeDateOffset(-1));
    document.getElementById('btnNextDay')?.addEventListener('click', () => changeDateOffset(1));
    document.getElementById('btnToday')?.addEventListener('click', () => {
      state.selectedDate = getTodayString();
      localStorage.setItem('giovo_selected_date', state.selectedDate);
      if (dateInput) dateInput.value = state.selectedDate;
      renderAll();
    });

    // Shift Selector Buttons
    document.querySelectorAll('#shiftSelector .segment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#shiftSelector .segment').forEach(s => s.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.selectedShift = e.currentTarget.getAttribute('data-shift');
        renderGrid();
      });
    });

    // Select Filters
    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
      state.selectedStatus = e.target.value;
      renderGrid();
    });

    document.getElementById('filterEquipment')?.addEventListener('change', (e) => {
      state.selectedEquipment = e.target.value;
      renderGrid();
    });

    const searchInput = document.getElementById('filterSearchDoc');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderGrid();
      });
    }

    document.getElementById('btnClearSearch')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      state.searchQuery = '';
      renderGrid();
    });

    // Action Header Buttons
    document.getElementById('btnQuickAssign')?.addEventListener('click', () => {
      openAssignModal(state.rooms[0]?.id || '', 'MANANA');
    });

    document.getElementById('btnSmartFinder')?.addEventListener('click', () => {
      openSmartFinderModal();
    });

    document.getElementById('btnHeaderAddDoctor')?.addEventListener('click', () => {
      openDoctorModal();
    });

    document.getElementById('btnAddDoctorModal')?.addEventListener('click', () => {
      openDoctorModal();
    });

    document.getElementById('btnQuickCreateDocFromAssign')?.addEventListener('click', () => {
      openDoctorModal(null, true);
    });

    document.getElementById('btnAddRoomModal')?.addEventListener('click', () => {
      openRoomModal();
    });

    // Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close');
        closeModal(modalId);
      });
    });

    // Backdrop click close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    // Forms Submissions
    document.getElementById('formAssign')?.addEventListener('submit', handleAssignSubmit);
    document.getElementById('formDoctor')?.addEventListener('submit', handleDoctorSubmit);
    document.getElementById('formRoom')?.addEventListener('submit', handleRoomSubmit);

    // Smart finder interactive triggers
    document.getElementById('smartDocSelect')?.addEventListener('change', updateSmartFinderResults);
    document.getElementById('smartDate')?.addEventListener('change', updateSmartFinderResults);
    document.getElementById('smartShift')?.addEventListener('change', updateSmartFinderResults);

    // Shift management event listeners
    document.getElementById('btnManageShifts')?.addEventListener('click', openShiftsModal);
    document.getElementById('formShift')?.addEventListener('submit', handleShiftSubmit);
    document.getElementById('btnCancelShiftEdit')?.addEventListener('click', resetShiftForm);

    // Dynamic shift changing inside assign modal
    document.getElementById('assignShiftSelect')?.addEventListener('change', (e) => {
      const selectedShiftKey = e.target.value;
      const currentShift = state.shifts[selectedShiftKey];
      if (currentShift && currentShift.hours) {
        const [start, end] = currentShift.hours.split('-').map(s => s.trim().replace(' hs', ''));
        const startInput = document.getElementById('assignStartTime');
        const endInput = document.getElementById('assignEndTime');
        if (startInput) startInput.value = start || '08:00';
        if (endInput) endInput.value = end || '13:00';
      }
    });
  }

  function changeDateOffset(offset) {
    const current = new Date(state.selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + offset);
    
    // Skip Saturdays (6) and Sundays (0)
    const day = current.getDay();
    if (day === 6) { // Saturday
      current.setDate(current.getDate() + (offset > 0 ? 2 : -1));
    } else if (day === 0) { // Sunday
      current.setDate(current.getDate() + (offset > 0 ? 1 : -2));
    }

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    state.selectedDate = `${yyyy}-${mm}-${dd}`;
    localStorage.setItem('giovo_selected_date', state.selectedDate);
    const dateInput = document.getElementById('filterDate');
    if (dateInput) dateInput.value = state.selectedDate;
    renderAll();
  }

  // Get array of 5 dates for the work week containing state.selectedDate (Monday to Friday)
  function getWeekDates(dateStr) {
    const parts = dateStr.split('-');
    const current = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
    const distToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(current);
    monday.setDate(current.getDate() - distToMon);

    const weekDates = [];
    for (let i = 0; i < 5; i++) { // Monday to Friday only
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      weekDates.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('es-ES', { month: 'short' }),
        isToday: `${yyyy}-${mm}-${dd}` === getTodayString()
      });
    }
    return weekDates;
  }

  // Main Render Controller
  function renderAll() {
    // Ensure dynamic template initialization on-the-fly for requested dates
    ensureDateInitialized(state.selectedDate);
    const weekDates = getWeekDates(state.selectedDate);
    weekDates.forEach(w => ensureDateInitialized(w.dateStr));

    renderKPIs();
    const roomsGridEl = document.getElementById('roomsGrid');
    const weekGridEl = document.getElementById('weekGrid');
    const btnDay = document.getElementById('btnDayView');
    const btnWeek = document.getElementById('btnWeekView');

    if (state.viewMode === 'day') {
      if (btnDay) btnDay.classList.add('active');
      if (btnWeek) btnWeek.classList.remove('active');
      renderGrid();
      if (roomsGridEl) roomsGridEl.classList.remove('d-none');
      if (weekGridEl) weekGridEl.classList.add('d-none');
    } else {
      if (btnWeek) btnWeek.classList.add('active');
      if (btnDay) btnDay.classList.remove('active');
      renderWeek();
      if (roomsGridEl) roomsGridEl.classList.add('d-none');
      if (weekGridEl) weekGridEl.classList.remove('d-none');
    }

    renderTimeline();
    renderDoctors();
    renderRoomsManage();
    renderPrintSheet();
  }

  // Render TAB 1 (Week Mode): Full 5-Day Weekly Grid for Consultorios (Mon-Fri)
  function renderWeek() {
    const container = document.getElementById('weekGrid');
    if (!container) return;

    const weekDates = getWeekDates(state.selectedDate);
    const firstDay = weekDates[0];
    const lastDay = weekDates[weekDates.length - 1];

    const titleEl = document.getElementById('gridTitleDay');
    const subTitleEl = document.getElementById('gridSubtitle');
    if (titleEl) titleEl.textContent = `Agenda Semanal (Semana del ${firstDay.dayNum} al ${lastDay.dayNum} de ${lastDay.monthName.toUpperCase()})`;
    if (subTitleEl) subTitleEl.textContent = `Disponibilidad de Consultorios por Turno (Mañana 07:00-14:00 hs / Tarde 14:00-21:00 hs)`;

    let html = `
      <div class="week-grid-wrapper">
        <table class="week-table">
          <thead>
            <tr>
              <th style="width: 200px; text-align: left;"><i class="fa-solid fa-clinic-medical"></i> Consultorio</th>
    `;

    weekDates.forEach(w => {
      html += `
        <th class="${w.isToday ? 'today-col' : ''}">
          <div style="font-size: 0.95rem; text-transform: capitalize;">${w.dayName}</div>
          <div style="font-size: 0.78rem; font-weight: 500; opacity: 0.9;">${w.dayNum} ${w.monthName}</div>
        </th>
      `;
    });

    html += `</tr></thead><tbody>`;

    // Filter rooms based on selected equipment / status
    const filteredRooms = state.rooms.filter(room => {
      if (state.selectedStatus === 'MAINT' && room.status !== 'MAINT') return false;
      if (state.selectedEquipment !== 'ALL' && !room.equipment.includes(state.selectedEquipment)) return false;
      return true;
    });

    filteredRooms.forEach(room => {
      const isMaint = room.status === 'MAINT';
      html += `<tr>`;
      html += `
        <td class="week-room-title-cell" style="border-left: 4px solid ${room.color};">
          <div style="font-weight: 800; font-size: 0.95rem;">${room.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${room.floor}</div>
        </td>
      `;

      weekDates.forEach(w => {
        html += `<td class="week-slot-cell">`;

        if (isMaint) {
          html += `
            <div class="week-card-shift" style="background: rgba(245,158,11,0.15); color: #d97706; text-align: center;">
              <i class="fa-solid fa-wrench"></i> Mantenimiento
            </div>
          `;
        } else {
          // Render shifts
          const shiftsToRender = state.selectedShift === 'ALL' ? Object.keys(state.shifts) : [state.selectedShift];

          shiftsToRender.forEach(shiftKey => {
            const shiftInfo = state.shifts[shiftKey];
            if (!shiftInfo) return;
            const assignments = state.assignments
                .filter(a => a.date === w.dateStr && a.roomId === room.id && a.shift === shiftKey)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (assignments.length > 0) {
              html += `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2px;">
                  <span class="week-shift-lbl" style="font-size:0.7rem; font-weight:700;"><i class="fa-regular ${shiftInfo.icon}"></i> ${shiftInfo.label}</span>
                  <button class="btn btn-emerald btn-xs" style="padding: 1px 4px; font-size: 0.65rem;" onclick="MediApp.openAssignModal('${room.id}', '${shiftKey}', null, '${w.dateStr}')" title="Agregar otro médico en esta franja">
                    <i class="fa-solid fa-plus"></i> Médico
                  </button>
                </div>
              `;
              assignments.forEach(assignment => {
                const doc = state.doctors.find(d => d.id === assignment.doctorId);
                const docName = doc ? doc.name : 'Médico';
                const docSpec = doc ? doc.specialty : '';
                const docColor = doc ? doc.color : '#3b82f6';

                // Filter check for search query
                if (state.searchQuery) {
                  const matchDoc = docName.toLowerCase().includes(state.searchQuery);
                  const matchSpec = docSpec.toLowerCase().includes(state.searchQuery);
                  if (!matchDoc && !matchSpec) return;
                }

                html += `
                  <div class="week-card-shift week-shift-busy" style="border-left-color: ${docColor}; margin-bottom: 4px;">
                    <div class="week-doc-name" style="font-weight:700;">${docName}</div>
                    <div class="week-doc-spec">${docSpec}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                      <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;"><i class="fa-regular fa-clock"></i> ${assignment.startTime}-${assignment.endTime}</span>
                      <button class="btn btn-secondary btn-xs" style="padding: 1px 5px; font-size: 0.68rem;" onclick="MediApp.editAssignment('${assignment.id}')" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button class="btn btn-danger btn-xs" style="padding: 1px 5px; font-size: 0.68rem; margin-left: 2px;" onclick="MediApp.removeAssignment('${assignment.id}')" title="Liberar">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                `;
              });
            } else {
              if (state.selectedStatus === 'BUSY' || state.searchQuery) return;

              html += `
                <div class="week-card-shift week-shift-free" style="margin-bottom: 4px;">
                  <div>
                    <span class="week-shift-lbl">${shiftInfo.label}</span>
                    <div style="font-size: 0.72rem;">Libre</div>
                  </div>
                  <button class="btn btn-emerald btn-xs" style="padding: 2px 6px; font-size: 0.7rem;" onclick="MediApp.openAssignModal('${room.id}', '${shiftKey}', null, '${w.dateStr}')">
                    + Asignar
                  </button>
                </div>
              `;
            }
          });
        }

        html += `</td>`;
      });

      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }

  // Calculate & Render KPI Cards
  function renderKPIs() {
    const totalRooms = state.rooms.length;
    document.getElementById('kpiTotalRooms').textContent = totalRooms;

    // Filter assignments for selected date
    const todayAssignments = state.assignments.filter(a => a.date === state.selectedDate);
    
    // Count active occupied room slots
    const busySlotsCount = todayAssignments.length;
    const totalSlots = totalRooms * Object.keys(state.shifts).length; // Dynamic shifts per day
    const freeSlotsCount = totalSlots - busySlotsCount;

    document.getElementById('kpiBusyCount').textContent = busySlotsCount;
    document.getElementById('kpiFreeCount').textContent = Math.max(0, freeSlotsCount);

    // Update Header Date Text
    const formattedDate = formatDateHuman(state.selectedDate);
    if (state.viewMode === 'day') {
      const titleEl = document.getElementById('gridTitleDay');
      if (titleEl) titleEl.textContent = `Ocupación de Consultorios (${formattedDate})`;
    }
  }

  function formatDateHuman(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Render TAB 1: Rooms Cards Grid (Day Mode)
  function renderGrid() {

    const container = document.getElementById('roomsGrid');
    if (!container) return;

    container.innerHTML = '';

    // Filter Rooms based on equipment & status
    const filteredRooms = state.rooms.filter(room => {
      if (state.selectedStatus === 'MAINT' && room.status !== 'MAINT') return false;
      if (state.selectedEquipment !== 'ALL' && !room.equipment.includes(state.selectedEquipment)) return false;
      return true;
    });

    if (filteredRooms.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <p style="color: var(--text-muted);">No se encontraron consultorios con los filtros seleccionados.</p>
        </div>
      `;
      return;
    }

    filteredRooms.forEach(room => {
      const isRoomMaint = room.status === 'MAINT';
      const card = document.createElement('div');
      card.style.background = room.color;
      card.style.color = '#fff';
      card.className = `room-card ${isRoomMaint ? 'maint-card' : ''}`;

      // Equipment tags HTML
      const eqHtml = room.equipment.map(eq => {
        const eqNames = {
          Camilla: 'Camilla',
          Ecografo: 'Ecógrafo',
          SillonOdonto: 'Sillón Odonto',
          RayosX: 'Rayos X',
          Negatoscopio: 'Negatoscopio'
        };
        return `<span class="eq-tag"><i class="fa-solid fa-check"></i> ${eqNames[eq] || eq}</span>`;
      }).join('');

      // Render Shifts slots
      const visibleShifts = state.selectedShift === 'ALL' 
        ? Object.keys(state.shifts) 
        : [state.selectedShift];

      let slotsHtml = '';

      if (isRoomMaint) {
        slotsHtml = `
          <div class="slot-item slot-maint">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Consultorio en mantenimiento / fuera de servicio</span>
          </div>
        `;
      } else {
        visibleShifts.forEach(shiftKey => {
          const shiftInfo = state.shifts[shiftKey];
          if (!shiftInfo) return;
          const assignments = state.assignments
            .filter(a => a.date === state.selectedDate && a.roomId === room.id && a.shift === shiftKey)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          if (assignments.length > 0) {
            assignments.forEach(assignment => {
              const doctor = state.doctors.find(d => d.id === assignment.doctorId);
              const docName = doctor ? doctor.name : 'Médico Desconocido';
              const docSpec = doctor ? doctor.specialty : 'Sin especialidad';
              const docColor = doctor ? doctor.color : '#3b82f6';
              const docInitial = docName.replace('Dr. ', '').replace('Dra. ', '').charAt(0) || 'M';
              if (state.selectedStatus === 'FREE') return;
              if (state.searchQuery) {
                const matchDoc = docName.toLowerCase().includes(state.searchQuery);
                const matchSpec = docSpec.toLowerCase().includes(state.searchQuery);
                if (!matchDoc && !matchSpec) return;
              }
              slotsHtml += `
                <div class="slot-item slot-busy">
                  <div class="doctor-assigned-card">
                    <div class="doc-avatar" style="background-color: ${docColor};">${docInitial}</div>
                    <div class="doc-details">
                      <div class="doc-name">${docName}</div>
                      <div class="doc-spec">${docSpec}</div>
                      <div class="doc-hours"><i class="fa-regular fa-clock"></i> ${shiftInfo.label} (${assignment.startTime} - ${assignment.endTime})</div>
                      ${assignment.notes ? `<div class="doc-notes-tag"><i class="fa-solid fa-comment-medical"></i> ${assignment.notes}</div>` : ''}
                    </div>
                  </div>
                  <div class="slot-actions">
                    <button class="btn btn-secondary btn-xs" onclick="MediApp.editAssignment('${assignment.id}')" title="Modificar horas, notas o médico">
                      <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button class="btn btn-secondary btn-xs" onclick="MediApp.reassignDoctor('${assignment.id}')" title="Mover o cambiar de consultorio">
                      <i class="fa-solid fa-arrow-right-arrow-left"></i> Reubicar
                    </button>
                    <button class="btn btn-danger btn-xs" onclick="MediApp.removeAssignment('${assignment.id}')" title="Liberar este turno">
                      <i class="fa-solid fa-trash-can"></i> Liberar
                    </button>
                    <button class="btn btn-emerald btn-xs" onclick="MediApp.openAssignModal('${room.id}', '${shiftKey}', null, '${state.selectedDate}')" title="Agregar otro médico en este turno">
                      <i class="fa-solid fa-plus"></i> Médico
                    </button>
                  </div>
                </div>
              `;
            });
          } else {
            if (state.selectedStatus === 'BUSY') return;
            if (state.searchQuery) return;
            slotsHtml += `
              <div class="slot-item slot-free">
                <div class="slot-free-content">
                  <div>
                    <span class="slot-time-lbl"><i class="fa-regular ${shiftInfo.icon}"></i> Turno ${shiftInfo.label}</span>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${shiftInfo.hours}</div>
                  </div>
                  <button class="btn btn-emerald btn-xs" onclick="MediApp.openAssignModal('${room.id}', '${shiftKey}')">
                    <i class="fa-solid fa-plus"></i> Asignar
                  </button>
                </div>
              </div>
            `;
          }
        });
      }

      card.innerHTML = `
        <div class="room-card-header">
          <div class="room-info-title">
            <div class="room-icon"><i class="fa-solid fa-door-closed"></i></div>
            <div>
              <h3>${room.name}</h3>
              <div class="room-floor"><i class="fa-solid fa-location-dot"></i> ${room.floor}</div>
            </div>
          </div>
        </div>
        <div class="equipment-tags">
          ${eqHtml}
        </div>
        <div class="shift-slots-container">
          ${slotsHtml || '<p style="font-size:0.8rem; color:var(--text-muted);">Sin turnos según filtro</p>'}
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Render TAB 2: Timeline Matrix View (dynamic columns based on SHIFTS)
  function renderTimeline() {
    const table = document.getElementById('timelineTable');
    if (!table) return;

    // Build header dynamically
    let headerHtml = `<thead><tr><th>Consultorio</th><th>Piso / Equipos</th>`;
    Object.values(state.shifts).forEach(shift => {
      headerHtml += `<th>${shift.label} (${shift.hours})</th>`;
    });
    headerHtml += `</tr></thead>`;

    let bodyHtml = '<tbody>';
    state.rooms.forEach(room => {
      bodyHtml += `<tr>`;
      bodyHtml += `<td class="timeline-room-cell">${room.name}</td>`;
      bodyHtml += `<td style="font-size: 0.78rem; color: var(--text-muted);">${room.floor}<br><small>${room.equipment.join(', ')}</small></td>`;
      Object.keys(state.shifts).forEach(shiftKey => {
        const assignments = state.assignments.filter(a =>
          a.date === state.selectedDate && a.roomId === room.id && a.shift === shiftKey
        );
        if (room.status === 'MAINT') {
          bodyHtml += `<td style="background: rgba(245,158,11,0.1); color: var(--color-maint); font-size: 0.8rem;"><i class="fa-solid fa-wrench"></i> Mantenimiento</td>`;
        } else if (assignments.length > 0) {
          const assignmentBlocks = assignments.map(assignment => {
            const doc = state.doctors.find(d => d.id === assignment.doctorId);
            const docName = doc ? doc.name : 'Médico';
            const docSpec = doc ? doc.specialty : '';
            const docColor = doc?.color || '#3b82f6';
            return `<div style="background: rgba(59,130,246,0.12); border-left: 3px solid ${docColor}; margin-bottom:4px;">
              <strong style="color: var(--text-main); font-size: 0.88rem;">${docName}</strong><br>
              <span style="font-size:0.78rem; color:#60a5fa;">${docSpec}</span><br>
              <small style="color: var(--text-muted);">${assignment.startTime} - ${assignment.endTime}</small>
              <div style="margin-top:4px;">
                <button class="btn btn-secondary btn-xs" onclick="MediApp.editAssignment('${assignment.id}')">Editar</button>
                <button class="btn btn-danger btn-xs" onclick="MediApp.removeAssignment('${assignment.id}')">Liberar</button>
              </div>
            </div>`;
          }).join('');
          bodyHtml += `<td style="background: rgba(16,185,129,0.05);">${assignmentBlocks}</td>`;
        } else {
          bodyHtml += `<td style="background: rgba(16,185,129,0.05); text-align: center;"><span style="color: var(--color-free); font-weight: 600; font-size: 0.78rem;">LIBRE</span><br>
            <button class="btn btn-emerald btn-xs" style="margin-top: 4px;" onclick="MediApp.openAssignModal('${room.id}', '${shiftKey}')">+ Asignar</button>
          </td>`;
        }
      });
      bodyHtml += `</tr>`;
    });
    bodyHtml += '</tbody>';
    table.innerHTML = headerHtml + bodyHtml;
  }

  // Render TAB 3: Doctors Directory (34 Professionals)
  function renderDoctors() {
    const container = document.getElementById('doctorsGrid');
    if (!container) return;

    container.innerHTML = state.doctors.map(doc => {
      const initial = doc.name.replace('Dr. ', '').replace('Dra. ', '').charAt(0) || 'M';
      return `
        <div class="doc-card-item">
          <div>
            <div class="doc-card-top">
              <div class="doc-card-avatar" style="background-color: ${doc.color};">${initial}</div>
              <div class="doc-card-meta">
                <h3>${doc.name}</h3>
                <p>${doc.specialty}</p>
              </div>
            </div>
            <div class="doc-card-details" style="margin-top: 1rem;">
              <div><i class="fa-solid fa-phone"></i> ${doc.phone || 'Sin contacto directo'}</div>
              <div><i class="fa-solid fa-note-sticky"></i> ${doc.notes || 'Sin notas adicionales'}</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem;">
            <button class="btn btn-secondary btn-xs" onclick="MediApp.editDoctor('${doc.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
            <button class="btn btn-danger btn-xs" onclick="MediApp.deleteDoctor('${doc.id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render TAB 4: Rooms Management
  function renderRoomsManage() {
    const container = document.getElementById('roomsManageGrid');
    if (!container) return;

    container.innerHTML = state.rooms.map(room => {
      const isMaint = room.status === 'MAINT';
      return `
        <div class="room-manage-card" style="${isMaint ? 'border-color: rgba(245, 158, 11, 0.4);' : ''}">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <h3 style="font-size: 1.1rem; font-weight: 700;">${room.name}</h3>
              <span class="badge-status ${isMaint ? 'badge-maint' : 'badge-free'}" style="${isMaint ? 'background:rgba(245,158,11,0.2); color:#f59e0b;' : ''}">
                ${isMaint ? 'Mantenimiento' : 'Activo'}
              </span>
            </div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              <i class="fa-solid fa-location-dot"></i> ${room.floor}
            </div>
            <div class="equipment-tags" style="background: transparent; padding: 0;">
              ${room.equipment.map(eq => `<span class="eq-tag"><i class="fa-solid fa-check"></i> ${eq}</span>`).join('')}
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
            <button class="btn btn-secondary btn-xs" onclick="MediApp.editRoom('${room.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
            <button class="btn btn-danger btn-xs" onclick="MediApp.deleteRoom('${room.id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Printable Daily Overview Sheet
  function renderPrintSheet() {
    const metaDate = document.getElementById('printMetaDate');
    const body = document.getElementById('printBody');
    if (!metaDate || !body) return;
  }

  // Modal Handlers & Actions
  function openAssignModal(roomId, shiftKey = 'MANANA', assignmentId = null, targetDate = null) {
    const room = state.rooms.find(r => r.id === roomId) || state.rooms[0];
    if (!room) return;

    let dateToSet = targetDate || state.selectedDate;

    if (assignmentId) {
      const assignment = state.assignments.find(a => a.id === assignmentId);
      if (assignment) {
        dateToSet = assignment.date || dateToSet;
        document.getElementById('modalAssignTitle').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Modificar Horario / Agenda de Médico`;
        document.getElementById('assignDoctorSelect').value = assignment.doctorId;
        document.getElementById('assignStartTime').value = assignment.startTime;
        document.getElementById('assignEndTime').value = assignment.endTime;
        document.getElementById('assignNotes').value = assignment.notes || '';
      }
    } else {
      document.getElementById('modalAssignTitle').innerHTML = `<i class="fa-solid fa-calendar-plus"></i> Asignar Médico a Consultorio`;
      document.getElementById('assignNotes').value = '';

      const shiftObj = state.shifts[shiftKey];
      let startTime = '08:00';
      let endTime = '13:00';
      if (shiftObj && shiftObj.hours) {
        const [start, end] = shiftObj.hours.split('-').map(s => s.trim().replace(' hs', ''));
        startTime = start || '08:00';
        endTime = end || '13:00';
      }
      document.getElementById('assignStartTime').value = startTime;
      document.getElementById('assignEndTime').value = endTime;
    }

    document.getElementById('assignId').value = assignmentId || '';
    document.getElementById('assignRoomId').value = room.id;
    document.getElementById('assignShiftId').value = shiftKey || 'MANANA';
    document.getElementById('assignDate').value = dateToSet;

    // Populate Doctor Dropdown
    populateDoctorDropdowns(assignmentId ? state.assignments.find(a => a.id === assignmentId)?.doctorId : null);

    // Populate Consultorio Dropdown
    const consultorioSelect = document.getElementById('assignConsultorioSelect');
    consultorioSelect.innerHTML = state.rooms.map(r => `<option value="${r.id}">${r.name} (${r.floor})</option>`).join('');
    consultorioSelect.value = room.id;

    // Shift Select
    const shiftSelect = document.getElementById('assignShiftSelect');
    if (shiftSelect) {
      shiftSelect.innerHTML = Object.entries(state.shifts).map(([id, shift]) => 
        `<option value="${id}">${shift.label} (${shift.hours} hs)</option>`
      ).join('');
      shiftSelect.value = shiftKey || Object.keys(state.shifts)[0] || 'MANANA';
    }

    // Summary Box
    const summaryEl = document.getElementById('assignTargetSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div><strong>Consultorio Actual:</strong> ${room.name} (${room.floor})</div>
        <div><strong>Fecha de Operación:</strong> ${formatDateHuman(dateToSet)}</div>
        <div><strong>Equipamiento disponible:</strong> ${room.equipment.join(', ') || 'Estándar'}</div>
      `;
    }

    const alertEl = document.getElementById('assignConflictAlert');
    if (alertEl) alertEl.classList.add('d-none');
    openModal('modalAssign');
  }

  function populateDoctorDropdowns(selectDoctorId = null) {
    const docSelect = document.getElementById('assignDoctorSelect');
    if (docSelect) {
      docSelect.innerHTML = state.doctors.map(d => 
        `<option value="${d.id}">${d.name} (${d.specialty})</option>`
      ).join('');

      if (selectDoctorId) docSelect.value = selectDoctorId;
    }
  }

  function editAssignment(assignmentId) {
    const assignment = state.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    openAssignModal(assignment.roomId, assignment.shift, assignmentId, assignment.date);
  }

  function handleAssignSubmit(e) {
  e.preventDefault();
  // Hide previous conflict alert
  const conflictEl = document.getElementById('assignConflictAlert');
  if (conflictEl) conflictEl.classList.add('d-none');
  const assignmentId = document.getElementById('assignId').value;
  const roomId = document.getElementById('assignConsultorioSelect').value || document.getElementById('assignRoomId').value;
  const shiftKey = document.getElementById('assignShiftSelect').value || document.getElementById('assignShiftId').value;
  const assignDate = document.getElementById('assignDate').value;
  const targetDate = assignDate || state.selectedDate;
  const doctorId = document.getElementById('assignDoctorSelect').value;
  const startTime = document.getElementById('assignStartTime').value;
  const endTime = document.getElementById('assignEndTime').value;
  const notes = document.getElementById('assignNotes').value.trim();

  // Debug logging
  console.log('Attempting assignment:', {
    doctorId,
    doctorName: state.doctors.find(d => d.id === doctorId)?.name,
    startTime,
    endTime,
    date: targetDate,
    roomId,
    shift: shiftKey,
    assignmentId: assignmentId || '(new)'
  });
  console.log('Existing assignments for same date/room:', state.assignments.filter(a => a.date === targetDate && a.roomId === roomId));

  // Helper to convert HH:MM to minutes
  const toMins = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const startMins = toMins(startTime);
  const endMins = toMins(endTime);
  if (startMins >= endMins) {
    alert('La hora de inicio debe ser anterior a la hora de fin.');
    return;
  }

  // Check for overlapping assignments in the same room/shift/date
  const hasOverlap = (newStart, newEnd, excludeId = null) => {
    return state.assignments.some(a => {
      if (a.date !== targetDate) return false;
      if (a.roomId !== roomId) return false;
      // Shift check removed to allow multiple assignments in same shift as long as times do not overlap
      if (excludeId && a.id === excludeId) return false;
      const aStart = toMins(a.startTime);
      const aEnd = toMins(a.endTime);
      return newStart < aEnd && aStart < newEnd;
    });
  };

  if (assignmentId) {
    // Editing existing assignment
    const idx = state.assignments.findIndex(a => a.id === assignmentId);
    if (idx >= 0) {
      // Check overlap and show detailed info
      if (hasOverlap(startMins, endMins, assignmentId)) {
        // Find one conflicting assignment for message
        const conflict = state.assignments.find(a => {
          if (a.date !== targetDate) return false;
          if (a.roomId !== roomId) return false;
          if (a.id === assignmentId) return false;
          const aStart = toMins(a.startTime);
          const aEnd = toMins(a.endTime);
          return startMins < aEnd && aStart < endMins;
        });
        const conflictDoc = conflict ? state.doctors.find(d => d.id === conflict.doctorId) : null;
        const conflictText = conflictDoc
          ? `Conflicto con ${conflictDoc.name} (${conflict.startTime} - ${conflict.endTime})`
          : 'Conflicto de horario.';
        const conflictEl = document.getElementById('assignConflictText');
        if (conflictEl) conflictEl.textContent = conflictText;
        document.getElementById('assignConflictAlert').classList.remove('d-none');
        return;
      }
      state.assignments[idx] = {
        id: assignmentId,
        date: targetDate,
        roomId: roomId,
        shift: shiftKey,
        doctorId: doctorId,
        startTime: startTime,
        endTime: endTime,
        notes: notes
      };
    }
  } else {
    // New assignment – ensure no overlap
      if (hasOverlap(startMins, endMins)) {
        // Find conflicting assignment for detailed message
        const conflict = state.assignments.find(a => {
          if (a.date !== targetDate) return false;
          if (a.roomId !== roomId) return false;
          const aStart = toMins(a.startTime);
          const aEnd = toMins(a.endTime);
          return startMins < aEnd && aStart < endMins;
        });
        const conflictDoc = conflict ? state.doctors.find(d => d.id === conflict.doctorId) : null;
        const conflictText = conflictDoc
          ? `Conflicto con ${conflictDoc.name} (${conflict.startTime} - ${conflict.endTime})`
          : 'Conflicto de horario.';
        const conflictEl = document.getElementById('assignConflictText');
        if (conflictEl) conflictEl.textContent = conflictText;
        document.getElementById('assignConflictAlert').classList.remove('d-none');
        return;
      }
    const newAssignment = {
      id: 'A_' + Date.now(),
      date: targetDate,
      roomId: roomId,
      shift: shiftKey,
      doctorId: doctorId,
      startTime: startTime,
      endTime: endTime,
      notes: notes
    };
    state.assignments.push(newAssignment);
  }

  saveData();
  renderAll();
  closeModal('modalAssign');
  showToast('Agenda de médico actualizada con éxito', 'success');
}

  function removeAssignment(id) {
    if (confirm('¿Está seguro de liberar este consultorio?')) {
      state.assignments = state.assignments.filter(a => a.id !== id);
      saveData();
      renderAll();
      showToast('Consultorio liberado', 'warning');
    }
  }

  function reassignDoctor(assignmentId) {
    const assignment = state.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Open Smart Finder preset to this doctor
    openSmartFinderModal(assignment.doctorId, assignment.shift);
  }

  // Smart Re-assignment Modal Logic
  function openSmartFinderModal(presetDoctorId = null, presetShift = 'MANANA') {
    const docSelect = document.getElementById('smartDocSelect');
    if (docSelect) {
      docSelect.innerHTML = state.doctors.map(d => 
        `<option value="${d.id}">${d.name} (${d.specialty})</option>`
      ).join('');
      if (presetDoctorId) docSelect.value = presetDoctorId;
    }

    const dateEl = document.getElementById('smartDate');
    if (dateEl) dateEl.value = state.selectedDate;
    const shiftEl = document.getElementById('smartShift');
    if (shiftEl) {
      shiftEl.innerHTML = `<option value="ALL">Cualquier turno</option>` + 
        Object.entries(state.shifts).map(([id, s]) => 
          `<option value="${id}">${s.label} (${s.hours} hs)</option>`
        ).join('');
      shiftEl.value = presetShift || 'ALL';
    }

    updateSmartFinderResults();
    openModal('modalSmart');
  }

  function updateSmartFinderResults() {
    const container = document.getElementById('smartResults');
    if (!container) return;

    const docSelect = document.getElementById('smartDocSelect');
    const selectedDocId = docSelect ? docSelect.value : (state.doctors[0]?.id || '');
    const dateEl = document.getElementById('smartDate');
    const date = dateEl ? dateEl.value : state.selectedDate;
    const shiftEl = document.getElementById('smartShift');
    const shift = shiftEl ? shiftEl.value : 'ALL';

    const doctor = state.doctors.find(d => d.id === selectedDocId);

    // Find available rooms for this date & shift
    const availableRooms = state.rooms.filter(room => {
      if (room.status === 'MAINT') return false;

      // Check if room is already occupied at this date & shift
      if (shift === 'ALL') {
        const hasAnyShiftBusy = state.assignments.some(a => a.date === date && a.roomId === room.id);
        return !hasAnyShiftBusy;
      }

      const isOccupied = state.assignments.some(a => 
        a.date === date && a.roomId === room.id && a.shift === shift
      );
      return !isOccupied;
    });

    if (availableRooms.length === 0) {
      container.innerHTML = `
        <div class="alert-box alert-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>No hay consultorios libres disponibles para la fecha y turno seleccionados.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = availableRooms.map(room => `
      <div class="smart-room-card recommended">
        <div class="smart-room-info">
          <h5><i class="fa-solid fa-door-open" style="color: var(--color-free);"></i> ${room.name}</h5>
          <p><i class="fa-solid fa-location-dot"></i> ${room.floor} &bull; Equipos: ${room.equipment.join(', ') || 'Estándar'}</p>
        </div>
        <button class="btn btn-emerald btn-xs" onclick="MediApp.confirmSmartAssign('${room.id}', '${selectedDocId}', '${date}', '${shift}')">
          <i class="fa-solid fa-check"></i> Asignar Aquí
        </button>
      </div>
    `).join('');
  }

  function confirmSmartAssign(roomId, doctorId, date, shift) {
    // Remove previous assignment for this doctor on this shift if any
    state.assignments = state.assignments.filter(a => !(a.date === date && a.doctorId === doctorId && a.shift === shift));

    // Times default
    const shiftObj = state.shifts[shift];
    let startTime = '08:00';
    let endTime = '13:00';
    if (shiftObj && shiftObj.hours) {
      const [start, end] = shiftObj.hours.split('-').map(s => s.trim().replace(' hs', ''));
      startTime = start || '08:00';
      endTime = end || '13:00';
    }

    state.assignments.push({
      id: 'A_' + Date.now(),
      date: date,
      roomId: roomId,
      shift: shift,
      doctorId: doctorId,
      startTime: startTime,
      endTime: endTime,
      notes: 'Asignado mediante asistente inteligente'
    });

    saveData();
    renderAll();
    closeModal('modalSmartFinder');
    showToast('Médico reubicado exitosamente', 'success');
  }

  // Doctor CRUD (Incorporaciones)
  let autoSelectNewDoctorInAssign = false;

  function openDoctorModal(docId = null, fromAssignModal = false) {
    autoSelectNewDoctorInAssign = fromAssignModal;
    document.getElementById('editDoctorId').value = docId || '';
    if (docId) {
      const d = state.doctors.find(doc => doc.id === docId);
      if (d) {
        document.getElementById('modalDoctorTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Profesional Médico`;
        document.getElementById('docName').value = d.name;
        document.getElementById('docSpecialty').value = d.specialty;
        document.getElementById('docPhone').value = d.phone || '';
        document.getElementById('docColor').value = d.color || '#3b82f6';
        document.getElementById('docNotes').value = d.notes || '';
      }
    } else {
      document.getElementById('modalDoctorTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Incorporación de Nuevo Profesional Médico`;
      document.getElementById('formDoctor').reset();
      document.getElementById('docColor').value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    }
    openModal('modalDoctor');
  }

  function handleDoctorSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editDoctorId').value;
    const name = document.getElementById('docName').value.trim();
    const specialty = document.getElementById('docSpecialty').value.trim();
    const phone = document.getElementById('docPhone').value.trim();
    const color = document.getElementById('docColor').value;
    const notes = document.getElementById('docNotes').value.trim();

    let newDocId = id;

    if (id) {
      const idx = state.doctors.findIndex(d => d.id === id);
      if (idx >= 0) {
        state.doctors[idx] = { id, name, specialty, phone, color, notes };
      }
    } else {
      newDocId = 'D_' + Date.now();
      state.doctors.push({
        id: newDocId,
        name, specialty, phone, color, notes
      });
    }

    saveData();
    renderDoctors();
    renderGrid();
    closeModal('modalDoctor');

    if (autoSelectNewDoctorInAssign) {
      populateDoctorDropdowns(newDocId);
      autoSelectNewDoctorInAssign = false;
    }

    showToast(`Profesional ${name} registrado con éxito (${state.doctors.length} médicos en total)`, 'success');
  }

  function deleteDoctor(docId) {
    if (confirm('¿Desea eliminar este médico del directorio?')) {
      state.doctors = state.doctors.filter(d => d.id !== docId);
      saveData();
      renderDoctors();
      renderGrid();
      showToast('Médico eliminado', 'warning');
    }
  }

  // Room CRUD
  function openRoomModal(roomId = null) {
    document.getElementById('editRoomId').value = roomId || '';
    if (roomId) {
      const r = state.rooms.find(room => room.id === roomId);
      if (r) {
        document.getElementById('modalRoomTitle').textContent = 'Editar Consultorio';
        document.getElementById('roomName').value = r.name;
        document.getElementById('roomFloor').value = r.floor;
        document.getElementById('roomStatus').value = r.status;
        
        document.querySelectorAll('#roomEqCheckboxes input').forEach(cb => {
          cb.checked = r.equipment.includes(cb.value);
        });
      }
    } else {
      document.getElementById('modalRoomTitle').textContent = 'Agregar Nuevo Consultorio';
      document.getElementById('formRoom').reset();
    }
    openModal('modalRoom');
  }

  function handleRoomSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editRoomId').value;
    const name = document.getElementById('roomName').value.trim();
    const floor = document.getElementById('roomFloor').value.trim();
    const status = document.getElementById('roomStatus').value;
    const equipment = Array.from(document.querySelectorAll('#roomEqCheckboxes input:checked')).map(cb => cb.value);

    if (id) {
      const idx = state.rooms.findIndex(r => r.id === id);
      if (idx >= 0) {
        state.rooms[idx] = { id, name, floor, equipment, status };
      }
    } else {
      state.rooms.push({
        id: 'R_' + Date.now(),
        name, floor, equipment, status
      });
    }

    saveData();
    renderAll();
    closeModal('modalRoom');
    showToast('Consultorio guardado correctamente', 'success');
  }

  function deleteRoom(roomId) {
    if (confirm('¿Desea eliminar este consultorio? Se cancelarán sus asignaciones asociadas.')) {
      state.rooms = state.rooms.filter(r => r.id !== roomId);
      state.assignments = state.assignments.filter(a => a.roomId !== roomId);
      saveData();
      renderAll();
      showToast('Consultorio eliminado', 'warning');
    }
  }

  // Modal Utility
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  // Toast Utility
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Shift / Module CRUD
  function openShiftsModal() {
    resetShiftForm();
    renderShiftsList();
    openModal('modalShifts');
  }

  function renderShiftsList() {
    const container = document.getElementById('shiftsListContainer');
    if (!container) return;

    if (Object.keys(state.shifts).length === 0) {
      container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem;">No hay módulos configurados.</p>`;
      return;
    }

    container.innerHTML = Object.entries(state.shifts).map(([id, shift]) => {
      const iconClass = shift.icon || 'fa-clock';
      return `
        <div class="shift-item-row">
          <div class="shift-item-info">
            <i class="fa-solid ${iconClass}"></i>
            <div>
              <div style="font-weight:700;">${shift.label}</div>
              <div class="shift-item-hours"><i class="fa-regular fa-clock"></i> ${shift.hours} hs</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 3px 6px;" onclick="MediApp.editShift('${id}')" title="Editar">
              <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
            </button>
            <button type="button" class="btn btn-danger btn-xs" style="padding: 3px 6px;" onclick="MediApp.deleteShift('${id}')" title="Eliminar">
              <i class="fa-solid fa-trash" style="font-size:0.75rem;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function editShift(shiftId) {
    const shift = state.shifts[shiftId];
    if (!shift) return;

    document.getElementById('shiftId').value = shiftId;
    document.getElementById('shiftLabel').value = shift.label;
    
    const [start, end] = shift.hours.split('-').map(s => s.trim().replace(' hs', ''));
    document.getElementById('shiftStart').value = start || '';
    document.getElementById('shiftEnd').value = end || '';
    document.getElementById('shiftIcon').value = shift.icon || 'fa-clock';

    document.getElementById('formShiftTitle').textContent = 'Editar Módulo:';
    document.getElementById('btnCancelShiftEdit').classList.remove('d-none');
    document.getElementById('btnSaveShift').textContent = 'Guardar Cambios';
  }

  function handleShiftSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('shiftId').value.trim();
    const label = document.getElementById('shiftLabel').value.trim();
    const start = document.getElementById('shiftStart').value;
    const end = document.getElementById('shiftEnd').value;
    const icon = document.getElementById('shiftIcon').value;

    const hours = `${start} - ${end}`;
    const newId = id || 'SHIFT_' + Date.now();

    state.shifts[newId] = {
      id: newId,
      label: label,
      hours: hours,
      icon: icon
    };

    saveData();
    renderAll();
    renderShiftsList();
    resetShiftForm();
    showToast('Módulo horario guardado', 'success');
  }

  function deleteShift(shiftId) {
    const shift = state.shifts[shiftId];
    if (!shift) return;

    // Check if there are assignments using this shift
    const count = state.assignments.filter(a => a.shift === shiftId).length;
    let confirmMsg = `¿Está seguro de eliminar el módulo "${shift.label}"?`;
    if (count > 0) {
      confirmMsg += `\n\nATENCIÓN: Se eliminarán también las ${count} asignaciones médicas asociadas a este módulo.`;
    }

    if (confirm(confirmMsg)) {
      delete state.shifts[shiftId];
      state.assignments = state.assignments.filter(a => a.shift !== shiftId);
      saveData();
      renderAll();
      renderShiftsList();
      resetShiftForm();
      showToast('Módulo horario eliminado', 'warning');
    }
  }

  function resetShiftForm() {
    document.getElementById('shiftId').value = '';
    document.getElementById('formShift').reset();
    document.getElementById('formShiftTitle').textContent = 'Agregar Nuevo Módulo:';
    document.getElementById('btnCancelShiftEdit').classList.add('d-none');
    document.getElementById('btnSaveShift').textContent = 'Agregar Módulo';
  }

  // Global namespace exports for inline onclick attributes
  window.MediApp = {
    openAssignModal,
    editAssignment,
    removeAssignment,
    reassignDoctor,
    confirmSmartAssign,
    editDoctor: openDoctorModal,
    deleteDoctor,
    editRoom: openRoomModal,
    deleteRoom,
    editShift,
    deleteShift
  };

})();
