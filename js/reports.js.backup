// ============================================================
//  Informes APA Module — APA 7th edition psychopedagogical report
// ============================================================

function renderReports() {
  const el = document.getElementById('view-reports');

  const studentOpts = studentOptions('');
  const reportTypeOpts = ['Progreso', 'Diagnóstico', 'Derivación'].map(t =>
    `<option value="${t}">${t}</option>`
  ).join('');

  el.innerHTML = `
    <div class="view-header">
      <h1 class="page-title">Informes APA</h1>
      <p class="page-desc">Generación de informes psicopedagógicos en formato APA 7ma edición</p>
    </div>
    <div class="report-form-card">
      <div class="form-group">
        <label class="form-label">Profesional a cargo <span>*</span></label>
        <input id="r-psych" class="form-input" type="text" placeholder="Nombre completo del/la psicopedagoga" />
      </div>
      <div class="form-group">
        <label class="form-label">Institución</label>
        <input id="r-inst" class="form-input" type="text" placeholder="Nombre del establecimiento educacional" />
      </div>
      <div class="form-group">
        <label class="form-label">Estudiante <span>*</span></label>
        <select id="r-student" class="form-select">${studentOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de informe</label>
        <select id="r-type" class="form-select">${reportTypeOpts}</select>
      </div>
      <br>
      <button class="btn btn-primary" style="width:100%;justify-content:center;font-size:15px;padding:14px" onclick="generateApaReport()">
        📄 Generar Informe APA
      </button>
    </div>
  `;
}
window.renderReports = renderReports;

async function generateApaReport() {
  const psychName = document.getElementById('r-psych').value.trim();
  const institution = document.getElementById('r-inst').value.trim();
  const studentId = document.getElementById('r-student').value;
  const reportType = document.getElementById('r-type').value;

  if (!psychName) { showToast('El nombre del profesional es obligatorio.', 'error'); return; }
  if (!studentId) { showToast('Selecciona un estudiante.', 'error'); return; }

  showToast('Generando informe...');

  const [
    { data: student },
    { data: obsData },
    { data: evalData },
  ] = await Promise.all([
    db.from('students').select('*').eq('id', studentId).single(),
    db.from('observations').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(5),
    db.from('evaluations').select('*').eq('student_id', studentId).order('date', { ascending: false }),
  ]);

  if (!student) { showToast('No se encontró el estudiante.', 'error'); return; }

  buildApaPDF({ student, observations: obsData || [], evaluations: evalData || [], psychName, institution, reportType });
}
window.generateApaReport = generateApaReport;

function buildApaPDF({ student, observations, evaluations, psychName, institution, reportType }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const ml = 25, mr = 185, cw = 160;
  let y = 25;

  const today = new Date().toLocaleDateString('es-CL', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // ─── Header ──────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(42, 26, 31);
  doc.text('INFORME PSICOPEDAGÓGICO', 105, y, { align: 'center' });
  y += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Tipo: ${reportType}`, 105, y, { align: 'center' });
  y += 5;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 78, 90);
  doc.text(`Formato APA 7ma Edición`, 105, y, { align: 'center' });
  y += 2;
  doc.setDrawColor(42, 26, 31);
  doc.setLineWidth(0.8);
  doc.line(ml, y + 3, mr, y + 3);
  y += 10;

  // ─── Student Data ─────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(42, 26, 31);
  doc.text('I. DATOS DEL ESTUDIANTE', ml, y);
  y += 7;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const bdate = student.birthdate ? fmtDate(student.birthdate) : '—';
  const rows = [
    ['Nombre completo', student.name],
    ['RUT', student.rut || '—'],
    ['Fecha de nacimiento', bdate],
    ['Curso / Nivel', student.grade || '—'],
    ['Diagnóstico', student.diagnosis || '—'],
    ['Institución', institution || '—'],
    ['Profesional evaluador/a', psychName],
    ['Fecha de informe', today],
  ];

  rows.forEach(([label, val]) => {
    doc.setFont('times', 'bold');
    doc.text(`${label}:`, ml, y);
    doc.setFont('times', 'normal');
    doc.text(String(val), ml + 52, y);
    y += 5;
  });

  y += 3;
  doc.setLineWidth(0.3);
  doc.setDrawColor(200, 200, 200);
  doc.line(ml, y, mr, y);
  y += 7;

  // ─── Observations ─────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 25; }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(42, 26, 31);
  doc.text('II. OBSERVACIONES RECIENTES', ml, y);
  y += 7;

  if (observations.length === 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text('Sin observaciones registradas.', ml, y);
    y += 7;
  } else {
    observations.forEach((obs, i) => {
      if (y > 245) { doc.addPage(); y = 25; }
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${obs.area || 'Sin área'} — ${fmtDate(obs.date)}`, ml, y);
      y += 5;
      doc.setFont('times', 'normal');
      const lines = doc.splitTextToSize(obs.text || '', cw);
      doc.text(lines, ml + 4, y);
      y += lines.length * 4.5 + 3;
    });
  }

  y += 2;
  doc.line(ml, y, mr, y);
  y += 7;

  // ─── Evaluations ─────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 25; }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('III. RESULTADOS DE EVALUACIÓN', ml, y);
  y += 7;

  if (evaluations.length === 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text('Sin evaluaciones registradas.', ml, y);
    y += 7;
  } else {
    // Table header
    const ecols = [70, 40, 30, 20];
    const eheaders = ['Área', 'Instrumento', 'Fecha', 'Ptje'];
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    let ex = ml;
    eheaders.forEach((h, i) => { doc.text(h, ex, y); ex += ecols[i]; });
    y += 4;
    doc.line(ml, y, mr, y);
    y += 4;

    doc.setFont('times', 'normal');
    evaluations.forEach(ev => {
      if (y > 270) { doc.addPage(); y = 25; }
      ex = ml;
      const row = [ev.area, ev.instrument || '—', fmtDate(ev.date), String(ev.score ?? '—')];
      row.forEach((cell, i) => {
        const t = doc.splitTextToSize(String(cell), ecols[i] - 2);
        doc.text(t[0], ex, y);
        ex += ecols[i];
      });
      y += 5;
    });
  }

  y += 4;
  doc.line(ml, y, mr, y);
  y += 8;

  // ─── Conclusions ─────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 25; }

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(42, 26, 31);
  doc.text('IV. CONCLUSIONES Y RECOMENDACIONES', ml, y);
  y += 7;

  doc.setFont('times', 'normal');
  doc.setFontSize(10);

  const conclusions = getConclusionsByType(reportType, student);
  conclusions.forEach(paragraph => {
    if (y > 265) { doc.addPage(); y = 25; }
    const lines = doc.splitTextToSize(paragraph, cw);
    doc.text(lines, ml, y);
    y += lines.length * 4.5 + 4;
  });

  y += 6;
  doc.line(ml, y, mr, y);
  y += 10;

  // ─── Signature ────────────────────────────────────────────
  if (y > 260) { doc.addPage(); y = 25; }
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('_______________________________', ml, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.text(psychName, ml, y);
  y += 5;
  doc.setFont('times', 'normal');
  doc.text('Psicopedagoga/o', ml, y);
  if (institution) { y += 5; doc.text(institution, ml, y); }
  y += 5;
  doc.text(today, ml, y);

  // ─── Page numbers ─────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i} / ${total}`, 105, 292, { align: 'center' });
  }

  doc.save(`informe-${student.name.replace(/\s+/g, '_')}-${reportType}.pdf`);
  showToast('Informe APA generado.', 'success');
}

function getConclusionsByType(type, student) {
  const name = student.name;
  const base = [
    `El/La estudiante ${name} ha participado en el proceso de evaluación e intervención psicopedagógica de manera activa, mostrando disposición favorable hacia las actividades propuestas.`,
    `Los resultados obtenidos en las distintas áreas evaluadas reflejan el perfil de aprendizaje individual del/la estudiante, identificándose tanto fortalezas como áreas de mejora que requieren atención especializada.`,
    `Se recomienda mantener un trabajo sistemático y coordinado entre el equipo de aula, la familia y el equipo de apoyo a la inclusión (PIE), con el fin de favorecer el desarrollo integral del/la estudiante y dar seguimiento a los progresos alcanzados.`,
  ];

  if (type === 'Diagnóstico') {
    return [
      ...base,
      `El diagnóstico psicopedagógico tiene por finalidad orientar la planificación de estrategias de intervención adecuadas a las necesidades educativas especiales identificadas. Se sugiere revisar las adaptaciones curriculares pertinentes en coordinación con el equipo docente.`,
      `Este informe ha sido elaborado en conformidad con las normativas vigentes del Decreto N° 83 y las orientaciones del Ministerio de Educación de Chile.`,
    ];
  }
  if (type === 'Derivación') {
    return [
      ...base,
      `Dado el perfil evaluado, se recomienda la derivación del/la estudiante a los especialistas pertinentes para una evaluación complementaria. La familia debe ser orientada respecto al proceso de derivación y acompañamiento externo.`,
      `La presente derivación es de carácter preventivo y no implica diagnóstico clínico. Su objetivo es complementar la atención educativa con el apoyo interdisciplinario necesario.`,
    ];
  }
  // Progreso (default)
  return [
    ...base,
    `Los avances observados en el período de intervención son consistentes con el plan de trabajo establecido. Se evidencian progresos en las áreas intervenidas, aunque se requiere continuidad en el proceso para consolidar los aprendizajes adquiridos.`,
    `Se sugiere mantener las estrategias de trabajo actuales y reforzar la comunicación entre los agentes educativos involucrados para garantizar la continuidad y coherencia del proceso de apoyo.`,
  ];
}
