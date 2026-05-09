# AVERIX PsicoEscolar

Sistema de gestión psicopedagógica profesional con diseño rosado y mascota Avellana.

## Stack

- **Frontend:** HTML5, CSS3 (vanilla), JavaScript ES6+
- **Base de datos:** Supabase (PostgreSQL)
- **PDF:** jsPDF
- **Fuentes:** Playfair Display + Inter (Google Fonts)
- **Deploy:** Vercel / Netlify (estático)

## Configuración Supabase

### 1. Crear proyecto

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota la **URL del proyecto** y la **clave anon**

### 2. Crear las tablas

Ejecuta el siguiente SQL en **SQL Editor** de tu proyecto Supabase:

```sql
-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Estudiantes
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rut text,
  birthdate date,
  grade text NOT NULL,
  diagnosis text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Observaciones
CREATE TABLE observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  area text,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Evaluaciones
CREATE TABLE evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  area text NOT NULL,
  instrument text,
  score integer CHECK (score >= 0 AND score <= 100),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Intervenciones
CREATE TABLE interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  area text NOT NULL,
  goal text NOT NULL,
  strategies text NOT NULL,
  start_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Actividades
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  area text NOT NULL,
  level text NOT NULL,
  duration text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reuniones
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  date date NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  participants text NOT NULL,
  topics text NOT NULL,
  agreements text,
  created_at timestamptz DEFAULT now()
);

-- Bitácora
CREATE TABLE bitacora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text,
  type text NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  followup text,
  created_at timestamptz DEFAULT now()
);

-- RLS: acceso sin autenticación (ajustar en producción)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_observations" ON observations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_interventions" ON interventions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_meetings" ON meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bitacora" ON bitacora FOR ALL USING (true) WITH CHECK (true);
```

### 3. Conectar la app

Edita `js/supabase.js` y reemplaza los placeholders:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

## Ejecutar localmente

```bash
# Opción 1: servidor simple
npx serve . -p 3000

# Opción 2: live-server con recarga
npx live-server --port=3000

# Opción 3: Python (sin instalar nada)
python3 -m http.server 3000
```

Abre [http://localhost:3000](http://localhost:3000)

## Deploy en Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. En la carpeta del proyecto: `vercel`
3. Sigue el asistente (proyecto estático, sin build)

## Deploy en Netlify

1. Arrastra la carpeta del proyecto a [app.netlify.com/drop](https://app.netlify.com/drop)
2. O usa el CLI: `npx netlify deploy --prod --dir .`

## Módulos

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Totales en tiempo real |
| Estudiantes | CRUD + búsqueda + PDF lista |
| Observaciones | CRUD + filtro por estudiante |
| Evaluaciones | CRUD + 49 áreas + filtro |
| Intervenciones | CRUD + estados + PDF |
| Actividades | CRUD + búsqueda + 2 precargadas |
| Reuniones | CRUD + PDF |
| Bitácora | CRUD + filtro estudiante/mes + PDF |
| Informes APA | PDF profesional formato APA 7ma ed. |

## Notas de seguridad

Las políticas RLS del SQL anterior permiten acceso público total (sin autenticación). Para producción con múltiples usuarios, implementa autenticación con Supabase Auth y ajusta las políticas RLS según el rol del usuario.
