-- =====================================================================
-- TSC DATABASE SCHEMA (Supabase / PostgreSQL)  --  run once in: Supabase > SQL Editor
-- Row Level Security (RLS) is ON for every table. The public website (anon key) can
--   * read ONLY published content, and
--   * insert ONLY form submissions (membership, visitor, prayer, etc.).
-- It can never read private records. Staff access is decided by roles in public.profiles.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- staff profiles and roles ----------
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  roles text[] not null default '{}',   -- super_admin, pastoral_admin, followup_worker, content_editor, events_admin, finance_admin
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create or replace function public.app_has_role(variadic r text[]) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and (p.roles && r or 'super_admin'=any(p.roles)))
$$;
create or replace function public.app_is_staff() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and cardinality(p.roles)>0)
$$;

-- ---------- tables ----------
create table if not exists public.site_settings(key text primary key, value jsonb not null default '{}', updated_at timestamptz default now(), updated_by uuid default auth.uid());
create table if not exists public.departments(id uuid primary key default gen_random_uuid(), name text not null unique, description text, active boolean not null default true, created_at timestamptz default now());

create table if not exists public.programmes(
  id uuid primary key default gen_random_uuid(), title text not null, description text, banner_url text,
  start_at timestamptz not null, end_at timestamptz, venue_name text, venue_address text, map_url text,
  registration_required boolean not null default false, registration_open_at timestamptz, registration_close_at timestamptz,
  capacity int check (capacity is null or capacity>0), is_paid boolean not null default false, price_text text,
  contact_info text, custom_questions jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid default auth.uid(), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.registrations(
  id uuid primary key default gen_random_uuid(), programme_id uuid not null references public.programmes(id) on delete cascade,
  reference text not null unique, full_name text not null check (length(full_name) between 2 and 120),
  phone text not null check (length(phone) between 7 and 20), email text check (email is null or length(email)<=160),
  attendees int not null default 1 check (attendees between 1 and 20), answers jsonb not null default '{}',
  consent boolean not null check (consent), attended boolean not null default false, attended_at timestamptz,
  created_at timestamptz not null default now(), unique(programme_id, phone));

create table if not exists public.members(
  id uuid primary key default gen_random_uuid(), full_name text not null check (length(full_name) between 2 and 120),
  phone text not null check (length(phone) between 7 and 20), email text, area text, preferred_contact text, faith_status text,
  interest_departments text, department text, message text check (message is null or length(message)<=3000),
  consent boolean not null check (consent), status text not null default 'new_registration',
  date_joined date, assigned_to uuid, notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table if not exists public.visitors(
  id uuid primary key default gen_random_uuid(), full_name text not null check (length(full_name) between 2 and 120),
  phone text, email text, preferred_contact text, programme_text text, first_visit boolean default true, wants_info boolean default false,
  message text check (message is null or length(message)<=3000), consent boolean not null check (consent),
  status text not null default 'new', created_at timestamptz not null default now(), updated_at timestamptz default now());
create table if not exists public.new_believer_requests(
  id uuid primary key default gen_random_uuid(), full_name text not null check (length(full_name) between 2 and 120),
  phone text, email text, preferred_contact text, request_types text[] default '{}', message text check (message is null or length(message)<=3000),
  consent boolean not null check (consent), status text not null default 'new', created_at timestamptz not null default now(), updated_at timestamptz default now());

create table if not exists public.followups(
  id uuid primary key default gen_random_uuid(), source text not null, source_id uuid, person_name text not null, phone text, email text, preferred_contact text,
  status text not null default 'awaiting_assignment' check (status in ('awaiting_assignment','assigned','in_progress','completed')),
  assigned_to uuid, assigned_name text, next_follow_up date, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz default now());
create table if not exists public.followup_logs(
  id uuid primary key default gen_random_uuid(), followup_id uuid not null references public.followups(id) on delete cascade,
  contacted_at timestamptz not null default now(), method text, outcome text, notes text, next_action text, next_follow_up date,
  logged_by uuid default auth.uid());

create table if not exists public.prayer_requests(
  id uuid primary key default gen_random_uuid(), name text, contact_method text, contact_detail text,
  request text not null check (length(request) between 3 and 5000), may_contact boolean default false, consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new','received','assigned','followed_up','closed')),
  assigned_to uuid, internal_notes text, created_at timestamptz not null default now(), updated_at timestamptz default now());
create table if not exists public.testimonies(
  id uuid primary key default gen_random_uuid(), display_name text, attribution text not null default 'anonymous' check (attribution in ('full','first','anonymous')),
  testimony text not null check (length(testimony) between 10 and 8000), contact_detail text, permission_publish boolean not null check (permission_publish),
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  published_text text, reviewed_by uuid, created_at timestamptz not null default now());

create table if not exists public.devotionals(
  id uuid primary key default gen_random_uuid(), publish_date date not null unique, title text not null, scripture_ref text, scripture_text text,
  message text not null, application text, reflection text, prayer text, related_reading text, category text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid default auth.uid(), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.reading_plan_overrides(day int primary key check (day between 1 and 365), ot_text text, other_text text, note text, active boolean not null default true);
create table if not exists public.sermons(
  id uuid primary key default gen_random_uuid(), title text not null, speaker text, preached_on date, description text, scripture_refs text, category text,
  video_url text, audio_url text, transcript text, featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')), created_by uuid default auth.uid(), created_at timestamptz default now());
create table if not exists public.gallery_items(
  id uuid primary key default gen_random_uuid(), image_url text not null, thumb_url text, caption text, alt_text text, category text, event_name text, event_date date,
  featured boolean not null default false, sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')), created_by uuid default auth.uid(), created_at timestamptz default now());

create table if not exists public.partnership_enquiries(id uuid primary key default gen_random_uuid(), full_name text not null, phone text, email text, interest text, message text, consent boolean not null check (consent), status text not null default 'new', created_at timestamptz not null default now());
create table if not exists public.contact_enquiries(id uuid primary key default gen_random_uuid(), name text not null, phone text, email text, subject text, message text not null check (length(message)<=5000), consent boolean not null check (consent), status text not null default 'new', created_at timestamptz not null default now());
create table if not exists public.finance_records(
  id uuid primary key default gen_random_uuid(), entry_date date not null, type text not null check (type in ('income','expense')), category text, amount numeric(14,2) not null check (amount>0),
  currency text not null default 'NGN', description text, payment_ref text, verified boolean not null default false, verified_by uuid,
  created_by uuid default auth.uid(), created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.notification_templates(id uuid primary key default gen_random_uuid(), key text unique not null, subject text, body text, active boolean not null default true);
create table if not exists public.audit_logs(id bigserial primary key, at timestamptz not null default now(), actor uuid, action text, table_name text, record_id text, details jsonb);

insert into public.site_settings(key,value) values
 ('member_statuses','["new_registration","awaiting_contact","follow_up_in_progress","orientation","active_member","inactive","archived"]'),
 ('announcement','{}') on conflict (key) do nothing;

-- ---------- views and functions ----------
create or replace view public.public_testimonies as
 select id, created_at,
  case attribution when 'full' then coalesce(nullif(display_name,''),'Anonymous') when 'first' then split_part(coalesce(nullif(display_name,''),'Anonymous'),' ',1) else 'Anonymous' end as author,
  coalesce(published_text, testimony) as text
 from public.testimonies where status='approved';
create or replace view public.staff_directory as select id, full_name from public.profiles where active and cardinality(roles)>0;

create or replace function public.programme_spots(pid uuid) returns int language sql stable security definer set search_path=public as $$
  select case when p.capacity is null then null else greatest(p.capacity - coalesce((select sum(attendees) from registrations r where r.programme_id=p.id),0),0)::int end
  from programmes p where p.id=pid and p.status='published'
$$;

create or replace function public.touch_updated() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create or replace function public.guard_registration() returns trigger language plpgsql security definer set search_path=public as $$
declare p public.programmes; used int;
begin
  select * into p from public.programmes where id=new.programme_id and status='published';
  if not found then raise exception 'programme is not open for registration'; end if;
  if not p.registration_required then raise exception 'registration is not required for this programme'; end if;
  if p.registration_open_at is not null and now()<p.registration_open_at then raise exception 'registration is not open yet'; end if;
  if p.registration_close_at is not null and now()>p.registration_close_at then raise exception 'registration is closed'; end if;
  if p.capacity is not null then
    perform pg_advisory_xact_lock(hashtext(p.id::text));
    select coalesce(sum(attendees),0) into used from public.registrations where programme_id=p.id;
    if used+new.attendees>p.capacity then raise exception 'programme is full (capacity reached)'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_registration on public.registrations;
create trigger trg_guard_registration before insert on public.registrations for each row execute function public.guard_registration();

create or replace function public.create_followup() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.followups(source, source_id, person_name, phone, email, preferred_contact, next_follow_up)
  values (tg_argv[0], new.id, new.full_name, new.phone, new.email, new.preferred_contact, (now() + interval '2 days')::date);
  return new;
end $$;
drop trigger if exists trg_members_followup on public.members;     create trigger trg_members_followup after insert on public.members for each row execute function public.create_followup('membership');
drop trigger if exists trg_visitors_followup on public.visitors;   create trigger trg_visitors_followup after insert on public.visitors for each row execute function public.create_followup('visitor');
drop trigger if exists trg_nb_followup on public.new_believer_requests; create trigger trg_nb_followup after insert on public.new_believer_requests for each row execute function public.create_followup('new_believer');

create or replace function public.guard_followup_update() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.app_has_role('pastoral_admin') then
    if new.assigned_to is distinct from old.assigned_to or new.assigned_name is distinct from old.assigned_name or new.person_name is distinct from old.person_name or new.phone is distinct from old.phone or new.source is distinct from old.source then
      raise exception 'only pastoral administrators can reassign or edit contact details';
    end if;
  end if;
  new.updated_at := now();
  if new.status='completed' and old.status<>'completed' then new.completed_at := now(); end if;
  return new;
end $$;
drop trigger if exists trg_guard_followup on public.followups; create trigger trg_guard_followup before update on public.followups for each row execute function public.guard_followup_update();

create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $$
declare rid text; cols text[];
begin
  if tg_op='DELETE' then rid := to_jsonb(old)->>'id'; else rid := to_jsonb(new)->>'id'; end if;
  if tg_op='UPDATE' then select array_agg(n.key) into cols from jsonb_each(to_jsonb(new)) n where n.value is distinct from (to_jsonb(old)->n.key); end if;
  insert into public.audit_logs(actor, action, table_name, record_id, details) values (auth.uid(), tg_op, tg_table_name, rid, jsonb_build_object('changed_columns', cols));
  if tg_op='DELETE' then return old; end if; return new;
end $$;

drop trigger if exists trg_touch_programmes on public.programmes; create trigger trg_touch_programmes before update on public.programmes for each row execute function public.touch_updated();
drop trigger if exists trg_touch_members on public.members; create trigger trg_touch_members before update on public.members for each row execute function public.touch_updated();
drop trigger if exists trg_touch_visitors on public.visitors; create trigger trg_touch_visitors before update on public.visitors for each row execute function public.touch_updated();
drop trigger if exists trg_touch_new_believer_requests on public.new_believer_requests; create trigger trg_touch_new_believer_requests before update on public.new_believer_requests for each row execute function public.touch_updated();
drop trigger if exists trg_touch_prayer_requests on public.prayer_requests; create trigger trg_touch_prayer_requests before update on public.prayer_requests for each row execute function public.touch_updated();
drop trigger if exists trg_touch_devotionals on public.devotionals; create trigger trg_touch_devotionals before update on public.devotionals for each row execute function public.touch_updated();
drop trigger if exists trg_touch_finance_records on public.finance_records; create trigger trg_touch_finance_records before update on public.finance_records for each row execute function public.touch_updated();
drop trigger if exists trg_audit_programmes on public.programmes; create trigger trg_audit_programmes after update or delete on public.programmes for each row execute function public.audit_row();
drop trigger if exists trg_audit_registrations on public.registrations; create trigger trg_audit_registrations after update or delete on public.registrations for each row execute function public.audit_row();
drop trigger if exists trg_audit_members on public.members; create trigger trg_audit_members after update or delete on public.members for each row execute function public.audit_row();
drop trigger if exists trg_audit_visitors on public.visitors; create trigger trg_audit_visitors after update or delete on public.visitors for each row execute function public.audit_row();
drop trigger if exists trg_audit_new_believer_requests on public.new_believer_requests; create trigger trg_audit_new_believer_requests after update or delete on public.new_believer_requests for each row execute function public.audit_row();
drop trigger if exists trg_audit_followups on public.followups; create trigger trg_audit_followups after update or delete on public.followups for each row execute function public.audit_row();
drop trigger if exists trg_audit_followup_logs on public.followup_logs; create trigger trg_audit_followup_logs after update or delete on public.followup_logs for each row execute function public.audit_row();
drop trigger if exists trg_audit_prayer_requests on public.prayer_requests; create trigger trg_audit_prayer_requests after update or delete on public.prayer_requests for each row execute function public.audit_row();
drop trigger if exists trg_audit_testimonies on public.testimonies; create trigger trg_audit_testimonies after update or delete on public.testimonies for each row execute function public.audit_row();
drop trigger if exists trg_audit_devotionals on public.devotionals; create trigger trg_audit_devotionals after update or delete on public.devotionals for each row execute function public.audit_row();
drop trigger if exists trg_audit_sermons on public.sermons; create trigger trg_audit_sermons after update or delete on public.sermons for each row execute function public.audit_row();
drop trigger if exists trg_audit_gallery_items on public.gallery_items; create trigger trg_audit_gallery_items after update or delete on public.gallery_items for each row execute function public.audit_row();
drop trigger if exists trg_audit_departments on public.departments; create trigger trg_audit_departments after update or delete on public.departments for each row execute function public.audit_row();
drop trigger if exists trg_audit_reading_plan_overrides on public.reading_plan_overrides; create trigger trg_audit_reading_plan_overrides after update or delete on public.reading_plan_overrides for each row execute function public.audit_row();
drop trigger if exists trg_audit_site_settings on public.site_settings; create trigger trg_audit_site_settings after update or delete on public.site_settings for each row execute function public.audit_row();
drop trigger if exists trg_audit_partnership_enquiries on public.partnership_enquiries; create trigger trg_audit_partnership_enquiries after update or delete on public.partnership_enquiries for each row execute function public.audit_row();
drop trigger if exists trg_audit_contact_enquiries on public.contact_enquiries; create trigger trg_audit_contact_enquiries after update or delete on public.contact_enquiries for each row execute function public.audit_row();
drop trigger if exists trg_audit_notification_templates on public.notification_templates; create trigger trg_audit_notification_templates after update or delete on public.notification_templates for each row execute function public.audit_row();
drop trigger if exists trg_audit_finance_records on public.finance_records; create trigger trg_audit_finance_records after insert or update or delete on public.finance_records for each row execute function public.audit_row();
drop trigger if exists trg_audit_profiles on public.profiles; create trigger trg_audit_profiles after insert or update or delete on public.profiles for each row execute function public.audit_row();

-- ---------- privileges ----------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public;
grant usage on schema public to anon, authenticated;
grant select on public.programmes, public.devotionals, public.sermons, public.gallery_items, public.reading_plan_overrides, public.departments, public.site_settings, public.public_testimonies to anon;
grant insert on public.members, public.visitors, public.new_believer_requests, public.prayer_requests, public.testimonies, public.registrations, public.partnership_enquiries, public.contact_enquiries to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.public_testimonies, public.staff_directory to authenticated;
revoke all on public.audit_logs from authenticated; grant select on public.audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.programme_spots(uuid) to anon, authenticated;
grant execute on function public.app_has_role(variadic text[]) to authenticated;
grant execute on function public.app_is_staff() to authenticated;

-- ---------- row level security ----------

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.departments enable row level security;
alter table public.programmes enable row level security;
alter table public.registrations enable row level security;
alter table public.members enable row level security;
alter table public.visitors enable row level security;
alter table public.new_believer_requests enable row level security;
alter table public.followups enable row level security;
alter table public.followup_logs enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.testimonies enable row level security;
alter table public.devotionals enable row level security;
alter table public.reading_plan_overrides enable row level security;
alter table public.sermons enable row level security;
alter table public.gallery_items enable row level security;
alter table public.partnership_enquiries enable row level security;
alter table public.contact_enquiries enable row level security;
alter table public.finance_records enable row level security;
alter table public.notification_templates enable row level security;
alter table public.audit_logs enable row level security;
drop policy if exists "profiles read own" on public.profiles; create policy "profiles read own" on public.profiles for select to authenticated using (id=auth.uid());
drop policy if exists "profiles staff manage" on public.profiles; create policy "profiles staff manage" on public.profiles for all to authenticated using (public.app_has_role('super_admin')) with check (public.app_has_role('super_admin'));
drop policy if exists "settings public read" on public.site_settings; create policy "settings public read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "site_settings staff manage" on public.site_settings; create policy "site_settings staff manage" on public.site_settings for all to authenticated using (public.app_has_role('content_editor')) with check (public.app_has_role('content_editor'));
drop policy if exists "departments public read" on public.departments; create policy "departments public read" on public.departments for select to anon, authenticated using (active);
drop policy if exists "departments staff manage" on public.departments; create policy "departments staff manage" on public.departments for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "programmes public read" on public.programmes; create policy "programmes public read" on public.programmes for select to anon, authenticated using (status='published');
drop policy if exists "programmes staff manage" on public.programmes; create policy "programmes staff manage" on public.programmes for all to authenticated using (public.app_has_role('events_admin')) with check (public.app_has_role('events_admin'));
drop policy if exists "registrations public insert" on public.registrations; create policy "registrations public insert" on public.registrations for insert to anon, authenticated with check (consent is true);
drop policy if exists "registrations staff manage" on public.registrations; create policy "registrations staff manage" on public.registrations for all to authenticated using (public.app_has_role('events_admin')) with check (public.app_has_role('events_admin'));
drop policy if exists "members public insert" on public.members; create policy "members public insert" on public.members for insert to anon, authenticated with check (consent is true and status='new_registration');
drop policy if exists "members staff manage" on public.members; create policy "members staff manage" on public.members for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "visitors public insert" on public.visitors; create policy "visitors public insert" on public.visitors for insert to anon, authenticated with check (consent is true and status='new');
drop policy if exists "visitors staff manage" on public.visitors; create policy "visitors staff manage" on public.visitors for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "new_believer_requests public insert" on public.new_believer_requests; create policy "new_believer_requests public insert" on public.new_believer_requests for insert to anon, authenticated with check (consent is true and status='new');
drop policy if exists "new_believer_requests staff manage" on public.new_believer_requests; create policy "new_believer_requests staff manage" on public.new_believer_requests for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "followups staff manage" on public.followups; create policy "followups staff manage" on public.followups for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "followups worker read" on public.followups; create policy "followups worker read" on public.followups for select to authenticated using (assigned_to=auth.uid());
drop policy if exists "followups worker update" on public.followups; create policy "followups worker update" on public.followups for update to authenticated using (assigned_to=auth.uid()) with check (assigned_to=auth.uid());
drop policy if exists "followup_logs staff manage" on public.followup_logs; create policy "followup_logs staff manage" on public.followup_logs for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "followup_logs worker read" on public.followup_logs; create policy "followup_logs worker read" on public.followup_logs for select to authenticated using (exists(select 1 from public.followups f where f.id=followup_id and f.assigned_to=auth.uid()));
drop policy if exists "followup_logs worker insert" on public.followup_logs; create policy "followup_logs worker insert" on public.followup_logs for insert to authenticated with check (exists(select 1 from public.followups f where f.id=followup_id and f.assigned_to=auth.uid()));
drop policy if exists "prayer public insert" on public.prayer_requests; create policy "prayer public insert" on public.prayer_requests for insert to anon, authenticated with check (consent is true and status='new');
drop policy if exists "prayer_requests staff manage" on public.prayer_requests; create policy "prayer_requests staff manage" on public.prayer_requests for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "testimonies public insert" on public.testimonies; create policy "testimonies public insert" on public.testimonies for insert to anon, authenticated with check (permission_publish is true and status='pending' and published_text is null and reviewed_by is null);
drop policy if exists "testimonies staff manage" on public.testimonies; create policy "testimonies staff manage" on public.testimonies for all to authenticated using (public.app_has_role('content_editor','pastoral_admin')) with check (public.app_has_role('content_editor','pastoral_admin'));
drop policy if exists "devotionals public read" on public.devotionals; create policy "devotionals public read" on public.devotionals for select to anon, authenticated using (status='published' and publish_date <= (now() at time zone 'Africa/Lagos')::date);
drop policy if exists "devotionals staff manage" on public.devotionals; create policy "devotionals staff manage" on public.devotionals for all to authenticated using (public.app_has_role('content_editor')) with check (public.app_has_role('content_editor'));
drop policy if exists "plan public read" on public.reading_plan_overrides; create policy "plan public read" on public.reading_plan_overrides for select to anon, authenticated using (active);
drop policy if exists "reading_plan_overrides staff manage" on public.reading_plan_overrides; create policy "reading_plan_overrides staff manage" on public.reading_plan_overrides for all to authenticated using (public.app_has_role('content_editor')) with check (public.app_has_role('content_editor'));
drop policy if exists "sermons public read" on public.sermons; create policy "sermons public read" on public.sermons for select to anon, authenticated using (status='published');
drop policy if exists "sermons staff manage" on public.sermons; create policy "sermons staff manage" on public.sermons for all to authenticated using (public.app_has_role('content_editor')) with check (public.app_has_role('content_editor'));
drop policy if exists "gallery_items public read" on public.gallery_items; create policy "gallery_items public read" on public.gallery_items for select to anon, authenticated using (status='published');
drop policy if exists "gallery_items staff manage" on public.gallery_items; create policy "gallery_items staff manage" on public.gallery_items for all to authenticated using (public.app_has_role('content_editor')) with check (public.app_has_role('content_editor'));
drop policy if exists "partnership_enquiries public insert" on public.partnership_enquiries; create policy "partnership_enquiries public insert" on public.partnership_enquiries for insert to anon, authenticated with check (consent is true);
drop policy if exists "partnership_enquiries staff manage" on public.partnership_enquiries; create policy "partnership_enquiries staff manage" on public.partnership_enquiries for all to authenticated using (public.app_has_role('pastoral_admin','finance_admin')) with check (public.app_has_role('pastoral_admin','finance_admin'));
drop policy if exists "contact public insert" on public.contact_enquiries; create policy "contact public insert" on public.contact_enquiries for insert to anon, authenticated with check (consent is true);
drop policy if exists "contact_enquiries staff manage" on public.contact_enquiries; create policy "contact_enquiries staff manage" on public.contact_enquiries for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "finance_records staff manage" on public.finance_records; create policy "finance_records staff manage" on public.finance_records for all to authenticated using (public.app_has_role('finance_admin')) with check (public.app_has_role('finance_admin'));
drop policy if exists "notification_templates staff manage" on public.notification_templates; create policy "notification_templates staff manage" on public.notification_templates for all to authenticated using (public.app_has_role('pastoral_admin')) with check (public.app_has_role('pastoral_admin'));
drop policy if exists "audit super read" on public.audit_logs; create policy "audit super read" on public.audit_logs for select to authenticated using (public.app_has_role('super_admin'));

-- ---------- storage bucket for gallery images and programme banners ----------
insert into storage.buckets(id, name, public) values ('gallery','gallery',true) on conflict (id) do nothing;
drop policy if exists "gallery public read" on storage.objects;
create policy "gallery public read" on storage.objects for select to anon, authenticated using (bucket_id='gallery');
drop policy if exists "gallery editors write" on storage.objects;
create policy "gallery editors write" on storage.objects for insert to authenticated with check (bucket_id='gallery' and public.app_has_role('content_editor','events_admin'));
drop policy if exists "gallery editors delete" on storage.objects;
create policy "gallery editors delete" on storage.objects for delete to authenticated using (bucket_id='gallery' and public.app_has_role('content_editor'));

-- ---------- retention: run manually (SQL Editor) or schedule with pg_cron. Review periods first. ----------
create or replace function public.purge_old_records() returns text language plpgsql security definer set search_path=public as $$
declare a int; b int; c int; d int;
begin
  if not public.app_has_role('super_admin') then raise exception 'super administrator only'; end if;
  delete from prayer_requests where created_at < now() - interval '12 months';              get diagnostics a = row_count;
  delete from visitors where created_at < now() - interval '12 months';                     get diagnostics b = row_count;
  delete from contact_enquiries where created_at < now() - interval '12 months';            get diagnostics c = row_count;
  delete from registrations where created_at < now() - interval '24 months';               get diagnostics d = row_count;
  return format('prayer=%s visitors=%s contact=%s registrations=%s', a, b, c, d);
end $$;
grant execute on function public.purge_old_records() to authenticated;

-- ---------- FIRST SUPER ADMINISTRATOR ----------
-- 1) Supabase > Authentication > Users > Add user (email + password). Use the church email.
-- 2) Then run this (change the email and name):
--   insert into public.profiles(id, full_name, roles)
--   select id, 'Apostle Oluwaseun Israel', array['super_admin'] from auth.users where email='YOUR_EMAIL_HERE'
--   on conflict (id) do update set roles=excluded.roles, active=true;
