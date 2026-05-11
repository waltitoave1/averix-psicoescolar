// ============================================================
//  Bitácora Module
// ============================================================

const BIT_TYPES = [
  'Sesión Individual','Sesión Grupal','Observación en Aula',
  'Reunión con Apoderado','Reunión con Profesor','Coordinación Equipo PIE',
  'Aplicación de Evaluación','Derivación a Especialista','Seguimiento',
  'Consejo de Profesores','Capacitación','Evento General','Otro',
];

let bitData = [];
let bitStudentFilter = '';
let bitMonthFilter = '';

async function loadBitacora() {
  const el = document.getElementById('view-bitacora');
  el.innerHTML = '<div class="loading">Cargando bitácora...</div>';

  const { data, error } = await db.from('bitacora')
    .select('*, students(name)')
    .order('date', { ascending: false });

  if (error) { el.innerHTML = '<div class="loading">Error al cargar bitácora.</div>'; return; }
  bitData = data || [];

  if (!bitMonthFilter) {
    const now = new Date();
    bitMonthFilter = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  renderBitacora();
}
window.loadBitacora = loadBitacora;

function renderBitacora() {
  const el = document.getElementById('view-bitacora');

  let filtered = bitData;
  if (bitStudentFilter === '__general__') {
    filtered = filtered.filter(b => !b.student_id);
  } else if (bitStudentFilter) {
    filtered = filtered.filter(b => b.student_id === bitStudentFilter);
  }
  if (bitMonthFilter) {
    filtered = filtered.filter(b => b.date && b.date.startsWith(bitMonthFilter));
  }

  const studentFilterOpts =
    `<option value="">📚 Todos / General</option>` +
    `<option value="__general__" ${bitStudentFilter === '__general__' ? 'selected' : ''}>📚 Solo generales</option>` +
    App.students.map(s => `<option value="${s.id}" ${bitStudentFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

  let itemsHTML = '';
  if (filtered.length === 0) {
    itemsHTML = `<div class="empty-state"><div class="empty-state-icon">📔</div><h3>Sin entradas</h3><p>Agrega la primera entrada a la bitácora.</p></div>`;
  } else {
    filtered.forEach(b => {
      const dateStr = fmtDate(b.date) + (b.time ? ` ${b.time}` : '');
      const studentLabel = b.students ? `👨‍🎓 ${escHtml(b.students.name)}` : '📚 Entrada General';
      itemsHTML += `
        <div class="bitacora-item" onclick="showBitForm('${b.id}')">
          <div class="bitacora-title">${escHtml(b.title)}</div>
          <div class="bitacora-meta">${dateStr} &nbsp;|&nbsp; <span class="tag">${escHtml(b.type)}</span> &nbsp;|&nbsp; ${studentLabel}</div>
          <div class="bitacora-desc">${escHtml(b.description)}</div>
          ${b.followup ? `<div class="bitacora-followup">🔄 <strong>Seguimiento:</strong> ${escHtml(b.followup)}</div>` : ''}
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Bitácora</h1>
      <p class="page-desc">Registro cronológico de actividades y sesiones</p>
    </div>
    <div class="toolbar">
      <select class="filter-select" onchange="setBitStudentFilter(this.value)">${studentFilterOpts}</select>
      <input class="filter-select" type="month" value="${bitMonthFilter}" onchange="setBitMonthFilter(this.value)" style="min-width:160px" />
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showBitForm(null)">+ Nueva Entrada</button>
      <button class="btn btn-ghost" onclick="downloadBitacora()">📄 Word</button>
    </div>
    <div>${itemsHTML}</div>
  `;
}

function setBitStudentFilter(val) { bitStudentFilter = val; renderBitacora(); }
function setBitMonthFilter(val) { bitMonthFilter = val; renderBitacora(); }
window.setBitStudentFilter = setBitStudentFilter;
window.setBitMonthFilter = setBitMonthFilter;

function showBitForm(id) {
  const bit = id ? bitData.find(b => b.id === id) : null;
  const typeOpts = BIT_TYPES.map(t =>
    `<option value="${t}" ${bit?.type === t ? 'selected' : ''}>${t}</option>`
  ).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">Título <span>*</span></label>
      <input id="f-title" class="form-input" type="text" value="${escHtml(bit?.title || '')}" placeholder="Título de la entrada" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Fecha <span>*</span></label>
        <input id="f-date" class="form-input" type="date" value="${bit?.date || new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label class="form-label">Hora</label>
        <input id="f-time" class="form-input" type="time" value="${bit?.time || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Tipo <span>*</span></label>
      <select id="f-type" class="form-select">
        <option value="">Seleccionar tipo...</option>
        ${typeOpts}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Estudiante (opcional — dejar vacío para entrada general)</label>
      <select id="f-student" class="form-select">${studentOptions(bit?.student_id, true)}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Descripción <span>*</span></label>
      <textarea id="f-desc" class="form-textarea" rows="4">${escHtml(bit?.description || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Seguimiento / Próximos pasos</label>
      <textarea id="f-followup" class="form-textarea" rows="3">${escHtml(bit?.followup || '')}</textarea>
    </div>
  `;

  openModal({
    title: bit ? 'Editar Entrada' : 'Nueva Entrada',
    body,
    onSave: 'saveBit',
    editId: bit?.id || null,
    onDelete: bit ? 'deleteBit' : null,
  });
  if (id) document.getElementById('modal-footer').dataset.editId = id;
}
window.showBitForm = showBitForm;

async function saveBit() {
  const title = document.getElementById('f-title').value.trim();
  const date = document.getElementById('f-date').value;
  const type = document.getElementById('f-type').value;
  const description = document.getElementById('f-desc').value.trim();
  if (!title) { showToast('El título es obligatorio.', 'error'); return; }
  if (!date) { showToast('La fecha es obligatoria.', 'error'); return; }
  if (!type) { showToast('El tipo es obligatorio.', 'error'); return; }
  if (!description) { showToast('La descripción es obligatoria.', 'error'); return; }

  const payload = {
    title, date, type, description,
    time: document.getElementById('f-time').value || null,
    student_id: document.getElementById('f-student').value || null,
    followup: document.getElementById('f-followup').value.trim(),
  };
  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('bitacora').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('bitacora').insert([payload]));
  }
  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Entrada actualizada.' : 'Entrada registrada.', 'success');
  closeModal();
  loadBitacora();
}
window.saveBit = saveBit;

async function deleteBit(id) {
  if (!confirm('¿Eliminar esta entrada de bitácora?')) return;
  const { error } = await db.from('bitacora').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Entrada eliminada.', 'success');
  closeModal();
  loadBitacora();
}
window.deleteBit = deleteBit;

// PDF respetando los filtros actuales
async function pdfBitacora() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let filtered = [...bitData];
  if (bitStudentFilter === '__general__') {
    filtered = filtered.filter(b => !b.student_id);
  } else if (bitStudentFilter) {
    filtered = filtered.filter(b => b.student_id === bitStudentFilter);
  }
  if (bitMonthFilter) {
    filtered = filtered.filter(b => b.date && b.date.startsWith(bitMonthFilter));
  }

  const ml = 20, mr = 190;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(233, 27, 126);
  doc.text('AVERIX PsicoEscolar', 105, y, { align: 'center' });
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(42, 26, 31);
  doc.text('Bitácora de Actividades', 105, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 78, 90);
  if (bitMonthFilter) doc.text(`Período: ${bitMonthFilter}`, 105, y, { align: 'center' });
  y += 7;
  doc.setDrawColor(233, 27, 126);
  doc.line(ml, y, mr, y);
  y += 8;

  if (filtered.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('No hay entradas para el período seleccionado.', ml, y);
  }

  filtered.forEach((b, idx) => {
    if (y > 245) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(233, 27, 126);
    doc.text(`${idx + 1}. ${b.title}`, ml, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(42, 26, 31);
    const dateStr = fmtDate(b.date) + (b.time ? ` ${b.time}` : '');
    const studentStr = b.students ? b.students.name : 'Entrada General';
    doc.text(`${dateStr}  |  ${b.type}  |  ${studentStr}`, ml, y);
    y += 5;

    const descLines = doc.splitTextToSize(b.description || '', 170);
    doc.text(descLines, ml, y);
    y += descLines.length * 4 + 2;

    if (b.followup) {
      doc.setFont('helvetica', 'italic');
      const followLines = doc.splitTextToSize(`Seguimiento: ${b.followup}`, 170);
      doc.text(followLines, ml, y);
      doc.setFont('helvetica', 'normal');
      y += followLines.length * 4 + 2;
    }

    doc.setDrawColor(220, 220, 220);
    doc.line(ml, y + 2, mr, y + 2);
    y += 7;
  });

  doc.save(`bitacora-${bitMonthFilter || 'completa'}.pdf`);
  showToast('PDF generado.', 'success');
}
window.pdfBitacora = pdfBitacora;

// Descargar bitácora en WORD
async function downloadBitacora() {
  const bitacoras = await dbOperation('bitacora', 'get');
  const students = await dbOperation('students', 'get');
  
  const filterStudent = document.getElementById('filter-bitacora-student');
  const monthFilter = document.getElementById('filter-bitacora-month');
  
  const selectedStudentId = filterStudent.value ? parseInt(filterStudent.value) : null;
  const selectedMonth = monthFilter.value;
  
  let filtered = bitacoras;
  if (selectedStudentId) filtered = filtered.filter(b => b.student_id === selectedStudentId);
  if (selectedMonth) filtered = filtered.filter(b => b.date && b.date.startsWith(selectedMonth));
  
  if (filtered.length === 0) {
    showToast('No hay entradas para descargar.', 'error');
    return;
  }

  const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = docx;
  
  const sections = [
    new Paragraph({ text: "BITÁCORA PSICOPEDAGÓGICA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Generado: ${new Date().toLocaleDateString('es-CL')}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
  ];

  filtered.forEach((b, index) => {
    const student = b.student_id ? students.find(s => s.id === b.student_id) : null;
    sections.push(
      new Paragraph({ text: `${index + 1}. ${b.title}`, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: `Fecha: ${new Date(b.date).toLocaleDateString('es-CL')} ${b.time ? '- ' + b.time : ''}` }),
      new Paragraph({ text: `Tipo: ${b.type}` }),
      new Paragraph({ text: `Estudiante: ${student?.name || 'Entrada general'}` }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: "Descripción:", bold: true }),
      new Paragraph({ text: b.description }),
      new Paragraph({ text: "" })
    );
    
    if (b.followup && b.followup.trim()) {
      sections.push(
        new Paragraph({ text: "Seguimiento:", bold: true }),
        new Paragraph({ text: b.followup }),
        new Paragraph({ text: "" })
      );
    }
    
    sections.push(
      new Paragraph({ text: "—".repeat(50) }),
      new Paragraph({ text: "" })
    );
  });

  const doc = new Document({ sections: [{ children: sections }] });
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `Bitacora_${new Date().toISOString().split('T')[0]}.docx`);
    showToast('Bitácora descargada.', 'success');
  });
}
window.downloadBitacora = downloadBitacora;
