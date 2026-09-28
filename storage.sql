-- Public bucket so certificate PDFs have a shareable link
insert into storage.buckets (id, name, public) values ('certificates', 'certificates', true)
on conflict (id) do nothing;
