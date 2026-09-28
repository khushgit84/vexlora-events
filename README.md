# Vexlora Events

Registration, team matching, QR check-in, certificates, reminders and sponsor reports for college events.

## Run it
1. npm install
2. Create a Supabase project, then run schema.sql and storage.sql in the SQL editor.
3. Copy .env.local.example to .env.local and fill in every value (see SETUP-*.md for each key).
4. Insert an organization and an event (example in SETUP.md), then: npm run dev
5. Deploy: push to GitHub, import the repo in Vercel, add the same env vars there.

## Pages
- /e/<slug>              public registration + QR ticket
- /t/<token>             re-open a ticket
- /dashboard/<event-id>  organizer home (PIN)
- /checkin/<event-id>    volunteer QR scanner (PIN)
- /certificates/<event-id>  generate and email certificates (PIN)
- /reminders/<event-id>  schedule reminders (PIN)
- /report/<event-id>?k=  private sponsor report
- /v/<code>              certificate verification

Status: production build and TypeScript check pass, and the certificate PDF was test-rendered.
It has not yet been run against a live Supabase project.
