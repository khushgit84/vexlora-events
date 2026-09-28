import Link from "next/link";

export const metadata = {
  title: "Vexlora Events — Run your whole college event from one link",
  description: "Registration, team matching, reminders, QR check-in, certificates and sponsor reports. Built for Indian college clubs, E-Cells and hackathon organisers.",
};

function QRPlaceholder() {
  // Decorative SVG QR pattern (purely visual)
  return (
    <svg viewBox="0 0 21 21" fill="currentColor" width="150" height="150" style={{ display: "block", margin: "0 auto" }} aria-hidden="true">
      <rect x="0" y="0" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="1" y="1" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="2" y="2" width="3" height="3" />
      <rect x="14" y="0" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="15" y="1" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="16" y="2" width="3" height="3" />
      <rect x="0" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="1" y="15" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <rect x="2" y="16" width="3" height="3" />
      {/* Random dots */}
      {[
        [9,1],[10,3],[8,5],[11,6],[9,8],[12,2],[10,10],[8,12],[13,9],[9,14],[11,15],[13,12],[15,10],[17,12],[10,17],[13,16],[16,15],[18,17],[8,9],[12,8],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  );
}

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Instrument+Sans:wght@400;600&display=swap');
        .landing{font-family:"Instrument Sans",system-ui,sans-serif}
        .landing h1,.landing h2,.landing h3{font-family:"Bricolage Grotesque","Segoe UI",system-ui,sans-serif;letter-spacing:-.02em;line-height:1.05;margin:0}
        .wrap{max-width:1040px;margin:0 auto;padding:0 20px}
        .lnav{display:flex;justify-content:space-between;align-items:center;padding:20px 0;font-weight:600}
        .lbtn{display:inline-block;background:var(--pop);color:#fff;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:8px}
        .lbtn:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
        .hero{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;padding:40px 0 72px}
        .hero h1{font-size:clamp(2.6rem,7vw,5rem);font-weight:800}
        .hero p{font-size:1.15rem;color:var(--mute,#5b6478);max-width:34em;margin:20px 0 28px}
        .lticket{position:relative;background:#fff;border:2px solid var(--ink);border-radius:14px;padding:22px;transform:rotate(2.5deg);max-width:340px;justify-self:center}
        .lticket::before,.lticket::after{content:"";position:absolute;top:58%;width:22px;height:22px;background:var(--paper);border:2px solid var(--ink);border-radius:50%}
        .lticket::before{left:-13px}.lticket::after{right:-13px}
        .lticket h3{font-size:1.5rem;font-weight:800}
        .lticket small{color:var(--mute,#5b6478)}
        .lticket hr{border:0;border-top:2px dashed var(--line);margin:22px -22px}
        .stamp{position:absolute;right:18px;top:16px;border:2px solid var(--pop);color:var(--pop);font-weight:800;padding:2px 10px;border-radius:6px;transform:rotate(-8deg);font-family:"Bricolage Grotesque",sans-serif}
        .lsection{padding:56px 0;border-top:1px solid var(--line)}
        .lsection h2{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;margin-bottom:28px}
        .flow{list-style:none;margin:0;padding:0 0 0 28px;border-left:2px solid var(--ink);max-width:680px}
        .flow li{position:relative;padding:0 0 26px 20px}
        .flow li::before{content:"";position:absolute;left:-37px;top:6px;width:14px;height:14px;background:var(--pop);border:2px solid var(--paper);border-radius:50%;box-shadow:0 0 0 2px var(--ink)}
        .flow b{display:block;font-size:1.15rem}
        .flow span{color:var(--mute,#5b6478)}
        .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:2px solid var(--ink);border-radius:14px;overflow:hidden}
        .plan{padding:28px;border-right:2px solid var(--ink)}
        .plan:last-child{border-right:0}
        .plan.hot{background:var(--ink);color:var(--paper)}
        .plan h3{font-size:1.2rem}
        .price{font-family:"Bricolage Grotesque",sans-serif;font-size:2.4rem;font-weight:800;margin:10px 0}
        .plan p{margin:0;font-size:.95rem;opacity:.85}
        .cta{text-align:center;padding:72px 0 88px}
        .cta h2{margin-bottom:16px}
        .cta p{color:var(--mute,#5b6478);margin:0 auto 28px;max-width:32em}
        .lfooter{padding:24px 0 40px;color:var(--mute,#5b6478);font-size:.9rem}
        @media(max-width:760px){.hero{grid-template-columns:1fr;gap:36px}.plans{grid-template-columns:1fr}.plan{border-right:0;border-bottom:2px solid var(--ink)}.plan:last-child{border-bottom:0}}
      `}</style>
      <div className="landing">
        <div className="wrap">
          <nav className="lnav">
            <span>Vexlora Events</span>
            <Link href="/login">Organiser login</Link>
          </nav>

          <header className="hero">
            <div>
              <h1>Run your whole event from one link.</h1>
              <p>Registration, team matching, reminders, QR check-in, certificates and a sponsor report. Built by a student who has organised these events on Google Forms and Excel, and got tired of it.</p>
              <Link className="lbtn" href="/login">Get started free</Link>
            </div>
            <div className="lticket" aria-hidden="true">
              <span className="stamp">Checked in</span>
              <small>Hack Night, Main Auditorium</small>
              <h3>Aarav Sharma</h3>
              <small>CSE, Year 2</small>
              <hr />
              <QRPlaceholder />
            </div>
          </header>

          <section className="lsection">
            <h2>What happens to one event</h2>
            <ol className="flow">
              <li><b>Students register on one page</b><span>Solo participants can be matched into teams by skill automatically.</span></li>
              <li><b>Reminders go out on their own</b><span>A day before and an hour before, by email and WhatsApp, each with the student&apos;s QR ticket.</span></li>
              <li><b>Volunteers scan tickets at the door</b><span>A phone camera is enough. Duplicate and fake tickets are flagged instantly.</span></li>
              <li><b>Certificates reach every attendee</b><span>Generated as PDFs, emailed, and verifiable with a QR code on the certificate.</span></li>
              <li><b>Sponsors get a report they can trust</b><span>Attendance rate, colleges, branches and skills, as a link or a PDF. No student names or emails shared.</span></li>
            </ol>
          </section>

          <section className="lsection">
            <h2>Pricing</h2>
            <div className="plans">
              <div className="plan"><h3>Small events</h3><div className="price">Free</div><p>Workshops and talks up to 50 people. Everything included.</p></div>
              <div className="plan hot"><h3>Per event</h3><div className="price">₹1,999</div><p>Hackathons, fests and large events. Unlimited registrations.</p></div>
              <div className="plan"><h3>Club, per year</h3><div className="price">₹9,999</div><p>Every event your club runs for a year.</p></div>
            </div>
          </section>

          <section className="cta lsection" id="start">
            <h2>Your next event, set up free.</h2>
            <p>Sign up and create your first event in under a minute. Or message us and we&apos;ll set it up for you.</p>
            <Link className="lbtn" href="/login">Create your account</Link>
            <p style={{ marginTop: 20 }}>Prefer to talk? <a href="mailto:vexloraindia@gmail.com">vexloraindia@gmail.com</a></p>
          </section>

          <footer className="lfooter">Vexlora Events, built for engineering college clubs and E-Cells in India.</footer>
        </div>
      </div>
    </>
  );
}
