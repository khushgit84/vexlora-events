export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`email ${res.status}`);
}

// WhatsApp Cloud API. Business-initiated messages must use an approved template.
// Template (category: Utility) body:  "Hi {{1}}, {{2}} Your ticket: {{3}}"
export async function sendWhatsApp(phone: string, name: string, line: string, ticketUrl: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits; // assume India for bare 10-digit numbers
  const res = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: digits,
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE ?? "event_reminder",
        language: { code: "en" },
        components: [{
          type: "body",
          parameters: [name, line, ticketUrl].map((text) => ({ type: "text", text })),
        }],
      },
    }),
  });
  if (!res.ok) throw new Error(`whatsapp ${res.status}`);
}
