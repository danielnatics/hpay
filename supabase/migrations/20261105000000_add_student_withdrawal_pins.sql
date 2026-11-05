alter table public.students
  add column if not exists pin_hash text;

alter table public.students
  drop constraint if exists students_pin_hash_format;

alter table public.students
  add constraint students_pin_hash_format
  check (pin_hash is null or pin_hash ~ '^[0-9a-f]{64}$');

comment on column public.students.pin_hash is
  'SHA-256 hash of the student 4-digit withdrawal PIN.';
