-- Run this manually in your Supabase SQL editor against your project.

CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  message TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE available_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  UNIQUE(date, time)
);

-- Seed: 30-minute slots, Mon–Fri, 9:00 AM – 4:30 PM EST
-- Run this once to populate the next 12 weeks.
-- Adjust the start date to the Monday of your current week.
DO $$
DECLARE
  d DATE := '2026-05-18';  -- ← change to the Monday of your current week
  i INTEGER;
  times TEXT[] := ARRAY[
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];
  t TEXT;
BEGIN
  FOR i IN 0..59 LOOP  -- 12 weeks × 5 weekdays = 60
    d := '2026-05-18'::DATE + i;
    IF EXTRACT(DOW FROM d) BETWEEN 1 AND 5 THEN  -- Mon–Fri
      FOREACH t IN ARRAY times LOOP
        INSERT INTO available_slots (date, time)
        VALUES (d, t)
        ON CONFLICT (date, time) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
