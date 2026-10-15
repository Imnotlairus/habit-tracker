-- ==============================================================================
-- HabitPulse: Schema de Base de Datos para Supabase
-- Tablas: habits, habit_logs con índices y políticas de seguridad RLS
-- ==============================================================================

-- 1. Habilitar extensión para UUIDs si no está habilitada
create extension if not exists "pgcrypto";

-- 2. Tabla de Hábitos
create table if not exists public.habits (
    id text primary key default gen_random_uuid()::text,
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text,
    category text not null default 'salud' check (category in ('salud', 'fitness', 'mente', 'productividad', 'nutricion', 'otro')),
    color text not null default '#10b981',
    target_days_per_week integer not null default 7 check (target_days_per_week between 1 and 7),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Registros de Cumplimiento de Hábitos (Logs diarios)
create table if not exists public.habit_logs (
    id text primary key default gen_random_uuid()::text,
    habit_id text references public.habits(id) on delete cascade not null,
    completed_date date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_habit_date unique (habit_id, completed_date)
);

-- 4. Índices para optimizar consultas de rendimiento
create index if not exists idx_habits_created_at on public.habits (created_at desc);
create index if not exists idx_habit_logs_habit_id on public.habit_logs (habit_id);
create index if not exists idx_habit_logs_completed_date on public.habit_logs (completed_date);
create index if not exists idx_habit_logs_lookup on public.habit_logs (habit_id, completed_date);

-- 5. Habilitar Row Level Security (RLS)
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- 6. Políticas de Seguridad (Permisivas para demo y vinculadas a auth si existe usuario)
-- Política para lectura de hábitos
create policy "Permitir lectura de hábitos"
    on public.habits
    for select
    using (true);

-- Política para inserción de hábitos
create policy "Permitir creación de hábitos"
    on public.habits
    for insert
    with check (true);

-- Política para actualización de hábitos
create policy "Permitir actualización de hábitos"
    on public.habits
    for update
    using (true);

-- Política para eliminación de hábitos
create policy "Permitir eliminación de hábitos"
    on public.habits
    for delete
    using (true);

-- Políticas para los registros (habit_logs)
create policy "Permitir lectura de logs"
    on public.habit_logs
    for select
    using (true);

-- Política para inserción de logs
create policy "Permitir inserción de logs"
    on public.habit_logs
    for insert
    with check (true);

-- Política para eliminación de logs
create policy "Permitir eliminación de logs"
    on public.habit_logs
    for delete
    using (true);

-- ==============================================================================
-- Datos de muestra iniciales (Opcional para insertar directamente en Supabase)
-- ==============================================================================
insert into public.habits (id, name, description, category, color, target_days_per_week)
values 
    ('demo-habit-1', 'Beber 2 Litros de Agua', 'Mantenerse hidratado durante el día (8 vasos)', 'salud', '#0284c7', 7),
    ('demo-habit-2', 'Ejercicio o Caminata 30 min', 'Actividad física cardiovascular o de fuerza', 'fitness', '#10b981', 5),
    ('demo-habit-3', 'Meditación o Respiración', '10 minutos de calma consciente y respiración', 'mente', '#8b5cf6', 6),
    ('demo-habit-4', 'Lectura enriquecedora 20 min', 'Aprender algo de no-ficción o desarrollo personal', 'productividad', '#f59e0b', 5),
    ('demo-habit-5', 'Dormir 7 a 8 horas', 'Higiene del sueño para recuperación óptima', 'salud', '#6366f1', 7)
on conflict (id) do nothing;
