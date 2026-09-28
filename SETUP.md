# Setup (5 minutes)

1. npx create-next-app@latest vexlora-events --ts --app --no-tailwind --src-dir=false --import-alias "@/*"
2. cd vexlora-events && npm i @supabase/supabase-js qrcode.react html5-qrcode
3. Copy everything from this kit into the project (overwrite app/layout.tsx and app/globals.css). Delete app/page.tsx if you don't need it.
4. Rename .env.local.example to .env.local and fill in your Supabase keys and a PIN.
5. Insert a test event in Supabase (needs an organization row first):
   insert into events (org_id, slug, title, starts_at, venue, allow_solo_matching, team_size_max)
   values ('<your-org-id>', 'test-hack', 'Test Hackathon', now() + interval '7 days', 'Main Auditorium', true, 4);
6. npm run dev
   Registration: http://localhost:3000/e/test-hack
   Check-in desk (use the event id): http://localhost:3000/checkin/<event-id>
   Camera scanning needs HTTPS on phones, so deploy to Vercel or use ngrok to test on a phone.
