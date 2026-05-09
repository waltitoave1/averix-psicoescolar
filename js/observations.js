// ============================================================
//  Observations Module
// ============================================================

const OBS_AREAS = ['Lectoescritura', 'Matemáticas', 'Atención', 'Conducta',
  'Habilidades Sociales', 'Regulación Emocional'];

let obsData = [];
let obsFilter = '';

async function loadObservations() {
  const el = document.getElementById('view-observations');
  el.innerHTML = '<div class="loading">Cargando observaciones...</div>';

  const { data, error } = await db.from('observations')
    .select('*, students(name, grade)')
    .order('date', { ascending: false });

  if (error) { el.innerHTML = '<div class="loading">Error al cargar observaciones.</div>'; return; }
  obsData = data || [];
  renderObservations();
}
window.loadObservations = loadObservations;

function renderObservations() {
  const el = document.getElementById('view-observations');
  const filtered = obsFilter
    ? obsData.filter(o => o.student_id === obsFilter)
    : obsData;

  const studentFilterOpts = `<option value="">— Todos los estudiantes —</option>` +
    App.students.map(s => `<option value="${s.id}" ${obsFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

  let itemsHTML = '';
  if (filtered.length === 0) {
    itemsHTML = `<div class="empty-state"><div class="empty-state-icon">👁️</div><h3>Sin observaciones</h3><p>Registra la primera observación con el botón de arriba.</p></div>`;
  } else {
    filtered.forEach(o => {
      itemsHTML += `
        <div class="list-item" onclick="showObsForm('${o.id}')">
          <div class="list-item-header">
            <span class="item-student-name">${escHtml(o.students?.name || '—')}</span>
            <span class="tag">${escHtml(o.area)}</span>
            <span class="item-date">${fmtDate(o.date)}</span>
          </div>
          <div class="item-text">${escHtml(o.text)}</div>
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Observaciones</h1>
      <p class="page-desc">Registro de observaciones por área de desarrollo</p>
    </div>
    <div class="toolbar">
      <select class="filter-select" onchange="setObsFilter(this.value)">${studentFilterOpts}</select>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showObsForm(null)">+ Nueva Observación</button>
    </div>
    <div class="items-list">${itemsHTML}</div>
  `;
}

function setObsFilter(val) { obsFilter = val; renderObservations(); }
window.setObsFilter = setObsFilter;

function showObsForm(id) {
  const obs = id ? obsData.find(o => o.id === id) : null;
  const areaOpts = OBS_AREAS.map(a =>
    `<option value="${a}" ${obs?.area === a ? 'selected' : ''}>${a}</option>`
  ).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">Estudiante <span>*</span></label>
      <select id="f-student" class="form-select">${studentOptions(obs?.student_id)}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Fecha <span>*</span></label>
        <input id="f-date" class="form-input" type="date" value="${obs?.date || new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label class="form-label">Área</label>
        <select id="f-area" class="form-select"><option value="">Seleccionar...</option>${areaOpts}</select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Observación <span>*</span></label>
      <textarea id="f-text" class="form-textarea" rows="4">${escHtml(obs?.text || '')}</textarea>
    </div>
  `;

  openModal({
    title: obs ? 'Editar Observación' : 'Nueva Observación',
    body,
    onSave: 'saveObs',
    editId: obs?.id || null,
    onDelete: obs ? 'deleteObs' : null,
  });
  if (id) document.getElementById('modal-footer').dataset.editId = id;
}
window.showObsForm = showObsForm;

async function saveObs() {
  const student_id = document.getElementById('f-student').value;
  const date = document.getElementById('f-date').value;
  const text = document.getElementById('f-text').value.trim();
  if (!student_id) { showToast('Selecciona un estudiante.', 'error'); return; }
  if (!date) { showToast('La fecha es obligatoria.', 'error'); return; }
  if (!text) { showToast('La observación no puede estar vacía.', 'error'); return; }

  const payload = { student_id, date, area: document.getElementById('f-area').value, text };
  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('observations').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('observations').insert([payload]));
  }

  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Observación actualizada.' : 'Observación registrada.', 'success');
  closeModal();
  loadObservations();
}
window.saveObs = saveObs;

async function deleteObs(id) {
  if (!confirm('¿Eliminar esta observación?')) return;
  const { error } = await db.from('observations').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Observación eliminada.', 'success');
  closeModal();
  loadObservations();
}
window.deleteObs = deleteObs;
