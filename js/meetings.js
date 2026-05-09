// ============================================================
//  Meetings Module
// ============================================================

const MEET_TYPES = [
  'Reunión con Apoderados',
  'Reunión con Profesores',
  'Equipo Multidisciplinario',
];

let meetData = [];

async function loadMeetings() {
  const el = document.getElementById('view-meetings');
  el.innerHTML = '<div class="loading">Cargando reuniones...</div>';

  const { data, error } = await db.from('meetings')
    .select('*, students(name)')
    .order('date', { ascending: false });

  if (error) { el.innerHTML = '<div class="loading">Error al cargar reuniones.</div>'; return; }
  meetData = data || [];
  renderMeetings();
}
window.loadMeetings = loadMeetings;

function renderMeetings() {
  const el = document.getElementById('view-meetings');

  let itemsHTML = '';
  if (meetData.length === 0) {
    itemsHTML = `<div class="empty-state"><div class="empty-state-icon">🤝</div><h3>Sin reuniones</h3><p>Registra la primera reunión.</p></div>`;
  } else {
    meetData.forEach(m => {
      itemsHTML += `
        <div class="list-item" onclick="showMeetForm('${m.id}')">
          <div class="list-item-header">
            <span class="item-student-name">${escHtml(m.type)}</span>
            <span class="item-date">${fmtDate(m.date)}</span>
          </div>
          ${m.students ? `<div class="item-text" style="margin-bottom:4px">👨‍🎓 ${escHtml(m.students.name)}</div>` : ''}
          <div class="item-text" style="margin-bottom:4px"><strong>Participantes:</strong> ${escHtml(m.participants)}</div>
          <div class="item-text" style="margin-bottom:4px"><strong>Temas:</strong> ${escHtml(m.topics)}</div>
          ${m.agreements ? `<div class="item-text"><strong>Acuerdos:</strong> ${escHtml(m.agreements)}</div>` : ''}
        </div>`;
    });
  }

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Reuniones</h1>
      <p class="page-desc">Registro de reuniones con apoderados, profesores y equipo</p>
    </div>
    <div class="toolbar">
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="showMeetForm(null)">+ Nueva Reunión</button>
      <button class="btn btn-ghost" onclick="pdfMeetings()">📄 PDF</button>
    </div>
    <div class="items-list">${itemsHTML}</div>
  `;
}

function showMeetForm(id) {
  const meet = id ? meetData.find(m => m.id === id) : null;
  const typeOpts = MEET_TYPES.map(t =>
    `<option value="${t}" ${meet?.type === t ? 'selected' : ''}>${t}</option>`
  ).join('');

  const body = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipo <span>*</span></label>
        <select id="f-type" class="form-select">
          <option value="">Seleccionar...</option>
          ${typeOpts}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha <span>*</span></label>
        <input id="f-date" class="form-input" type="date" value="${meet?.date || new Date().toISOString().split('T')[0]}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Estudiante (opcional)</label>
      <select id="f-student" class="form-select">${studentOptions(meet?.student_id, true)}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Participantes <span>*</span></label>
      <input id="f-participants" class="form-input" type="text" value="${escHtml(meet?.participants || '')}" placeholder="Nombres de los participantes" />
    </div>
    <div class="form-group">
      <label class="form-label">Temas tratados <span>*</span></label>
      <textarea id="f-topics" class="form-textarea">${escHtml(meet?.topics || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Acuerdos</label>
      <textarea id="f-agreements" class="form-textarea">${escHtml(meet?.agreements || '')}</textarea>
    </div>
  `;

  openModal({
    title: meet ? 'Editar Reunión' : 'Nueva Reunión',
    body,
    onSave: 'saveMeet',
    editId: meet?.id || null,
    onDelete: meet ? 'deleteMeet' : null,
  });
  if (id) document.getElementById('modal-footer').dataset.editId = id;
}
window.showMeetForm = showMeetForm;

async function saveMeet() {
  const type = document.getElementById('f-type').value;
  const date = document.getElementById('f-date').value;
  const participants = document.getElementById('f-participants').value.trim();
  const topics = document.getElementById('f-topics').value.trim();
  if (!type) { showToast('El tipo es obligatorio.', 'error'); return; }
  if (!date) { showToast('La fecha es obligatoria.', 'error'); return; }
  if (!participants) { showToast('Los participantes son obligatorios.', 'error'); return; }
  if (!topics) { showToast('Los temas son obligatorios.', 'error'); return; }

  const payload = {
    type, date, participants, topics,
    student_id: document.getElementById('f-student').value || null,
    agreements: document.getElementById('f-agreements').value.trim(),
  };
  const editId = document.getElementById('modal-footer').dataset.editId;
  let error;
  if (editId) {
    ({ error } = await db.from('meetings').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('meetings').insert([payload]));
  }
  if (error) { showToast('Error al guardar.', 'error'); return; }
  showToast(editId ? 'Reunión actualizada.' : 'Reunión registrada.', 'success');
  closeModal();
  loadMeetings();
}
window.saveMeet = saveMeet;

async function deleteMeet(id) {
  if (!confirm('¿Eliminar esta reunión?')) return;
  const { error } = await db.from('meetings').delete().eq('id', id);
  if (error) { showToast('Error al eliminar.', 'error'); return; }
  showToast('Reunión eliminada.', 'success');
  closeModal();
  loadMeetings();
}
window.deleteMeet = deleteMeet;

// PDF
async function pdfMeetings() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { data } = await db.from('meetings')
    .select('*, students(name)')
    .order('date', { ascending: false });
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
  doc.text('Registro de Reuniones', 105, y, { align: 'center' });
  y += 8;
  doc.setDrawColor(233, 27, 126);
  doc.line(ml, y, mr, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  items.forEach((m, idx) => {
    if (y > 248) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(233, 27, 126);
    doc.text(`${idx + 1}. ${m.type}`, ml, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(42, 26, 31);
    doc.text(`Fecha: ${fmtDate(m.date)}${m.students ? ' | Estudiante: ' + m.students.name : ''}`, ml, y);
    y += 5;
    doc.text(`Participantes: ${m.participants}`, ml, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Temas:', ml, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    const topicLines = doc.splitTextToSize(m.topics || '', 170);
    doc.text(topicLines, ml, y);
    y += topicLines.length * 4 + 2;

    if (m.agreements) {
      doc.setFont('helvetica', 'bold');
      doc.text('Acuerdos:', ml, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
      const agreemLines = doc.splitTextToSize(m.agreements, 170);
      doc.text(agreemLines, ml, y);
      y += agreemLines.length * 4 + 2;
    }

    doc.setDrawColor(220, 220, 220);
    doc.line(ml, y + 2, mr, y + 2);
    y += 8;
  });

  doc.save('reuniones.pdf');
  showToast('PDF generado.', 'success');
}
window.pdfMeetings = pdfMeetings;
