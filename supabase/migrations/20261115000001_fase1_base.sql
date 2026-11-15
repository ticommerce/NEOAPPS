-- Fase 1: negocios, usuarios con roles, configuración del agente y catálogo.
-- Regla general: toda tabla de negocio lleva business_id y políticas de filas
-- (RLS) basadas en la membresía del usuario autenticado.

create type public.member_role as enum ('owner', 'employee');
create type public.business_type as enum ('restaurant', 'salon', 'clinic', 'workshop', 'other');
create type public.item_kind as enum ('product', 'service');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 2 and 80),
  type public.business_type not null default 'other',
  description text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  maps_url text not null default '',
  policies text not null default '',
  timezone text not null default 'America/Costa_Rica',
  currency text not null default 'CRC',
  created_at timestamptz not null default now()
);

create table public.memberships (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'employee',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null check (email = lower(email)),
  role public.member_role not null default 'employee',
  created_at timestamptz not null default now(),
  unique (business_id, email)
);

create table public.agent_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  agent_name text not null default 'Sofía',
  tone text not null default 'amable' check (tone in ('amable', 'formal', 'casual')),
  greeting text not null default '',
  extra_instructions text not null default '',
  escalation_phone text not null default '',
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.business_hours (
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  closed boolean not null default false,
  opens time not null default '08:00',
  closes time not null default '17:00',
  primary key (business_id, weekday),
  check (closed or opens < closes)
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  question text not null check (length(trim(question)) > 0),
  answer text not null check (length(trim(answer)) > 0),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index faqs_business_idx on public.faqs (business_id, position);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, business_id)
);
create index categories_business_idx on public.categories (business_id, position);

-- Un solo catálogo para productos (pedidos) y servicios (citas, fase 3).
-- Los precios se guardan en la unidad mínima de la moneda (céntimos).
create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid,
  kind public.item_kind not null default 'product',
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 5 and 600),
  available boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, business_id),
  -- La categoría debe pertenecer al mismo negocio.
  foreign key (category_id, business_id) references public.categories (id, business_id)
    on delete set null (category_id)
);
create index products_business_idx on public.products (business_id, category_id, position);

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  min_select integer not null default 0 check (min_select >= 0),
  max_select integer not null default 1 check (max_select >= 1),
  created_at timestamptz not null default now(),
  unique (id, business_id),
  check (min_select <= max_select)
);
create index modifier_groups_business_idx on public.modifier_groups (business_id);

create table public.modifiers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  group_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  available boolean not null default true,
  position integer not null default 0,
  foreign key (group_id, business_id) references public.modifier_groups (id, business_id) on delete cascade
);
create index modifiers_group_idx on public.modifiers (group_id, position);

create table public.product_modifier_groups (
  business_id uuid not null,
  product_id uuid not null,
  group_id uuid not null,
  primary key (product_id, group_id),
  foreign key (product_id, business_id) references public.products (id, business_id) on delete cascade,
  foreign key (group_id, business_id) references public.modifier_groups (id, business_id) on delete cascade
);

-- Contactos del formulario de la landing (no pertenecen a ningún negocio).
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  business_name text not null default '' check (length(business_name) <= 120),
  industry text not null default '' check (length(industry) <= 40),
  phone text not null check (length(trim(phone)) between 6 and 30),
  email text not null default '' check (length(email) <= 200),
  message text not null default '' check (length(message) <= 2000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funciones de apoyo para las políticas (security definer evita recursión)
-- ---------------------------------------------------------------------------

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create function public.is_member(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships where business_id = b and user_id = (select auth.uid())
  ) or public.is_platform_admin();
$$;

create function public.is_owner(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships
    where business_id = b and user_id = (select auth.uid()) and role = 'owner'
  ) or public.is_platform_admin();
$$;

create function public.shares_business_with(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships mine
    join public.memberships theirs using (business_id)
    where mine.user_id = (select auth.uid()) and theirs.user_id = u
  ) or public.is_platform_admin();
$$;

-- ---------------------------------------------------------------------------
-- Perfil automático al registrarse
-- ---------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Operaciones que cruzan tablas (se llaman por RPC con la sesión del usuario)
-- ---------------------------------------------------------------------------

-- Crea un negocio y deja al usuario actual como dueño, con valores iniciales.
create function public.create_business(p_name text, p_type public.business_type)
returns public.businesses
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_base text;
  v_slug text;
  v_n integer := 1;
  v_business public.businesses;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if (select count(*) from public.memberships where user_id = v_uid and role = 'owner') >= 5 then
    raise exception 'too_many_businesses';
  end if;

  v_base := trim(both '-' from regexp_replace(
    lower(translate(p_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then
    v_base := 'negocio';
  end if;
  v_slug := v_base;
  while exists (select 1 from public.businesses where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.businesses (name, slug, type)
  values (trim(p_name), v_slug, p_type)
  returning * into v_business;

  insert into public.memberships (business_id, user_id, role)
  values (v_business.id, v_uid, 'owner');

  insert into public.agent_settings (business_id) values (v_business.id);

  insert into public.business_hours (business_id, weekday, closed)
  select v_business.id, d, d = 0 from generate_series(0, 6) as d;

  return v_business;
end;
$$;

-- Convierte en membresías las invitaciones pendientes del correo del usuario.
-- Se ejecuta con sesión iniciada, es decir, con el correo ya confirmado.
create function public.accept_invitations() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower((select auth.jwt()) ->> 'email');
  v_count integer;
begin
  if v_uid is null or v_email is null then
    return 0;
  end if;
  insert into public.memberships (business_id, user_id, role)
  select business_id, v_uid, role from public.invitations where email = v_email
  on conflict (business_id, user_id) do nothing;
  get diagnostics v_count = row_count;
  delete from public.invitations where email = v_email;
  return v_count;
end;
$$;

-- Un negocio nunca se queda sin dueño.
create function public.keep_one_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from public.businesses where id = old.business_id)
     and not exists (
       select 1 from public.memberships
       where business_id = old.business_id and role = 'owner' and user_id <> old.user_id
     ) then
    raise exception 'last_owner';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger memberships_keep_one_owner
  before update or delete on public.memberships
  for each row execute function public.keep_one_owner();

revoke execute on function public.create_business(text, public.business_type) from public, anon;
revoke execute on function public.accept_invitations() from public, anon;
grant execute on function public.create_business(text, public.business_type) to authenticated;
grant execute on function public.accept_invitations() to authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad por filas
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.agent_settings enable row level security;
alter table public.business_hours enable row level security;
alter table public.faqs enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.product_modifier_groups enable row level security;
alter table public.leads enable row level security;

-- Perfiles: cada quien el suyo y el de sus compañeros de negocio.
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.shares_business_with(user_id));
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()));

-- Negocios: los miembros leen; solo el dueño edita. El alta va por create_business().
create policy businesses_select on public.businesses for select to authenticated
  using (public.is_member(id));
create policy businesses_update on public.businesses for update to authenticated
  using (public.is_owner(id)) with check (public.is_owner(id));

-- Membresías e invitaciones: los miembros ven el equipo; el dueño lo administra.
create policy memberships_select on public.memberships for select to authenticated
  using (public.is_member(business_id));
create policy memberships_update on public.memberships for update to authenticated
  using (public.is_owner(business_id)) with check (public.is_owner(business_id));
create policy memberships_delete on public.memberships for delete to authenticated
  using (public.is_owner(business_id));

create policy invitations_select on public.invitations for select to authenticated
  using (public.is_owner(business_id));
create policy invitations_insert on public.invitations for insert to authenticated
  with check (public.is_owner(business_id));
create policy invitations_delete on public.invitations for delete to authenticated
  using (public.is_owner(business_id));

-- Configuración del negocio: lectura para miembros, escritura para el dueño.
create policy agent_settings_select on public.agent_settings for select to authenticated
  using (public.is_member(business_id));
create policy agent_settings_update on public.agent_settings for update to authenticated
  using (public.is_owner(business_id)) with check (public.is_owner(business_id));

create policy business_hours_select on public.business_hours for select to authenticated
  using (public.is_member(business_id));
create policy business_hours_write on public.business_hours for all to authenticated
  using (public.is_owner(business_id)) with check (public.is_owner(business_id));

create policy faqs_select on public.faqs for select to authenticated
  using (public.is_member(business_id));
create policy faqs_write on public.faqs for all to authenticated
  using (public.is_owner(business_id)) with check (public.is_owner(business_id));

-- Catálogo: cualquier miembro (dueño o empleado) lo administra.
create policy categories_all on public.categories for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy products_all on public.products for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy modifier_groups_all on public.modifier_groups for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy modifiers_all on public.modifiers for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy product_modifier_groups_all on public.product_modifier_groups for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));

-- Leads: cualquiera puede enviar el formulario; solo el administrador los lee.
create policy leads_insert on public.leads for insert to anon, authenticated
  with check (true);
create policy leads_select on public.leads for select to authenticated
  using (public.is_platform_admin());
