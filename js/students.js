/* ============================================
   MÓDULO DE GESTIÓN DE ESTUDIANTES
   Maneja la lógica CRUD y el almacenamiento
   ============================================ */

// Clave para localStorage
const STORAGE_KEY = 'aseo_students';
const HISTORY_KEY = 'aseo_history';

// Colores para avatares
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1'
];

// Tareas de aseo disponibles
const CLEANING_TASKS = [
  'Barrer salón',
  'Trapear salón',
  'Limpiar tablero',
  'Organizar sillas',
  'Limpiar ventanas',
  'Vaciar papelera',
  'Barrer pasillos',
  'Limpiar escritorio del profesor'
];

/**
 * Obtiene la lista de estudiantes desde localStorage
 * @returns {Array} Lista de estudiantes
 */
function getStudents() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Guarda la lista de estudiantes en localStorage
 * @param {Array} students - Lista de estudiantes a guardar
 */
function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

/**
 * Agrega un nuevo estudiante
 * @param {string} name - Nombre del estudiante
 * @param {string} group - Grupo del estudiante
 * @returns {Object} El estudiante creado
 */
function addStudent(name, group) {
  const students = getStudents();

  // Verificar duplicados
  const exists = students.some(
    s => s.name.toLowerCase() === name.trim().toLowerCase() && s.group === group
  );

  if (exists) {
    throw new Error(`El estudiante "${name}" ya existe en el grupo ${group}.`);
  }

  const student = {
    id: generateId(),
    name: name.trim(),
    group: group,
    turnCount: 0,
    status: 'available', // available | selected | exempt
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    createdAt: new Date().toISOString()
  };

  students.push(student);
  saveStudents(students);
  return student;
}

/**
 * Elimina un estudiante por su ID
 * @param {string} id - ID del estudiante
 * @returns {boolean} true si se eliminó correctamente
 */
function removeStudent(id) {
  let students = getStudents();
  const initialLength = students.length;
  students = students.filter(s => s.id !== id);

  if (students.length === initialLength) {
    throw new Error('Estudiante no encontrado.');
  }

  saveStudents(students);
  return true;
}

/**
 * Actualiza un estudiante existente
 * @param {string} id - ID del estudiante
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} El estudiante actualizado
 */
function updateStudent(id, updates) {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);

  if (index === -1) {
    throw new Error('Estudiante no encontrado.');
  }

  students[index] = { ...students[index], ...updates };
  saveStudents(students);
  return students[index];
}

/**
 * Obtiene los estudiantes disponibles para selección
 * @param {string} [group] - Filtrar por grupo (opcional)
 * @returns {Array} Estudiantes disponibles
 */
function getAvailableStudents(group) {
  let students = getStudents().filter(s => s.status === 'available');
  if (group && group !== 'all') {
    students = students.filter(s => s.group === group);
  }
  return students;
}

/**
 * Selecciona estudiantes al azar de forma equitativa
 * Prioriza a quienes tienen menos turnos realizados
 * @param {number} count - Cantidad de estudiantes a seleccionar
 * @param {string} [group] - Filtrar por grupo (opcional)
 * @returns {Array} Estudiantes seleccionados con tarea asignada
 */
function selectStudentsForCleaning(count, group) {
  const available = getAvailableStudents(group);

  if (available.length === 0) {
    throw new Error('No hay estudiantes disponibles para seleccionar.');
  }

  if (count > available.length) {
    throw new Error(`Solo hay ${available.length} estudiante(s) disponible(s). Solicitaste ${count}.`);
  }

  // Ordenar por menor cantidad de turnos y agregar algo de aleatoriedad
  const sorted = available.sort((a, b) => {
    const diff = a.turnCount - b.turnCount;
    if (diff !== 0) return diff;
    return Math.random() - 0.5; // Aleatorio para empates
  });

  // Tomar los primeros 'count' estudiantes
  const selected = sorted.slice(0, count);

  // Asignar tareas aleatorias
  const shuffledTasks = shuffleArray([...CLEANING_TASKS]);
  const result = selected.map((student, index) => ({
    ...student,
    assignedTask: shuffledTasks[index % shuffledTasks.length]
  }));

  // Actualizar contadores de turno
  const allStudents = getStudents();
  result.forEach(sel => {
    const idx = allStudents.findIndex(s => s.id === sel.id);
    if (idx !== -1) {
      allStudents[idx].turnCount += 1;
      allStudents[idx].status = 'selected';
    }
  });
  saveStudents(allStudents);

  // Guardar en historial
  saveToHistory(result);

  return result;
}

/**
 * Restablece el estado de todos los estudiantes a 'available'
 */
function resetAllStatus() {
  const students = getStudents();
  students.forEach(s => {
    if (s.status === 'selected') {
      s.status = 'available';
    }
  });
  saveStudents(students);
}

/**
 * Alterna el estado de exento de un estudiante
 * @param {string} id - ID del estudiante
 * @returns {Object} El estudiante actualizado
 */
function toggleExempt(id) {
  const students = getStudents();
  const student = students.find(s => s.id === id);

  if (!student) {
    throw new Error('Estudiante no encontrado.');
  }

  student.status = student.status === 'exempt' ? 'available' : 'exempt';
  saveStudents(students);
  return student;
}

/**
 * Obtiene los grupos únicos de estudiantes
 * @returns {Array} Lista de grupos
 */
function getGroups() {
  const students = getStudents();
  return [...new Set(students.map(s => s.group))].sort();
}

/**
 * Busca estudiantes por nombre
 * @param {string} query - Texto de búsqueda
 * @returns {Array} Estudiantes que coinciden
 */
function searchStudents(query) {
  if (!query) return getStudents();
  const lower = query.toLowerCase();
  return getStudents().filter(s =>
    s.name.toLowerCase().includes(lower) ||
    s.group.toLowerCase().includes(lower)
  );
}

// === HISTORIAL ===

/**
 * Guarda una selección en el historial
 * @param {Array} selectedStudents - Estudiantes seleccionados
 */
function saveToHistory(selectedStudents) {
  const history = getHistory();
  history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    students: selectedStudents.map(s => ({
      name: s.name,
      group: s.group,
      task: s.assignedTask
    }))
  });

  // Mantener solo los últimos 50 registros
  if (history.length > 50) {
    history.splice(50);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Obtiene el historial de selecciones
 * @returns {Array} Historial
 */
function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Limpia todo el historial
 */
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Resetea los contadores de turnos de todos los estudiantes
 */
function resetTurnCounts() {
  const students = getStudents();
  students.forEach(s => {
    s.turnCount = 0;
    s.status = 'available';
  });
  saveStudents(students);
}
