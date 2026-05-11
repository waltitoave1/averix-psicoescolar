// ============================================================
//  Reports Module — Informes APA completos en WORD
// ============================================================

async function loadReports() {
  const el = document.getElementById('view-reports');
  const studentOpts = App.students.map(s => 
    `<option value="${s.id}">${s.name} - ${s.grade}</option>`
  ).join('');

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Informes Psicopedagógicos</h1>
      <p class="page-desc">Genera informes completos en formato Word</p>
    </div>
    <div class="card">
      <form onsubmit="generateReport(event)" style="max-width: 600px;">
        <div class="form-group">
          <label class="form-label">Estudiante <span>*</span></label>
          <select id="rep-student" class="form-select" required>
            <option value="">Seleccionar estudiante...</option>
            ${studentOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Profesional</label>
          <input id="rep-professional" class="form-input" type="text" placeholder="Nombre del profesional" />
        </div>
        <div class="form-group">
          <label class="form-label">Institución</label>
          <input id="rep-institution" class="form-input" type="text" placeholder="Nombre de la institución" />
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de informe</label>
          <select id="rep-type" class="form-select">
            <option>Informe de Progreso</option>
            <option>Informe Diagnóstico</option>
            <option>Informe de Derivación</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">📄 Generar Informe Word</button>
      </form>
    </div>
  `;
}
window.loadReports = loadReports;

async function generateReport(e) {
  e.preventDefault();
  
  const studentId = document.getElementById('rep-student').value;
  if (!studentId) {
    showToast('Selecciona un estudiante.', 'error');
    return;
  }

  const professional = document.getElementById('rep-professional').value || 'Profesional Psicopedagogo/a';
  const institution = document.getElementById('rep-institution').value || 'Institución Educativa';
  const reportType = document.getElementById('rep-type').value;

  const student = App.students.find(s => s.id === studentId);
  
  // Obtener TODOS los datos del estudiante usando Supabase directamente
  const { data: observations } = await db.from('observations').select('*').eq('student_id', studentId);
  const { data: evaluations } = await db.from('evaluations').select('*').eq('student_id', studentId);
  const { data: interventions } = await db.from('interventions').select('*').eq('student_id', studentId);
  const { data: meetings } = await db.from('meetings').select('*').eq('student_id', studentId);
  const { data: bitacoras } = await db.from('bitacora').select('*').eq('student_id', studentId);

  const studentObs = observations || [];
  const studentEvals = evaluations || [];
  const studentInts = interventions || [];
  const studentMeets = meetings || [];
  const studentBit = bitacoras || [];

  const { Document, Packer, Paragraph, HeadingLevel, AlignmentType, TextRun } = docx;

  const sections = [];

  // ENCABEZADO
  sections.push(
    new Paragraph({ text: reportType.toUpperCase(), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ text: `Estudiante: ${student.name}` }),
    new Paragraph({ text: `RUT: ${student.rut || 'No registrado'}` }),
    new Paragraph({ text: `Curso: ${student.grade}` }),
    new Paragraph({ text: `Diagnóstico: ${student.diagnosis || 'Sin diagnóstico registrado'}` }),
    new Paragraph({ text: `Fecha del informe: ${new Date().toLocaleDateString('es-CL')}` }),
    new Paragraph({ text: `Profesional: ${professional}` }),
    new Paragraph({ text: `Institución: ${institution}` }),
    new Paragraph({ text: "", spacing: { after: 300 } })
  );

  // OBSERVACIONES
  if (studentObs.length > 0) {
    sections.push(
      new Paragraph({ text: "OBSERVACIONES", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: "" })
    );
    studentObs.forEach((obs, i) => {
      sections.push(
        new Paragraph({ children: [new TextRun({ text: `${i + 1}. Fecha: ${new Date(obs.date).toLocaleDateString('es-CL')} - ${obs.area || 'General'}`, bold: true })] }),
        new Paragraph({ text: obs.text || '' }),
        new Paragraph({ text: "" })
      );
    });
  }

  // EVALUACIONES
  if (studentEvals.length > 0) {
    sections.push(
      new Paragraph({ text: "EVALUACIONES", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: "" })
    );
    studentEvals.forEach((ev, i) => {
      sections.push(
        new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${ev.area} - Puntaje: ${ev.score}/100`, bold: true })] }),
        new Paragraph({ text: `Fecha: ${new Date(ev.date).toLocaleDateString('es-CL')}` }),
        new Paragraph({ text: `Instrumento: ${ev.instrument || 'No especificado'}` }),
        new Paragraph({ text: `Notas: ${ev.notes || 'Sin observaciones'}` }),
        new Paragraph({ text: "" })
      );
    });
  }

  // INTERVENCIONES
  if (studentInts.length > 0) {
    sections.push(
      new Paragraph({ text: "INTERVENCIONES", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: "" })
    );
    studentInts.forEach((int, i) => {
      sections.push(
        new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${int.area} (${int.status === 'active' ? 'Activo' : 'Completado'})`, bold: true })] }),
        new Paragraph({ text: `Objetivo: ${int.goal || ''}` }),
        new Paragraph({ text: `Estrategias: ${int.strategies || ''}` }),
        new Paragraph({ text: "" })
      );
    });
  }

  // REUNIONES
  if (studentMeets.length > 0) {
    sections.push(
      new Paragraph({ text: "REUNIONES", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: "" })
    );
    studentMeets.forEach((m, i) => {
      sections.push(
        new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${m.type} - ${new Date(m.date).toLocaleDateString('es-CL')}`, bold: true })] }),
        new Paragraph({ text: `Participantes: ${m.participants || ''}` }),
        new Paragraph({ text: `Temas: ${m.topics || ''}` }),
        new Paragraph({ text: `Acuerdos: ${m.agreements || 'Sin acuerdos'}` }),
        new Paragraph({ text: "" })
      );
    });
  }

  // BITÁCORA
  if (studentBit.length > 0) {
    sections.push(
      new Paragraph({ text: "BITÁCORA", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: "" })
    );
    studentBit.forEach((b, i) => {
      sections.push(
        new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${b.title} - ${b.type}`, bold: true })] }),
        new Paragraph({ text: `Fecha: ${new Date(b.date).toLocaleDateString('es-CL')}` }),
        new Paragraph({ text: b.description || '' }),
        new Paragraph({ text: "" })
      );
    });
  }

  // CONCLUSIÓN
  sections.push(
    new Paragraph({ text: "CONCLUSIONES Y RECOMENDACIONES", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "[Espacio para que la profesional agregue conclusiones y recomendaciones]" }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Paragraph({ text: "________________________________" }),
    new Paragraph({ text: professional }),
    new Paragraph({ text: institution })
  );

  const doc = new Document({ sections: [{ children: sections }] });
  
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `Informe_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`);
    showToast('Informe generado exitosamente.', 'success');
  }).catch(() => showToast('Error al generar el informe Word.', 'error'));
}
window.generateReport = generateReport;
