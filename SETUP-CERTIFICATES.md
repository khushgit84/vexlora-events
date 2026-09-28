# Certificates setup

1. Run storage.sql in the Supabase SQL editor.
2. npm i pdf-lib qrcode && npm i -D @types/qrcode
3. Copy these files into your project (paths match the first kit).
4. Add to .env.local:
   RESEND_API_KEY=re_xxx
   MAIL_FROM="Your Club <certificates@yourdomain.com>"   (domain must be verified in Resend)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000            (your Vercel URL in production)
5. Open /certificates/<event-id>, enter the PIN, click the button.
   It works in batches of 15, so it stays within Vercel's time limit and can be re-run safely.
   People who already got a certificate are skipped.

Notes
- Certificates go to checked-in people by default. Tick the box to include everyone registered.
- Names are printed in Latin script only (standard PDF fonts). For Devanagari or other scripts, embed a
  Noto Sans font with pdf-lib + @pdf-lib/fontkit.
- Verify links look like /v/<code> and are also printed as a QR on each certificate.
