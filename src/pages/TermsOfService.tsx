import { Link } from "react-router-dom";

export default function TermsOfService() {
  const h2 = { fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 40, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #F3F4F6" } as React.CSSProperties;
  const p = { marginBottom: 14, color: "#374151", lineHeight: 1.8 } as React.CSSProperties;
  const li = { marginBottom: 6, paddingLeft: 4, color: "#374151" } as React.CSSProperties;
  const caps = { ...p, fontWeight: 700, color: "#111827", fontSize: 13, letterSpacing: "0.3px" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px 80px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 40 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M4 12L16 4L28 12V26C28 27.1 27.1 28 26 28H6C4.9 28 4 27.1 4 26V12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 28V16H20V28" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#6366f1" }}>Digital Home</span>
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 8 }}>Effective Date: April 16, 2026 &middot; Last Updated: April 16, 2026</p>
        <div style={{ height: 1, background: "#F3F4F6", marginBottom: 40 }} />

        <p style={p}>These Terms constitute a legally binding agreement between you and Digital Home governing your use of <strong>mydigitalhome.app</strong>.</p>
        <p style={{ ...p, padding: "14px 18px", background: "#FEF2F2", borderLeft: "4px solid #EF4444", borderRadius: "0 8px 8px 0" }}><strong>PLEASE READ CAREFULLY.</strong> By using the Service, you agree to these Terms.</p>

        <h2 style={h2}>1. Eligibility</h2>
        <p style={p}>You must be at least 18 years old. By using the Service, you represent that you meet this requirement and that all information you provide is accurate.</p>

        <h2 style={h2}>2. Subscription and Billing</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          {["Free Plan: limited access to core features","Standard Plan: $12/month or $99/year — full access","Founding Member: $9/month (first 50 users) — price locked forever","Student Plan: 50% discount with verified .edu email","Studio Add-on: $29.99 one-time","All payments processed by Stripe. We never store raw card data."].map((item, i) => <li key={i} style={li}>{item}</li>)}
        </ul>
        <p style={p}><strong>Refunds:</strong> Monthly plans refundable within 7 days. Annual plans within 14 days. Founding Member and Studio Add-on non-refundable after 7 days.</p>

        <h2 style={h2}>3. Acceptable Use</h2>
        <p style={p}>You agree not to use the Service for any illegal purpose, attempt unauthorized access, reverse engineer the software, use automated scraping, impersonate others, upload malware, or violate any third-party terms.</p>

        <h2 style={h2}>4. Financial Disclaimer</h2>
        <p style={{ ...p, padding: "14px 18px", background: "#FFFBEB", borderLeft: "4px solid #F59E0B", borderRadius: "0 8px 8px 0" }}>
          <strong>IMPORTANT:</strong> Digital Home is a personal organization tool, NOT a licensed financial advisor. Nothing in the Service constitutes financial, investment, tax, or legal advice. Consult qualified professionals before making financial decisions.
        </p>

        <h2 style={h2}>5. Your Content</h2>
        <p style={p}>You retain ownership of all content you create. You grant Digital Home a limited license to store and display your content solely to provide the Service. We may remove content that violates these Terms.</p>

        <h2 style={h2}>6. Intellectual Property</h2>
        <p style={p}>Digital Home and its content are protected by copyright and trademark law. You may not copy, modify, or distribute any part of the Service without written permission.</p>

        <h2 style={h2}>7. Disclaimers</h2>
        <p style={{ ...caps, textTransform: "uppercase" as const }}>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT UNINTERRUPTED, ERROR-FREE, OR COMPLETELY ACCURATE SERVICE.</p>

        <h2 style={h2}>8. Limitation of Liability</h2>
        <p style={{ ...caps, textTransform: "uppercase" as const }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF AMOUNTS YOU PAID IN THE PRIOR 12 MONTHS OR $100. WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.</p>

        <h2 style={h2}>9. Dispute Resolution</h2>
        <p style={p}>Disputes will be resolved through binding arbitration under AAA Consumer Arbitration Rules. Class action waiver applies. You may opt out within 30 days of first accepting these Terms by emailing <a href="mailto:legal@mydigitalhome.app" style={{ color: "#6366f1" }}>legal@mydigitalhome.app</a>.</p>

        <h2 style={h2}>10. Governing Law</h2>
        <p style={p}>These Terms are governed by the laws of Colorado, United States.</p>

        <h2 style={h2}>11. Contact</h2>
        <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <p style={{ margin: 0, lineHeight: 2 }}>
            <strong>Digital Home</strong><br />
            Legal: <a href="mailto:legal@mydigitalhome.app" style={{ color: "#6366f1" }}>legal@mydigitalhome.app</a><br />
            Billing: <a href="mailto:billing@mydigitalhome.app" style={{ color: "#6366f1" }}>billing@mydigitalhome.app</a><br />
            Support: <a href="mailto:support@mydigitalhome.app" style={{ color: "#6366f1" }}>support@mydigitalhome.app</a>
          </p>
        </div>

        <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 24, marginTop: 40, textAlign: "center" as const }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            &copy; {new Date().getFullYear()} Digital Home &nbsp;&middot;&nbsp;
            <Link to="/privacy" style={{ color: "#9CA3AF", textDecoration: "none" }}>Privacy</Link> &nbsp;&middot;&nbsp;
            <Link to="/terms" style={{ color: "#9CA3AF", textDecoration: "none" }}>Terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
