import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#111]">
      <div className="max-w-[760px] mx-auto px-6 py-16" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Link to="/" className="inline-block font-bold text-sm text-[#6366f1] mb-8">
          Digital Home
        </Link>

        <h1 className="font-bold text-3xl text-[#111827] dark:text-white tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-[#9ca3af] mt-2 mb-10">Last updated: March 27, 2026</p>
        <div className="h-px bg-[#f0f0f0] dark:bg-white/10 mb-10" />

        <div className="space-y-8 text-sm text-[#374151] dark:text-[#d1d5db] leading-[1.8]">
          <p>Your privacy is important to us. This Privacy Policy explains how Digital Home ("we," "us," or "our") collects, uses, stores, and protects your personal information when you use our application and services at digitalhome.lovable.app and any associated domains.</p>
          <p>By using Digital Home, you agree to the collection and use of information in accordance with this policy.</p>

          <Section title="1. Information We Collect">
            <p>We collect the following types of information:</p>

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Account Information</p>
            <List items={[
              "Your name and email address when you create an account",
              "Profile photo if you choose to upload one",
              "Authentication credentials (stored securely via encrypted auth)",
              "Subscription status and billing information (processed by Stripe)",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Financial Information (via Plaid)</p>
            <List items={[
              "Bank account balances and transaction history when you connect your bank account through Plaid",
              "Credit and liability account information",
              "Investment account data",
              "We do not store your bank login credentials. All financial data connections are established through Plaid's secure API and governed by Plaid's Privacy Policy (plaid.com/legal/privacy-policy)",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Social Media Information (via Platform Integrations)</p>
            <List items={[
              "Social media account usernames, follower counts, and engagement metrics when you connect platforms in the Studio tab",
              "Post performance data, comments, and reach statistics",
              "OAuth tokens required to access your accounts (stored encrypted)",
              "We only request the minimum permissions necessary for each platform",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Email Information (via Gmail)</p>
            <List items={[
              "Access to read emails from priority contacts you identify",
              "Ability to send emails on your behalf when you use the email compose feature",
              "We do not read, store, or analyze emails beyond what is necessary to display them in the app",
              "Gmail access is governed by Google's Privacy Policy (policies.google.com/privacy)",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Professional Network Information (via LinkedIn)</p>
            <List items={[
              "Basic profile information and connection data when you authorize LinkedIn access",
              "LinkedIn integration is governed by LinkedIn's Privacy Policy (linkedin.com/legal/privacy-policy)",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Usage Information</p>
            <List items={[
              "Pages visited, features used, and time spent in the app",
              "Device type, browser, and IP address",
              "Error logs and performance data",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Content You Create</p>
            <List items={[
              "Projects, goals, tasks, and notes you create in the app",
              "Contacts and relationship data you add or import",
              "Content plans, brand deals, and revenue data you enter in Studio",
              "Monthly review responses and financial snapshots",
            ]} />
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <List items={[
              "Provide, maintain, and improve the Digital Home application",
              "Display your financial data, social media analytics, and content performance",
              "Generate AI-powered insights and recommendations",
              "Send transactional emails (account confirmation, billing receipts)",
              "Process subscription payments through Stripe",
              "Provide customer support when you contact us",
              "Comply with legal obligations",
            ]} />
            <p className="mt-4">We do NOT:</p>
            <List items={[
              "Sell your personal information to any third party",
              "Share your financial data with advertisers",
              "Use your data to train AI models without your explicit consent",
              "Share your data with other Digital Home users",
            ]} />
          </Section>

          <Section title="3. Third-Party Services">
            <p>Digital Home integrates with the following third-party services. Each has their own privacy policy governing how they handle your data:</p>

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Plaid (Financial Data)</p>
            <List items={[
              "Plaid connects your bank accounts securely",
              "Privacy Policy: plaid.com/legal/privacy-policy",
              "Plaid End User Privacy Policy: plaid.com/legal/end-user-privacy-policy",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Stripe (Payments)</p>
            <List items={[
              "Stripe processes all subscription payments",
              "We never store your credit card information",
              "Privacy Policy: stripe.com/privacy",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Google / Gmail</p>
            <List items={[
              "Used for email integration and OAuth authentication",
              "Privacy Policy: policies.google.com/privacy",
              "We comply with Google API Services User Data Policy",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">LinkedIn</p>
            <List items={[
              "Used for contact import and professional network integration",
              "Privacy Policy: linkedin.com/legal/privacy-policy",
            ]} />
          </Section>

          <Section title="4. Data Storage and Security">
            <List items={[
              "All data is stored in secure cloud infrastructure",
              "Data is encrypted at rest (AES-256) and in transit (TLS 1.2+)",
              "We implement row-level security ensuring each user can only access their own data",
              "OAuth tokens for third-party integrations are stored encrypted",
              "We maintain regular automated backups",
              "We conduct periodic security reviews",
            ]} />
          </Section>

          <Section title="5. Data Retention">
            <List items={[
              "We retain your account data for as long as your account is active",
              "If you delete your account, all personal data is permanently deleted within 30 days",
              "Financial transaction data synced from Plaid is retained for 12 months",
              "Backup copies may persist for up to 90 days after deletion",
            ]} />
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <List items={[
              "Access all data we hold about you (export available in Settings → Account → Export My Data)",
              "Correct inaccurate information in your profile",
              "Delete your account and all associated data (Settings → Account → Delete Account)",
              "Disconnect any third-party integration at any time (Settings → Integrations)",
              "Opt out of non-essential communications",
              "Request a copy of your data in JSON format",
            ]} />
            <p className="mt-4">To exercise any of these rights, contact us at: contact@digitalhome.app</p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>Digital Home is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at contact@digitalhome.app.</p>
          </Section>

          <Section title="8. Financial Data Specific Provisions">
            <p>In connection with our use of Plaid:</p>
            <List items={[
              "You authorize Digital Home to retrieve financial information on your behalf through Plaid",
              "We access your financial data only to provide the services you request within the app",
              "We do not sell, rent, or share your financial data with third parties for marketing purposes",
              "You can revoke Plaid access at any time through Settings → Integrations → Disconnect Bank",
            ]} />
          </Section>

          <Section title="9. Cookies and Tracking">
            <List items={[
              "We use session cookies necessary for authentication",
              "We use analytics cookies to understand how the app is used (you can opt out in Settings)",
              "We do not use advertising cookies or cross-site tracking",
            ]} />
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email and by posting a notice in the app. Your continued use of Digital Home after changes are posted constitutes your acceptance of the updated policy.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have questions about this Privacy Policy or how we handle your data:</p>
            <List items={[
              "Email: contact@digitalhome.app",
              "Website: digitalhome.lovable.app",
              "Response time: within 5 business days",
            ]} />
          </Section>
        </div>

        <LegalFooter />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-base text-[#111827] dark:text-white mt-8 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="pl-4 space-y-1">
      {items.map((item, i) => (
        <li key={i}>— {item}</li>
      ))}
    </ul>
  );
}

function LegalFooter() {
  return (
    <div className="mt-16 pt-6 border-t border-[#f0f0f0] dark:border-white/10 text-center">
      <p className="text-xs text-[#9ca3af]">
        Digital Home · contact@digitalhome.app · digitalhome.lovable.app
      </p>
      <p className="text-xs text-[#9ca3af] mt-2">
        <Link to="/privacy" className="hover:text-[#6366f1] transition-colors">Privacy Policy</Link>
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:text-[#6366f1] transition-colors">Terms of Service</Link>
      </p>
    </div>
  );
}
