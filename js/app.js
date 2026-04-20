/* ============================================
   APP PRINCIPAL - Controlador de la UI
   Conecta la lógica de negocio con el DOM
   ============================================ */

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Inicializa toda la aplicación
 */
function initApp() {
  renderStats();
  renderStudentsTable();
  renderGroupFilter();
  renderHistory();
  bindEvents();

  // Cargar datos de ejemplo si no hay estudiantes
  if (getStudents().length === 0) {
    loadSampleData();
  }
}

/**
 * Carga los estudiantes del grupo ADSO-136
 */
function loadSampleData() {
  const sampleStudents = [
    { name: 'Alisson Paola Jaramillo Echeverry', group: 'ADSO-136' },
    { name: 'Carlos Andrés Zuluaga Atehortua', group: 'ADSO-136' },
    { name: 'Daniela Zapata López', group: 'ADSO-136' },
    { name: 'David Antonio Pescador Durán', group: 'ADSO-136' },
    { name: 'David Buendia Ruiz', group: 'ADSO-136' },
    { name: 'Eric Daniel Barreto Chavez', group: 'ADSO-136' },
    { name: 'Jhoan Steven Murillo García', group: 'ADSO-136' },
    { name: 'Jhon Alejandro Patiño Agudelo', group: 'ADSO-136' },
    { name: 'Juan Camilo Valencia Rey', group: 'ADSO-136' },
    { name: 'Juan Carlos Combita Sandoval', group: 'ADSO-136' },
    { name: 'Juan David Ferrer Castillo', group: 'ADSO-136' },
    { name: 'Juan José Santamaria Muñoz', group: 'ADSO-136' },
    { name: 'Julián David Flórez Vera', group: 'ADSO-136' },
    { name: 'Maria Fernanda Huertas Montes', group: 'ADSO-136' },
    { name: 'Nelson Fabián Gallego Sánchez', group: 'ADSO-136' },
    { name: 'Santiago Moreno Piedrahita', group: 'ADSO-136' },
    { name: 'Santiago Palacio Tovar', group: 'ADSO-136' },
    { name: 'Santiago Tovar Zambrano', group: 'ADSO-136' },
    { name: 'Sebastian Ortega Barrero', group: 'ADSO-136' },
    { name: 'Stiven Andrés Robles Galán', group: 'ADSO-136' },
    { name: 'Valeria Arcila Hernández', group: 'ADSO-136' },
    { name: 'Valeria Becerra Giraldo', group: 'ADSO-136' },
  ];

  sampleStudents.forEach(s => addStudent(s.name, s.group));
  renderAll();
  showToast('Se cargaron los 22 estudiantes del grupo ADSO-136.', 'info');
}

// === BINDEO DE EVENTOS ===

function bindEvents() {
  // Formulario de agregar estudiante
  const addForm = document.getElementById('add-student-form');
  if (addForm) {
    addForm.addEventListener('submit', handleAddStudent);
  }

  // Botón de seleccionar
  const selectBtn = document.getElementById('btn-select-students');
  if (selectBtn) {
    selectBtn.addEventListener('click', handleSelectStudents);
  }

  // Búsqueda
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  // Filtro de grupo
  const groupFilter = document.getElementById('group-filter');
  if (groupFilter) {
    groupFilter.addEventListener('change', handleGroupFilter);
  }

  // Botón resetear selección
  const resetBtn = document.getElementById('btn-reset-selection');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetSelection);
  }

  // Botón limpiar historial
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', handleClearHistory);
  }

  // Botón resetear turnos
  const resetTurnsBtn = document.getElementById('btn-reset-turns');
  if (resetTurnsBtn) {
    resetTurnsBtn.addEventListener('click', handleResetTurns);
  }

  // Modal
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Cerrar modal con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// === HANDLERS ===

/**
 * Maneja agregar un nuevo estudiante
 */
function handleAddStudent(e) {
  e.preventDefault();

  const nameInput = document.getElementById('student-name');
  const groupInput = document.getElementById('student-group');

  const name = nameInput.value.trim();
  const group = groupInput.value.trim();

  if (!name || !group) {
    showToast('Por favor completa todos los campos.', 'error');
    return;
  }

  try {
    addStudent(name, group);
    showToast(`✨ ${name} agregado exitosamente.`, 'success');
    nameInput.value = '';
    // Mantener el grupo para facilitar agregar múltiples del mismo grupo
    renderAll();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/**
 * Maneja la selección aleatoria de estudiantes
 */
async function handleSelectStudents() {
  const countInput = document.getElementById('select-count');
  const groupFilter = document.getElementById('group-filter-select');
  const count = parseInt(countInput.value) || 3;
  const group = groupFilter ? groupFilter.value : 'all';

  try {
    // Resetear selección previa
    resetAllStatus();

    // Mostrar animación de ruleta
    const roulette = document.getElementById('roulette-container');
    const rouletteName = document.getElementById('roulette-name');
    const resultText = document.getElementById('roulette-result');
    const wheel = document.getElementById('roulette-wheel');
    const selectBtn = document.getElementById('btn-select-students');

    selectBtn.disabled = true;
    selectBtn.innerHTML = '⏳ Seleccionando...';

    if (roulette) {
      roulette.classList.add('active');
      wheel.classList.add('spinning');
      resultText.classList.remove('visible');

      // Animación de nombres aleatorios
      const available = getAvailableStudents(group);
      for (let i = 0; i < 20; i++) {
        const randomStudent = available[Math.floor(Math.random() * available.length)];
        rouletteName.textContent = randomStudent.name;
        await delay(80 + i * 15);
      }

      wheel.classList.remove('spinning');
    }

    const selected = selectStudentsForCleaning(count, group);

    if (roulette) {
      rouletteName.textContent = '🎉';
      resultText.textContent = `¡${selected.length} estudiante(s) seleccionado(s)!`;
      resultText.classList.add('visible');

      await delay(1500);
      roulette.classList.remove('active');
    }

    selectBtn.disabled = false;
    selectBtn.innerHTML = '🎲 Seleccionar Estudiantes';

    renderAll();
    renderSelectedStudents(selected);
    showToast(`🧹 Se seleccionaron ${selected.length} estudiante(s) para aseo.`, 'success');

  } catch (error) {
    const selectBtn = document.getElementById('btn-select-students');
    selectBtn.disabled = false;
    selectBtn.innerHTML = '🎲 Seleccionar Estudiantes';
    showToast(error.message, 'error');
  }
}

/**
 * Maneja la búsqueda de estudiantes
 */
function handleSearch(e) {
  const query = e.target.value;
  const students = searchStudents(query);
  renderStudentsTable(students);
}

/**
 * Maneja el filtro por grupo
 */
function handleGroupFilter(e) {
  const group = e.target.value;
  let students;

  if (group === 'all') {
    students = getStudents();
  } else {
    students = getStudents().filter(s => s.group === group);
  }

  renderStudentsTable(students);
}

/**
 * Maneja eliminar un estudiante
 */
function handleDeleteStudent(id) {
  const student = getStudents().find(s => s.id === id);
  if (!student) return;

  openModal(
    '🗑️ Eliminar Estudiante',
    `¿Estás seguro de eliminar a <strong>${student.name}</strong>? Esta acción no se puede deshacer.`,
    () => {
      try {
        removeStudent(id);
        renderAll();
        showToast(`${student.name} eliminado.`, 'info');
        closeModal();
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  );
}

/**
 * Maneja alternar exento
 */
function handleToggleExempt(id) {
  try {
    const student = toggleExempt(id);
    const status = student.status === 'exempt' ? 'exento' : 'disponible';
    showToast(`${student.name} marcado como ${status}.`, 'info');
    renderAll();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/**
 * Maneja resetear selección
 */
function handleResetSelection() {
  resetAllStatus();
  renderAll();
  // Limpiar sección de seleccionados
  const container = document.getElementById('selected-grid');
  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state__icon">🎲</div>
        <div class="empty-state__text">Presiona "Seleccionar" para elegir estudiantes</div>
      </div>
    `;
  }
  showToast('Selección reiniciada.', 'info');
}

/**
 * Maneja limpiar historial
 */
function handleClearHistory() {
  openModal(
    '🗑️ Limpiar Historial',
    '¿Estás seguro de eliminar todo el historial de selecciones?',
    () => {
      clearHistory();
      renderHistory();
      showToast('Historial limpiado.', 'info');
      closeModal();
    }
  );
}

/**
 * Maneja resetear turnos
 */
function handleResetTurns() {
  openModal(
    '🔄 Resetear Turnos',
    '¿Estás seguro de resetear los contadores de turnos de todos los estudiantes? Esto también restablecerá todos los estados.',
    () => {
      resetTurnCounts();
      renderAll();
      showToast('Turnos reseteados.', 'success');
      closeModal();
    }
  );
}

// === RENDERIZADO ===

/**
 * Renderiza todo
 */
function renderAll() {
  renderStats();
  renderStudentsTable();
  renderGroupFilter();
  renderHistory();
}

/**
 * Renderiza las estadísticas
 */
function renderStats() {
  const students = getStudents();
  const available = students.filter(s => s.status === 'available').length;
  const selected = students.filter(s => s.status === 'selected').length;
  const exempt = students.filter(s => s.status === 'exempt').length;

  setTextContent('stat-total', students.length);
  setTextContent('stat-available', available);
  setTextContent('stat-selected', selected);
  setTextContent('stat-exempt', exempt);
}

/**
 * Renderiza la tabla de estudiantes
 */
function renderStudentsTable(studentsList) {
  const tbody = document.getElementById('students-tbody');
  if (!tbody) return;

  const students = studentsList || getStudents();

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-state__icon">📋</div>
            <div class="empty-state__text">No hay estudiantes registrados</div>
            <div class="empty-state__subtext">Agrega estudiantes usando el formulario de arriba</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(student => `
    <tr>
      <td>
        <div class="student-info">
          <div class="student-avatar" style="background: ${student.color};">
            ${getInitials(student.name)}
          </div>
          <span class="student-name">${student.name}</span>
        </div>
      </td>
      <td>${student.group}</td>
      <td>
        <span class="badge badge--${student.status}">
          ${getStatusText(student.status)}
        </span>
      </td>
      <td>
        <span class="turn-count">${student.turnCount}</span>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn--icon" onclick="handleToggleExempt('${student.id}')"
                  title="${student.status === 'exempt' ? 'Quitar exención' : 'Marcar como exento'}"
                  id="exempt-btn-${student.id}">
            ${student.status === 'exempt' ? '✅' : '⏸️'}
          </button>
          <button class="btn--icon delete" onclick="handleDeleteStudent('${student.id}')"
                  title="Eliminar estudiante"
                  id="delete-btn-${student.id}">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Renderiza las tarjetas de estudiantes seleccionados
 */
function renderSelectedStudents(selected) {
  const container = document.getElementById('selected-grid');
  if (!container) return;

  if (!selected || selected.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state__icon">🎲</div>
        <div class="empty-state__text">Presiona "Seleccionar" para elegir estudiantes</div>
      </div>
    `;
    return;
  }

  container.innerHTML = selected.map((student, index) => `
    <div class="selected-card" style="animation-delay: ${index * 0.1}s">
      <div class="selected-card__avatar" style="background: ${student.color};">
        ${getInitials(student.name)}
      </div>
      <div class="selected-card__name">${student.name}</div>
      <div class="selected-card__task">📋 ${student.assignedTask}</div>
    </div>
  `).join('');
}

/**
 * Renderiza el filtro de grupos
 */
function renderGroupFilter() {
  const groups = getGroups();

  // Filtro en la tabla
  const tableFilter = document.getElementById('group-filter');
  if (tableFilter) {
    const currentValue = tableFilter.value;
    tableFilter.innerHTML = `<option value="all">Todos los grupos</option>`;
    groups.forEach(g => {
      tableFilter.innerHTML += `<option value="${g}" ${g === currentValue ? 'selected' : ''}>${g}</option>`;
    });
  }

  // Filtro en la selección
  const selectFilter = document.getElementById('group-filter-select');
  if (selectFilter) {
    const currentValue = selectFilter.value;
    selectFilter.innerHTML = `<option value="all">Todos los grupos</option>`;
    groups.forEach(g => {
      selectFilter.innerHTML += `<option value="${g}" ${g === currentValue ? 'selected' : ''}>${g}</option>`;
    });
  }
}

/**
 * Renderiza el historial
 */
function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const history = getHistory();

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📜</div>
        <div class="empty-state__text">Sin historial aún</div>
        <div class="empty-state__subtext">Las selecciones aparecerán aquí</div>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(entry => `
    <li class="history-item">
      <span class="history-item__date">${formatDate(entry.date)}</span>
      <span class="history-item__students">
        ${entry.students.map(s => `<strong>${s.name}</strong> → ${s.task}`).join(' · ')}
      </span>
    </li>
  `).join('');
}

// === MODAL ===

function openModal(title, message, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const confirmBtn = document.getElementById('modal-confirm');

  if (!overlay) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = `<p>${message}</p>`;

  // Remover listener anterior
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  newConfirmBtn.id = 'modal-confirm';

  newConfirmBtn.addEventListener('click', onConfirm);
  overlay.classList.add('active');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
}

// === UTILIDADES DE UI ===

function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function getStatusText(status) {
  const texts = {
    'available': '● Disponible',
    'selected': '★ Seleccionado',
    'exempt': '⏸ Exento'
  };
  return texts[status] || status;
}
