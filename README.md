# HabitPulse - Seguimiento de Hábitos Saludables

Una aplicación web moderna, intuitiva y reactiva para el seguimiento de hábitos diarios y semanales, construida con **Next.js (App Router, TypeScript)**, **Tailwind CSS**, **Recharts** y **Supabase** con fallback automático a **LocalStorage** para funcionamiento offline y demo inmediato.

---

## 🌟 Características Principales

1. **Dashboard Completo de Hábitos**:
   - **Tarjetas de Estadísticas (`HabitStats`)**: Seguimiento de hábitos completados hoy, cálculo de racha máxima activa en días, porcentaje de éxito diario y total de hábitos activos en el plan.
   - **Gráfico de Cumplimiento Semanal (`HabitProgressBarChart`)**: Gráfico de barras interactivo con **Recharts** que desglosa el cumplimiento día a día (Lunes a Domingo) con código de colores según porcentaje y tooltips informativos.
   - **Tabla Semanal Interactiva (`WeeklyHabitGrid`)**:
     - Navegación entre semanas (Semana actual, anterior, siguiente o botón para volver a hoy).
     - Casillas interactivas para marcar el cumplimiento de cada hábito.
     - Efecto de **confeti animado** con `canvas-confetti` al marcar hábitos completados.
     - Conteo de racha viva (`días consecutivos`) y meta semanal por hábito.
     - Botón para eliminar hábitos con confirmación segura.
   - **Modal de Creación (`AddHabitModal`)**:
     - Plantillas saludables precargadas (*Beber 2L de agua, Ejercicio 30 min, Meditación, Dormir 8 horas, Lectura 20 min, etc.*).
     - Formulario personalizado con categorías (*Salud, Fitness, Mente, Productividad, Nutrición*), selector de meta semanal (1 a 7 días) y paleta de colores.
     - Filtro rápido por categorías en la parte superior.

2. **Arquitectura Offline-First con Fallback Elegante**:
   - Funciona al 100% de inmediato sin configurar credenciales externas gracias a la persistencia en `LocalStorage`.
   - Si se configuran las variables de Supabase en `.env.local`, se sincroniza automáticamente con la base de datos PostgreSQL en la nube.

---

## 📂 Estructura del Proyecto

```text
habit-tracker/
├── app/
│   ├── favicon.ico
│   ├── globals.css              # Estilos base de Tailwind CSS y animaciones
│   ├── layout.tsx               # Root Layout con metadatos y tipografía
│   └── page.tsx                 # Entrada principal con hidratación dinámica
├── components/
│   ├── AddHabitModal.tsx        # Modal con plantillas y creador de hábitos
│   ├── HabitProgressBarChart.tsx# Gráfico de barras con Recharts
│   ├── HabitStats.tsx           # Tarjetas de métricas y estadísticas clave
│   ├── HabitTrackerDashboard.tsx# Orquestador del Dashboard y estado
│   └── WeeklyHabitGrid.tsx      # Matriz semanal con confeti y rachas
├── lib/
│   ├── habitUtils.ts            # Utilidades con date-fns y cálculo de rachas
│   └── supabase.ts              # Cliente Supabase y servicio con fallback local
├── supabase/
│   └── schema.sql               # Esquema de base de datos SQL con tablas y RLS
├── types/
│   └── habit.ts                 # Definiciones de TypeScript
├── .env.example                 # Plantilla de variables de entorno
├── .env.local                   # Archivo de configuración local
└── package.json
```

---

## 🚀 Inicio Rápido

### 1. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre en tu navegador [http://localhost:3000](http://localhost:3000). La aplicación ya cuenta con hábitos iniciales preconfigurados en modo Demo.

### 2. Validar Tipos y Compilación
```bash
npm run lint
npm run build
```

---

## 🗄️ Configuración de Supabase (Opcional)

Si deseas sincronizar tus datos con una base de datos real en Supabase:

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Ve al **SQL Editor** de tu panel de Supabase y ejecuta el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql).
3. Copia tus credenciales en el archivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```
4. Reinicia el servidor con `npm run dev`. HabitPulse detectará la conexión automáticamente y mostrará la insignia **Supabase Conectado**.
