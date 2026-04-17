import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  const h2 = { fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 40, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #F3F4F6" } as React.CSSProperties;
  const p = { marginBottom: 14, color: "#374151", lineHeight: 1.8 } as React.CSSProperties;
  const li = { marginBottom: 6, paddingLeft: 4, color: "#374151" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px 80px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 40 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M4 12L16 4L28 12V26C28 27.1 27.1 28 26 28H6C4.9 28 4 27.1 4 26V12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 28V16H20V28" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#6366f1" }}>Digital Home</span>
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 8 }}>Effective Date: April 16, 2026 &middot; Last Updated: April 16, 2026</p>
        <div style={{ height: 1, background: "#F3F4F6", marginBottom: 40 }} />

        <p style={p}>Digital Home (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our application at <strong>mydigitalhome.app</strong>.</p>
        <p style={{ ...p, padding: "14px 18px", background: "#EEF2FF", borderLeft: "4px solid #6366f1", borderRadius: "0 8px 8px 0" }}>This policy meets or exceeds the requirements of GDPR, CCPA, and COPPA.</p>

        <h2 style={h2}>1. Information We Collect</h2>
        <p style={p}><strong>Account Information:</strong> Name, email address, profile photo, and authentication credentials.</p>
        <p style={p}><strong>Financial Data (via Plaid):</strong> Bank balances, transactions, and investment data when you connect your accounts. We never store your bank login credentials.</p>
        <p style={p}><strong>Google/Gmail:</strong> Email and calendar data when you enable these integrations. We comply fully with Google API Services User Data Policy.</p>
        <p style={p}><strong>Usage Data:</strong> Pages visited, features used, device type, IP address, and error logs.</p>
        <p style={p}><strong>Your Content:</strong> Journal entries, projects, contacts, financial plans, and any content you create within the app.</p>

        <h2 style={h2}>2. How We Use Your Information</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          {["Provide, operate, maintain, and improve the Service","Display your data in an organized, useful format","Generate AI-powered insights based on your data","Process payments and send transactional emails","Respond to support requests and feedback","Detect and prevent fraud and security issues","Comply with applicable legal obligations"].map((item, i) => <li key={i} style={li}>{item}</li>)}
        </ul>
        <p style={{ ...p, padding: "14px 18px", background: "#F0FDF4", borderLeft: "4px solid #10B981", borderRadius: "0 8px 8px 0" }}>
          <strong>We do NOT</strong> sell your personal information, share financial data with advertisers, use your content to train AI models without explicit consent, or share your data with other users.
        </p>

        <h2 style={h2}>3. Data Sharing</h2>
        <p style={p}>We share data only with service providers operating under confidentiality agreements: Supabase (infrastructure), Stripe (payments), Plaid (financial data), Google (auth/calendar), and Anthropic (AI features). We never sell or rent your data.</p>

        <h2 style={h2}>4. Data Security</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          {["AES-256 encryption at rest, TLS 1.2+ in transit","Row-level security ensuring only you can access your data","OAuth tokens stored encrypted","Passwords hashed with bcrypt","Automated backups with point-in-time recovery","Breach notification within 72 hours as required by GDPR"].map((item, i) => <li key={i} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>5. Your Rights</h2>
        <p style={p}>You have the right to access, correct, delete, and export your data. California residents have additional CCPA rights. EU/UK users have GDPR rights including data portability and the right to object. Contact <a href="mailto:privacy@mydigitalhome.app" style={{ color: "#6366f1" }}>privacy@mydigitalhome.app</a> to exercise any right.</p>

        <h2 style={h2}>6. Children's Privacy (COPPA)</h2>
        <p style={p}>Digital Home is not directed at children under 13. We do not knowingly collect data from children under 13. Contact us immediately if you believe we have collected such data.</p>

        <h2 style={h2}>7. Cookies</h2>
        <p style={p}>We use essential cookies for authentication, preference cookies for settings, and analytics cookies to understand usage. We do not use advertising or cross-site tracking cookies.</p>

        <h2 style={h2}>8. Changes</h2>
        <p style={p}>We may update this policy with 30 days advance notice via email and in-app notification for material changes.</p>

        <h2 style={h2}>9. Contact</h2>
        <div style={{ background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <p style={{ margin: 0, lineHeight: 2 }}>
            <strong>Digital Home</strong><br />
            Privacy: <a href="mailto:privacy@mydigitalhome.app" style={{ color: "#6366f1" }}>privacy@mydigitalhome.app</a><br />
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
