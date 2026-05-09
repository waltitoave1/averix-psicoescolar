// ============================================================
//  Activities Module
// ============================================================

const ACT_AREAS = ['Lectoescritura','Matemáticas','Atención','Habilidades Sociales',
  'Memoria','Funciones Ejecutivas'];

const ACT_LEVELS = ['Pre-Kinder','Kinder','1° Básico','2° Básico',
  '3°-4° Básico','5°-6° Básico','Todos'];

const SEED_ACTIVITIES = [
  {
    title: 'Conciencia Fonológica - Segmentación Silábica',
    area: 'Lectoescritura',
    level: '1° Básico',
    duration: '25 min',
    description: 'Trabajar segmentación silábica mediante juegos de palabras y aplausos. El estudiante separa en sílabas palabras de distintas longitudes, primero con apoyo visual y luego de forma autónoma. Se utiliza material concreto (tarjetas de imágenes) para motivar la actividad.',
  },
  {
    title: 'Atención Sostenida - Tachado Selectivo',
    area: 'Atención',
    level: 'Todos',
    duration: '15 min',
    description: 'Láminas con estímulos variados (letras, números, figuras) para identificar y tachar selectivamente el estímulo objetivo. Se presentan en orden de dificultad creciente. Permite evaluar y entrenar la atención sostenida y selectiva, con registro de tiempo y precisión.',
  },
];

let actData = [];
let actSearch = '';

async function loadActivities() {
  const el = document.getElementById('view-activities');
  el.innerHTML = '<div class="loading">Cargando actividades...</div>';

  const { data, error } = await db.from('activities').select('*').order('created_at');
  if (error) { el.innerHTML = '<div class="loading">Error al cargar actividades.</div>'; return; }

  if (!data || data.length === 0) {
    await db.from('activities').insert(SEED_ACTIVITIES);
    const { data: seeded } = await db.from('activities').select('*').order('created_at');
    actData = seeded || [];
  } else {
    actData = data;
  }
  renderActivities();
}
window.loadActivities = loadActivities;

function renderActivities() {
  const el = document.getElementById('view-activities');
  const val = (document.getElementById('activities-search')?.value || actSearch).toLowerCase();
  actSearch = val;

  const filtered = actData.filter(a =>
    a.title.toLowerCase().includes(val) || (a.area || '').toLowerCase().includes(val)
  );

  let cardsHTML = '';
  if (filtered.length === 0) {
    cardsHTML = `<div class="empty-state"><div class="empty-state-icon">🎨</div><h3>Sin actividades</h3><p>Agrega una actividad para comenzar.</p></div>`;
  } else {
    filtered.forEach(a => {
      cardsHTML += `
        <div class="activity-card" onclick="showActForm('${a.id}')">
          <div class="activity-title">${escHtml(a.title)}</div>
          <div class="activity-badges">
            <span class="tag">${escHtml(a.area || '')}</span>
            <span class="badge" style="background:#e0e7ff;color:#3730a3">${escHtml(a.level || '')}</span>
          </div>
          ${a.duration ? `<div class="activity-duration">⏱ ${escHtml(a.duration)}</div>` : ''}
          <div class="activity-desc">${escHtml(a.description)}</div>
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Actividades</h1>
      <p class="page-desc">Banco de actividades psicopedagógicas por área y nivel</p>
    </div>
    <div class="toolbar">
      <input id="activities-search" class="search-input" type="text" placeholder="Buscar actividades..." oninput="filterActivities()" value="${escHtml(actSearch)}" />
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showActForm(null)">+ Nueva Actividad</button>
    </div>
    <div class="cards-grid">${cardsHTML}</div>
  `;
}

function filterActivities() {
  actSearch = document.getElementById('activities-search').value.toLowerCase();
  const filtered = actData.filter(a =>
    a.title.toLowerCase().includes(actSearch) || (a.area || '').toLowerCase().includes(actSearch)
  );
  const grid = document.querySelector('#view-activities .cards-grid');
  if (!grid) return;
  let html = '';
  filtered.forEach(a => {
    html += `
      <div class="activity-card" onclick="showActForm('${a.id}')">
        <div class="activity-title">${escHtml(a.title)}</div>
        <div class="activity-badges">
          <span class="tag">${escHtml(a.area || '')}</span>
          <span class="badge" style="background:#e0e7ff;color:#3730a3">${escHtml(a.level || '')}</span>
        </div>
        ${a.duration ? `<div class="activity-duration">⏱ ${escHtml(a.duration)}</div>` : ''}
        <div class="activity-desc">${escHtml(a.description)}</div>
      </div>`;
  });
  grid.innerHTML = html || `<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Sin resultados</h3></div>`;
}
window.filterActivities = filterActivities;

function showActForm(id) {
  const act = id ? actData.find(a => a.id === id) : null;
  const areaOpts = ACT_AREAS.map(a =>
    `<option value="${a}" ${act?.area === a ? 'selected' : ''}>${a}</option>`
  ).join('');
  const levelOpts = ACT_LEVELS.map(l =>
    `<option value="${l}" ${act?.level === l ? 'selected' : ''}>${l}</option>`
  ).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">Título <span>*</span></label>
      <input id="f-title" class="form-input" type="text" value="${escHtml(act?.title || '')}" placeholder="Nombre de la actividad" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Área <span>*</span></label>
        <select id="f-area" class="form-select">
          <option value="">Seleccionar...</option>
          ${areaOpts}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Nivel <span>*</span></label>
        <select id="f-level" class="form-select">
          <option value="">Seleccionar...</option>
          ${levelOpts}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Duración</label>
      <input id="f-duration" class="form-input" type="text" value="${escHtml(act?.duration || '')}" placeholder="Ej: 30 min" />
    </div>
    <div class="form-group">
      <label class="form-label">Descripción <span>*</span></label>
      <textarea id="f-desc" class="form-textarea" rows="5">${escHtml(act?.description || '')}</textarea>
    </div>
  `;

  openModal({
    title: act ? 'Editar Actividad' : 'Nueva Actividad',
    body,
    onSave: 'saveAct',
    editId: act?.id || null,
    onDelete: act ? 'deleteAct' : null,
  });
  if (id) document.getElementById('modal-footer').dataset.editId = id;
}
window.showActForm = showActForm;

async function saveAct() {
  const title = document.getElementById('f-title').value.trim();
  const area = document.getElementById('f-area').value;
  const level = document.getElementById('f-level').value;
  const description = document.getElementById('f-desc').value.trim();
  if (!title) { showToast('El título es obligatorio.', 'error'); return; }
  if (!area) { showToast('El área es obligatoria.', 'error'); return; }
  if (!level) { showToast('El nivel es obligatorio.', 'error'); return; }
  if (!description) { showToast('La descripción es obligatoria.', 'error'); return; }

  const payload = { title, area, level, description, duration: document.getElementById('f-duration').value.trim() };
  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('activities').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('activities').insert([payload]));
  }
  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Actividad actualizada.' : 'Actividad creada.', 'success');
  closeModal();
  loadActivities();
}
window.saveAct = saveAct;

async function deleteAct(id) {
  if (!confirm('¿Eliminar esta actividad?')) return;
  const { error } = await db.from('activities').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Actividad eliminada.', 'success');
  closeModal();
  loadActivities();
}
window.deleteAct = deleteAct;
