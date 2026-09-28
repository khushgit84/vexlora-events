# Dashboard + sponsor report setup

1. Copy these files into your project (paths match the earlier kits). No new packages needed.
2. Add to .env.local:  REPORT_SECRET=any-long-random-string
   (NEXT_PUBLIC_SITE_URL and CHECKIN_PIN should already be set.)
3. Open /dashboard/<event-id>, enter the PIN.
   - Shows registered / checked in / certificates sent
   - "Copy sponsor report link" gives a private link (/report/<event-id>?k=...) you can send to sponsors
4. On the report page, the "Save as PDF" button opens the print dialog. Choose Save as PDF and attach it to your sponsor email.

Notes
- The report only reads the sponsor_* views from schema.sql. Sponsors see counts only, never names or emails.
- Changing REPORT_SECRET invalidates every link you've shared.
