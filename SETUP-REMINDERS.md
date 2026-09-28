# Reminders setup

1. Copy these files into your project. No new packages needed.
2. Add to .env.local:
   CRON_SECRET=any-long-random-string
   WHATSAPP_PHONE_ID=...        (Meta WhatsApp Cloud API phone number ID)
   WHATSAPP_TOKEN=...           (permanent access token)
   WHATSAPP_TEMPLATE=event_reminder
   (RESEND_API_KEY, MAIL_FROM, NEXT_PUBLIC_SITE_URL, CHECKIN_PIN are already set from earlier kits.)
3. In Meta WhatsApp Manager, create a Utility template named event_reminder, language English, body:
      Hi {{1}}, {{2}} Your ticket: {{3}}
   Wait for approval. Until then WhatsApp sends fail, but email still works.
4. Trigger the sender every 5 minutes. Call GET https://YOUR-SITE/api/cron/reminders with header
      Authorization: Bearer <CRON_SECRET>
   Free options: cron-job.org (supports custom headers) or a Supabase pg_cron job.
   Vercel's own cron works too, but check your plan's limits on how often it can run.
5. Open /reminders/<event-id>, enter the PIN, click "Schedule reminders".
   Re-run it after late registrations; it only adds missing rows.

Notes
- Reminders already in the past are never queued, so schedule before the day-before mark.
- Failed rows keep their error text in the reminders table for debugging.
- Each reminder email links to /t/<token>, which re-opens the participant's QR ticket.
