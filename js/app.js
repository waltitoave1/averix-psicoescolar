// ============================================================
//  AVERIX PsicoEscolar — Core Application
//  Navigation, modal system, toast, dashboard, global init
// ============================================================

window.App = {
  students: [],
  currentView: 'dashboard',
};

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('app-logo').src = window.AVERIX_LOGO;
  await loadAllStudents();
  switchView('dashboard');
});

// ─── Load all students into global state (for dropdowns) ─────
async function loadAllStudents() {
  const { data, error } = await db.from('students').select('id, name, grade').order('name');
  if (!error && data) App.students = data;
}
window.loadAllStudents = loadAllStudents;

// ─── Build student options for <select> elements ─────────────
function studentOptions(selectedId = '', allowEmpty = false) {
  let opts = allowEmpty ? '<option value="">📚 Todos / General</option>' : '<option value="">Seleccionar estudiante...</option>';
  App.students.forEach(s => {
    const sel = s.id === selectedId ? 'selected' : '';
    opts += `<option value="${s.id}" ${sel}>${s.name} — ${s.grade}</option>`;
  });
  return opts;
}
window.studentOptions = studentOptions;

// ─── Navigation ──────────────────────────────────────────────
function switchView(view) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(el => (el.style.display = 'none'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.style.display = 'block';
  App.currentView = view;

  switch (view) {
    case 'dashboard':     renderDashboard();     break;
    case 'students':      loadStudents();        break;
    case 'observations':  loadObservations();    break;
    case 'evaluations':   loadEvaluations();     break;
    case 'interventions': loadInterventions();   break;
    case 'activities':    loadActivities();      break;
    case 'meetings':      loadMeetings();        break;
    case 'bitacora':      loadBitacora();        break;
    case 'reports':       renderReports();       break;
  }
}
window.switchView = switchView;

// ─── Dashboard ───────────────────────────────────────────────
async function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  el.innerHTML = '<div class="loading">Cargando dashboard...</div>';

  const [students, observations, interventions, bitacora] = await Promise.all([
    db.from('students').select('id', { count: 'exact', head: true }),
    db.from('observations').select('id', { count: 'exact', head: true }),
    db.from('interventions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('bitacora').select('id', { count: 'exact', head: true }),
  ]);

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-desc">Resumen general del sistema AVERIX PsicoEscolar</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-value">${students.count ?? 0}</div>
        <div class="stat-label">Estudiantes registrados</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👁️</div>
        <div class="stat-value">${observations.count ?? 0}</div>
        <div class="stat-label">Observaciones totales</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${interventions.count ?? 0}</div>
        <div class="stat-label">Intervenciones activas</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📔</div>
        <div class="stat-value">${bitacora.count ?? 0}</div>
        <div class="stat-label">Entradas en bitácora</div>
      </div>
    </div>
    <div class="welcome-card">
      <h2>Bienvenida a AVERIX PsicoEscolar</h2>
      <p>Sistema de gestión psicopedagógica profesional. Utiliza el menú lateral para navegar entre los módulos disponibles.</p>
    </div>
  `;
}

// ─── Modal System ────────────────────────────────────────────
function openModal({ title, body, onSave, editId, onDelete, saveLabel = 'Guardar' }) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;

  const footer = document.getElementById('modal-footer');
  let footerHTML = '';
  if (editId && onDelete) {
    footerHTML += `<button class="btn btn-danger" onclick="${onDelete}('${editId}')">Eliminar</button>`;
  }
  footerHTML += '<div class="footer-spacer"></div>';
  footerHTML += `<button class="btn btn-outline" onclick="closeModal()">Cancelar</button>`;
  footerHTML += `<button class="btn btn-primary" onclick="${onSave}()">${saveLabel}</button>`;
  footer.innerHTML = footerHTML;
  // Always set editId so save functions read the correct value (empty string = create mode)
  footer.dataset.editId = editId || '';

  document.getElementById('modal-overlay').classList.add('active');
}
window.openModal = openModal;

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}
window.closeModal = closeModal;

function handleOverlayClick(e) {
  if (e.target.id === 'modal-overlay') closeModal();
}
window.handleOverlayClick = handleOverlayClick;

// ─── Toast ───────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = 'toast'), 3000);
}
window.showToast = showToast;

// ─── Helpers ─────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
window.fmtDate = fmtDate;

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
window.escHtml = escHtml;

function studentName(id) {
  const s = App.students.find(s => s.id === id);
  return s ? s.name : '—';
}
window.studentName = studentName;
