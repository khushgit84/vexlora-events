// Sends via Resend's REST API (no SDK needed). Verify your sending domain in Resend first.
export async function sendCertificateEmail(o: {
  to: string; name: string; eventTitle: string; pdfUrl: string; pdf: Uint8Array;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: o.to,
      subject: `Your certificate for ${o.eventTitle}`,
      html: `<p>Hi ${o.name},</p><p>Thanks for being part of <b>${o.eventTitle}</b>. Your certificate is attached, and you can also download it here: <a href="${o.pdfUrl}">${o.pdfUrl}</a></p>`,
      attachments: [{ filename: "certificate.pdf", content: Buffer.from(o.pdf).toString("base64") }],
    }),
  });
  return res.ok;
}
