-- 0002_storage_bucket.sql
-- Creates the public certificates bucket for hosting generated PDFs.

insert into storage.buckets (id, name, public) values ('certificates', 'certificates', true)
on conflict (id) do nothing;
