// ============================================================
//  Interventions Module
// ============================================================

const INT_AREAS = [
  'Comprensión Lectora','Memoria y Atención','Escritura','Lectoescritura',
  'Matemáticas','Habilidades Sociales','Regulación Emocional','Funciones Ejecutivas'
];

let intData = [];
let intFilter = '';

async function loadInterventions() {
  const el = document.getElementById('view-interventions');
  el.innerHTML = '<div class="loading">Cargando intervenciones...</div>';

  const { data, error } = await db.from('interventions')
    .select('*, students(name, grade)')
    .order('start_date', { ascending: false });

  if (error) { el.innerHTML = '<div class="loading">Error al cargar intervenciones.</div>'; return; }
  intData = data || [];
  renderInterventions();
}
window.loadInterventions = loadInterventions;

function renderInterventions() {
  const el = document.getElementById('view-interventions');
  const filtered = intFilter
    ? intData.filter(i => i.student_id === intFilter)
    : intData;

  const studentFilterOpts = `<option value="">— Todos los estudiantes —</option>` +
    App.students.map(s => `<option value="${s.id}" ${intFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

  let itemsHTML = '';
  if (filtered.length === 0) {
    itemsHTML = `<div class="empty-state"><div class="empty-state-icon">🎯</div><h3>Sin intervenciones</h3><p>Registra la primera intervención.</p></div>`;
  } else {
    filtered.forEach(i => {
      const badgeClass = i.status === 'active' ? 'badge-active' : 'badge-completed';
      const badgeLabel = i.status === 'active' ? 'Activo' : 'Completado';
      itemsHTML += `
        <div class="list-item" onclick="showIntForm('${i.id}')">
          <div class="list-item-header">
            <span class="item-student-name">${escHtml(i.students?.name || '—')}</span>
            <span class="tag">${escHtml(i.area)}</span>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
            <span class="item-date">${fmtDate(i.start_date)}</span>
          </div>
          <div class="item-text" style="margin-bottom:4px"><strong>Objetivo:</strong> ${escHtml(i.goal)}</div>
          <div class="item-text"><strong>Estrategias:</strong> ${escHtml(i.strategies)}</div>
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Intervenciones</h1>
      <p class="page-desc">Plan de intervención psicopedagógica por estudiante</p>
    </div>
    <div class="toolbar">
      <select class="filter-select" onchange="setIntFilter(this.value)">${studentFilterOpts}</select>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showIntForm(null)">+ Nueva Intervención</button>
      <button class="btn btn-ghost" onclick="downloadInterventionsList()">📄 Word</button>
    </div>
    <div class="items-list">${itemsHTML}</div>
  `;
}

function setIntFilter(val) { intFilter = val; renderInterventions(); }
window.setIntFilter = setIntFilter;

function showIntForm(id) {
  const int = id ? intData.find(i => i.id === id) : null;
  const areaOpts = INT_AREAS.map(a =>
    `<option value="${a}" ${int?.area === a ? 'selected' : ''}>${a}</option>`
  ).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">Estudiante <span>*</span></label>
      <select id="f-student" class="form-select">${studentOptions(int?.student_id)}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Área <span>*</span></label>
        <select id="f-area" class="form-select">
          <option value="">Seleccionar área...</option>
          ${areaOpts}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de inicio <span>*</span></label>
        <input id="f-start" class="form-input" type="date" value="${int?.start_date || new Date().toISOString().split('T')[0]}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Objetivo <span>*</span></label>
      <textarea id="f-goal" class="form-textarea">${escHtml(int?.goal || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Estrategias <span>*</span></label>
      <textarea id="f-strategies" class="form-textarea">${escHtml(int?.strategies || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Estado</label>
      <select id="f-status" class="form-select">
        <option value="active" ${(!int || int.status === 'active') ? 'selected' : ''}>Activo</option>
        <option value="completed" ${int?.status === 'completed' ? 'selected' : ''}>Completado</option>
      </select>
    </div>
  `;

  openModal({
    title: int ? 'Editar Intervención' : 'Nueva Intervención',
    body,
    onSave: 'saveInt',
    editId: int?.id || null,
    onDelete: int ? 'deleteInt' : null,
  });
  if (id) document.getElementById('modal-footer').dataset.editId = id;
}
window.showIntForm = showIntForm;

async function saveInt() {
  const student_id = document.getElementById('f-student').value;
  const area = document.getElementById('f-area').value;
  const start_date = document.getElementById('f-start').value;
  const goal = document.getElementById('f-goal').value.trim();
  const strategies = document.getElementById('f-strategies').value.trim();
  if (!student_id) { showToast('Selecciona un estudiante.', 'error'); return; }
  if (!area) { showToast('El área es obligatoria.', 'error'); return; }
  if (!start_date) { showToast('La fecha es obligatoria.', 'error'); return; }
  if (!goal) { showToast('El objetivo es obligatorio.', 'error'); return; }
  if (!strategies) { showToast('Las estrategias son obligatorias.', 'error'); return; }

  const payload = {
    student_id, area, start_date, goal, strategies,
    status: document.getElementById('f-status').value,
  };
  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('interventions').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('interventions').insert([payload]));
  }
  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Intervención actualizada.' : 'Intervención registrada.', 'success');
  closeModal();
  loadInterventions();
}
window.saveInt = saveInt;

async function deleteInt(id) {
  if (!confirm('¿Eliminar esta intervención?')) return;
  const { error } = await db.from('interventions').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Intervención eliminada.', 'success');
  closeModal();
  loadInterventions();
}
window.deleteInt = deleteInt;

// PDF
async function pdfInterventions() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { data } = await db.from('interventions')
    .select('*, students(name, grade)')
    .order('start_date', { ascending: false });
  const items = data || [];

  const ml = 20, mr = 190;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(233, 27, 126);
  doc.text('AVERIX PsicoEscolar', 105, y, { align: 'center' });
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(42, 26, 31);
  doc.text('Plan de Intervenciones', 105, y, { align: 'center' });
  y += 8;
  doc.setDrawColor(233, 27, 126);
  doc.line(ml, y, mr, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  items.forEach((int, idx) => {
    if (y > 250) { doc.addPage(); y = 20; }
    const status = int.status === 'active' ? 'Activo' : 'Completado';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(233, 27, 126);
    doc.text(`${idx + 1}. ${int.students?.name || '—'}`, ml, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(42, 26, 31);
    doc.text(`Área: ${int.area}  |  Inicio: ${fmtDate(int.start_date)}  |  Estado: ${status}`, ml, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Objetivo:', ml, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    const goalLines = doc.splitTextToSize(int.goal || '', 170);
    doc.text(goalLines, ml, y);
    y += goalLines.length * 4 + 2;

    doc.setFont('helvetica', 'bold');
    doc.text('Estrategias:', ml, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    const stratLines = doc.splitTextToSize(int.strategies || '', 170);
    doc.text(stratLines, ml, y);
    y += stratLines.length * 4 + 6;

    doc.setDrawColor(220, 220, 220);
    doc.line(ml, y, mr, y);
    y += 6;
  });

  doc.save('intervenciones.pdf');
  showToast('PDF generado.', 'success');
}
window.pdfInterventions = pdfInterventions;

// Descargar intervenciones en WORD
async function downloadInterventionsList() {
  const interventions = await dbOperation('interventions', 'get');
  const students = await dbOperation('students', 'get');
  if (interventions.length === 0) {
    showToast('No hay intervenciones.', 'error');
    return;
  }

  const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun } = docx;
  
  const sections = [
    new Paragraph({ text: "PLANES DE INTERVENCIÓN", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Generado: ${new Date().toLocaleDateString('es-CL')}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
  ];

  interventions.forEach((int, index) => {
    const student = students.find(s => s.id === int.student_id);
    sections.push(
      new Paragraph({ text: `${index + 1}. ${student?.name || ''}`, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: `Área: ${int.area}` }),
      new Paragraph({ text: `Estado: ${int.status === 'active' ? 'Activo' : 'Completado'}` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "Objetivo SMART:", bold: true }),
      new Paragraph({ text: int.goal }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "Estrategias:", bold: true }),
      new Paragraph({ text: int.strategies }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "—".repeat(50) }),
      new Paragraph({ text: "" })
    );
  });

  const doc = new Document({ sections: [{ children: sections }] });
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `Intervenciones_${new Date().toISOString().split('T')[0]}.docx`);
    showToast('Intervenciones descargadas.', 'success');
  });
}
window.downloadInterventionsList = downloadInterventionsList;
