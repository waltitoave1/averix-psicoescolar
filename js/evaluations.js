// ============================================================
//  Evaluations Module — 49 areas in exact order
// ============================================================

const EVAL_AREAS = [
  'Lectura','Escritura','Comprensión Lectora','Producción de Texto','Cálculo',
  'Memoria y Atención','Manejo de la Lengua','Área Cognitiva','Área Lingüística',
  'Área Espacial - Motriz','Conceptos Básicos','Percepción Visual','Correspondencia',
  'Números Ordinales','Reproducción de Figuras y Secuencia',
  'Reconocimiento de Figuras Geométricas','Reconocimiento y Producción de Números',
  'Cardinalidad','Conservación','Numeración','Geometría','Información y Azar',
  'Cantidad y Conteo','Geometría y Medida','Series','Clasificación',
  'Capacidades Espaciales','Organización Perceptiva','Ortografía Visual y Reglada',
  'Grafomotricidad','Reflexividad','Pensamiento Analógico','Ortografía Fonética',
  'Razonamiento Lógico','Cálculo y Numeración','Analogías Verbales',
  'Razonamiento Perceptivo','Ortografía','Analogías','Conciencia Fonológica',
  'Conocimiento de Vocales','Números','Operaciones','Patrones de Álgebra',
  'Datos y Probabilidad','Números y Operaciones','Álgebra y Funciones',
  'Probabilidades y Estadísticas','Memoria Verbal'
];

let evalData = [];
let evalFilter = '';

async function loadEvaluations() {
  const el = document.getElementById('view-evaluations');
  el.innerHTML = '<div class="loading">Cargando evaluaciones...</div>';

  const { data, error } = await db.from('evaluations')
    .select('*, students(name, grade)')
    .order('date', { ascending: false });

  if (error) { el.innerHTML = '<div class="loading">Error al cargar evaluaciones.</div>'; return; }
  evalData = data || [];
  renderEvaluations();
}
window.loadEvaluations = loadEvaluations;

function renderEvaluations() {
  const el = document.getElementById('view-evaluations');
  const filtered = evalFilter
    ? evalData.filter(e => e.student_id === evalFilter)
    : evalData;

  const studentFilterOpts = `<option value="">— Todos los estudiantes —</option>` +
    App.students.map(s => `<option value="${s.id}" ${evalFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

  let itemsHTML = '';
  if (filtered.length === 0) {
    itemsHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Sin evaluaciones</h3><p>Registra la primera evaluación.</p></div>`;
  } else {
    filtered.forEach(e => {
      const score = e.score !== null && e.score !== undefined ? e.score : '—';
      itemsHTML += `
        <div class="list-item" onclick="showEvalForm('${e.id}')">
          <div class="list-item-header">
            <span class="item-student-name">${escHtml(e.students?.name || '—')}</span>
            <span class="tag">${escHtml(e.area)}</span>
            <span class="item-date">${fmtDate(e.date)}</span>
            <span class="eval-score">${score}</span>
          </div>
          ${e.instrument ? `<div class="item-text" style="margin-bottom:4px"><strong>Instrumento:</strong> ${escHtml(e.instrument)}</div>` : ''}
          ${e.notes ? `<div class="item-text">${escHtml(e.notes)}</div>` : ''}
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Evaluaciones</h1>
      <p class="page-desc">Resultados de evaluaciones psicopedagógicas por área</p>
    </div>
    <div class="toolbar">
      <select class="filter-select" onchange="setEvalFilter(this.value)">${studentFilterOpts}</select>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showEvalForm(null)">+ Nueva Evaluación</button>
    </div>
    <div class="items-list">${itemsHTML}</div>
  `;
}

function setEvalFilter(val) { evalFilter = val; renderEvaluations(); }
window.setEvalFilter = setEvalFilter;

function showEvalForm(id) {
  const ev = id ? evalData.find(e => e.id === id) : null;
  const areaOpts = EVAL_AREAS.map(a =>
    `<option value="${a}" ${ev?.area === a ? 'selected' : ''}>${a}</option>`
  ).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">Estudiante <span>*</span></label>
      <select id="f-student" class="form-select">${studentOptions(ev?.student_id)}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Fecha <span>*</span></label>
        <input id="f-date" class="form-input" type="date" value="${ev?.date || new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label class="form-label">Puntaje (0-100) <span>*</span></label>
        <input id="f-score" class="form-input" type="number" min="0" max="100" value="${ev?.score ?? ''}" placeholder="0-100" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Área <span>*</span></label>
      <select id="f-area" class="form-select">
        <option value="">Seleccionar área...</option>
        ${areaOpts}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Instrumento evaluativo</label>
      <input id="f-instrument" class="form-input" type="text" value="${escHtml(ev?.instrument || '')}" placeholder="Nombre del instrumento" />
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea id="f-notes" class="form-textarea">${escHtml(ev?.notes || '')}</textarea>
    </div>
  `;

  openModal({
    title: ev ? 'Editar Evaluación' : 'Nueva Evaluación',
    body,
    onSave: 'saveEval',
    editId: ev?.id || null,
    onDelete: ev ? 'deleteEval' : null,
  });
  if (id) document.getElementById('modal-footer').dataset.editId = id;
}
window.showEvalForm = showEvalForm;

async function saveEval() {
  const student_id = document.getElementById('f-student').value;
  const date = document.getElementById('f-date').value;
  const area = document.getElementById('f-area').value;
  const scoreRaw = document.getElementById('f-score').value;
  if (!student_id) { showToast('Selecciona un estudiante.', 'error'); return; }
  if (!date) { showToast('La fecha es obligatoria.', 'error'); return; }
  if (!area) { showToast('El área es obligatoria.', 'error'); return; }
  if (scoreRaw === '') { showToast('El puntaje es obligatorio.', 'error'); return; }

  const payload = {
    student_id, date, area,
    score: parseInt(scoreRaw, 10),
    instrument: document.getElementById('f-instrument').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
  };
  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('evaluations').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('evaluations').insert([payload]));
  }
  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Evaluación actualizada.' : 'Evaluación registrada.', 'success');
  closeModal();
  loadEvaluations();
}
window.saveEval = saveEval;

async function deleteEval(id) {
  if (!confirm('¿Eliminar esta evaluación?')) return;
  const { error } = await db.from('evaluations').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Evaluación eliminada.', 'success');
  closeModal();
  loadEvaluations();
}
window.deleteEval = deleteEval;
