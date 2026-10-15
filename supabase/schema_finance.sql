-- ==============================================================================
-- HabitPulse: Módulo de Finanzas Personales y Registro Diario de Gastos
-- Tablas: transactions, budgets con índices y políticas RLS
-- ==============================================================================

-- 1. Asegurar extensión pgcrypto para UUIDs
create extension if not exists "pgcrypto";

-- 2. Tabla de Transacciones (Gastos e Ingresos)
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    amount numeric(14,2) not null check (amount > 0),
    type text not null check (type in ('gasto', 'ingreso')),
    category text not null check (category in (
        'Alimentación',
        'Transporte',
        'Servicios/Hogar',
        'Ocio/Salidas',
        'Salud',
        'Educación',
        'Imprevistos'
    )),
    payment_method text not null check (payment_method in (
        'Efectivo',
        'Tarjeta Débito',
        'Tarjeta Crédito',
        'Transferencia'
    )),
    description text,
    date date not null default current_date,
    created_at timestamptz not null default now()
);

-- 3. Tabla de Presupuestos Mensuales
create table if not exists public.budgets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    month text not null check (month ~ '^\d{4}-\d{2}$'), -- Formato YYYY-MM (ej. 2026-10)
    amount numeric(14,2) not null check (amount >= 0),
    created_at timestamptz not null default now(),
    constraint unique_user_month unique (user_id, month)
);

-- 4. Índices para optimizar consultas frecuentes
create index if not exists idx_transactions_user_date on public.transactions (user_id, date desc);
create index if not exists idx_transactions_category on public.transactions (user_id, category);
create index if not exists idx_transactions_type on public.transactions (user_id, type);
create index if not exists idx_budgets_user_month on public.budgets (user_id, month);

-- 5. Habilitar Row Level Security (RLS)
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- 6. Políticas RLS para transactions (4 políticas separadas con auth.uid() = user_id)
create policy "Usuarios pueden consultar sus propias transacciones"
    on public.transactions
    for select
    using (auth.uid() = user_id);

create policy "Usuarios pueden insertar sus propias transacciones"
    on public.transactions
    for insert
    with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propias transacciones"
    on public.transactions
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propias transacciones"
    on public.transactions
    for delete
    using (auth.uid() = user_id);

-- 7. Políticas RLS para budgets (4 políticas separadas con auth.uid() = user_id)
create policy "Usuarios pueden consultar sus propios presupuestos"
    on public.budgets
    for select
    using (auth.uid() = user_id);

create policy "Usuarios pueden insertar sus propios presupuestos"
    on public.budgets
    for insert
    with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propios presupuestos"
    on public.budgets
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propios presupuestos"
    on public.budgets
    for delete
    using (auth.uid() = user_id);
