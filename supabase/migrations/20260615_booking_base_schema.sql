-- Booking base schema (bookings + available_slots).
--
-- ponytail: this exists so `supabase db reset` produces a reproducible local
-- stack. The tables were previously in lib/booking-schema.sql with a "run this
-- manually in the SQL editor" note, which meant a clean local reset failed —
-- the 20260616 booking migrations (get_available_slots / reserve_slot /
-- security3_rls) reference `bookings`/`available_slots` that never got created.
-- Promoting the base schema to an ordered-first migration (dated 20260615 so it
-- sorts before every 20260616_* migration) is the minimum change that makes the
-- migration chain apply cleanly against local Docker Supabase. Source of truth
-- for the columns remains identical to lib/booking-schema.sql. IF NOT EXISTS /
-- ON CONFLICT keep it re-runnable. LOCAL infrastructure only — no production
-- schema is touched by this file.

create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  company text,
  phone text,
  message text,
  preferred_date date not null,
  preferred_time text not null,
  timezone text default 'America/New_York',
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.available_slots (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  time text not null,
  is_booked boolean default false,
  unique (date, time)
);

-- Seed: 30-minute slots, Mon–Fri, 9:00 AM – 4:30 PM EST for local dev.
do $$
declare
  d date;
  i integer;
  times text[] := array[
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];
  t text;
begin
  for i in 0..59 loop  -- 12 weeks × 5 weekdays
    d := '2026-05-18'::date + i;
    if extract(dow from d) between 1 and 5 then  -- Mon–Fri
      foreach t in array times loop
        insert into public.available_slots (date, time)
        values (d, t)
        on conflict (date, time) do nothing;
      end loop;
    end if;
  end loop;
end $$;
