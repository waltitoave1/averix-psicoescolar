// ============================================================
//  Students Module
// ============================================================

const GRADES = ['Pre-Kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico',
  '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico'];

let allStudentsData = [];

async function loadStudents() {
  const el = document.getElementById('view-students');
  el.innerHTML = '<div class="loading">Cargando estudiantes...</div>';

  const { data, error } = await db.from('students').select('*').order('name');
  if (error) { el.innerHTML = '<div class="loading">Error al cargar estudiantes.</div>'; return; }

  allStudentsData = data || [];
  renderStudents(allStudentsData);
}
window.loadStudents = loadStudents;

function renderStudents(data) {
  const el = document.getElementById('view-students');
  const searchVal = document.getElementById('students-search')?.value?.toLowerCase() || '';

  const filtered = data.filter(s =>
    s.name.toLowerCase().includes(searchVal) ||
    (s.grade || '').toLowerCase().includes(searchVal)
  );

  let cardsHTML = '';
  if (filtered.length === 0) {
    cardsHTML = `<div class="empty-state"><div class="empty-state-icon">👨‍🎓</div><h3>No hay estudiantes</h3><p>Agrega tu primer estudiante con el botón de arriba.</p></div>`;
  } else {
    filtered.forEach(s => {
      cardsHTML += `
        <div class="student-card" onclick="showStudentForm('${s.id}')">
          <div class="student-avatar">${escHtml(s.name.charAt(0).toUpperCase())}</div>
          <div class="student-name">${escHtml(s.name)}</div>
          <div class="student-grade">${escHtml(s.grade || '')}</div>
          <div class="student-diagnosis">${escHtml(s.diagnosis || 'Sin diagnóstico registrado')}</div>
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Estudiantes</h1>
      <p class="page-desc">Registro y gestión de estudiantes del programa</p>
    </div>
    <div class="toolbar">
      <input id="students-search" class="search-input" type="text" placeholder="Buscar por nombre o curso..." oninput="filterStudents()" value="${escHtml(searchVal)}" />
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showStudentForm(null)">+ Agregar Estudiante</button>
      <button class="btn btn-ghost" onclick="downloadStudentsList()">📄 Word</button>
    </div>
    <div class="cards-grid">${cardsHTML}</div>
  `;
}

function filterStudents() {
  const val = document.getElementById('students-search').value.toLowerCase();
  const filtered = allStudentsData.filter(s =>
    s.name.toLowerCase().includes(val) || (s.grade || '').toLowerCase().includes(val)
  );
  const grid = document.querySelector('#view-students .cards-grid');
  if (!grid) return;

  let html = '';
  if (filtered.length === 0) {
    html = `<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Sin resultados</h3><p>Intenta con otro término de búsqueda.</p></div>`;
  } else {
    filtered.forEach(s => {
      html += `
        <div class="student-card" onclick="showStudentForm('${s.id}')">
          <div class="student-avatar">${escHtml(s.name.charAt(0).toUpperCase())}</div>
          <div class="student-name">${escHtml(s.name)}</div>
          <div class="student-grade">${escHtml(s.grade || '')}</div>
          <div class="student-diagnosis">${escHtml(s.diagnosis || 'Sin diagnóstico registrado')}</div>
        </div>`;
    });
  }
  grid.innerHTML = html;
}
window.filterStudents = filterStudents;

function showStudentForm(id) {
  const student = id ? allStudentsData.find(s => s.id === id) : null;
  const gradeOpts = GRADES.map(g =>
    `<option value="${g}" ${student?.grade === g ? 'selected' : ''}>${g}</option>`
  ).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">Nombre completo <span>*</span></label>
      <input id="f-name" class="form-input" type="text" value="${escHtml(student?.name || '')}" placeholder="Nombre del estudiante" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">RUT</label>
        <input id="f-rut" class="form-input" type="text" value="${escHtml(student?.rut || '')}" placeholder="12.345.678-9" />
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de nacimiento</label>
        <input id="f-birthdate" class="form-input" type="date" value="${student?.birthdate || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Curso <span>*</span></label>
      <select id="f-grade" class="form-select">
        <option value="">Seleccionar curso...</option>
        ${gradeOpts}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Diagnóstico</label>
      <input id="f-diagnosis" class="form-input" type="text" value="${escHtml(student?.diagnosis || '')}" placeholder="Diagnóstico psicopedagógico" />
    </div>
    <div class="form-group">
      <label class="form-label">Notas adicionales</label>
      <textarea id="f-notes" class="form-textarea">${escHtml(student?.notes || '')}</textarea>
    </div>
  `;

  openModal({
    title: student ? 'Editar Estudiante' : 'Nuevo Estudiante',
    body,
    onSave: 'saveStudent',
    editId: student?.id || null,
    onDelete: student ? 'deleteStudent' : null,
  });

}
window.showStudentForm = showStudentForm;

async function saveStudent() {
  const name = document.getElementById('f-name').value.trim();
  const grade = document.getElementById('f-grade').value;
  if (!name) { showToast('El nombre es obligatorio.', 'error'); return; }
  if (!grade) { showToast('El curso es obligatorio.', 'error'); return; }

  const payload = {
    name,
    rut: document.getElementById('f-rut').value.trim(),
    birthdate: document.getElementById('f-birthdate').value || null,
    grade,
    diagnosis: document.getElementById('f-diagnosis').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
    updated_at: new Date().toISOString(),
  };

  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('students').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('students').insert([payload]));
  }

  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Estudiante actualizado.' : 'Estudiante agregado.', 'success');
  closeModal();
  await loadAllStudents();
  loadStudents();
}
window.saveStudent = saveStudent;

async function deleteStudent(id) {
  if (!confirm('¿Eliminar este estudiante? Esta acción no se puede deshacer.')) return;
  const { error } = await db.from('students').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Estudiante eliminado.', 'success');
  closeModal();
  await loadAllStudents();
  loadStudents();
}
window.deleteStudent = deleteStudent;

async function downloadStudentsList() {
  const { data: students, error } = await db.from('students').select('*').order('name');
  if (error || !students || students.length === 0) {
    showToast('No hay estudiantes para descargar.', 'error');
    return;
  }

  const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, TextRun } = docx;

  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nombre', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RUT', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Curso', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Diagnóstico', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Notas', bold: true })] })] }),
    ],
  });

  const dataRows = students.map(s => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: s.name || '' })] }),
      new TableCell({ children: [new Paragraph({ text: s.rut || '' })] }),
      new TableCell({ children: [new Paragraph({ text: s.grade || '' })] }),
      new TableCell({ children: [new Paragraph({ text: s.diagnosis || '' })] }),
      new TableCell({ children: [new Paragraph({ text: s.notes || '' })] }),
    ],
  }));

  const document = new Document({
    sections: [{
      children: [
        new Paragraph({ text: 'LISTA DE ESTUDIANTES', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: `Generado: ${new Date().toLocaleDateString('es-CL')}`, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: '' }),
        new Table({ width: { size: 100, type: WidthType.PCT }, rows: [headerRow, ...dataRows] }),
      ],
    }],
  });

  Packer.toBlob(document).then(blob => {
    saveAs(blob, `Estudiantes_${new Date().toISOString().split('T')[0]}.docx`);
    showToast('Lista descargada en Word.', 'success');
  }).catch(() => showToast('Error al generar el archivo Word.', 'error'));
}
window.downloadStudentsList = downloadStudentsList;
