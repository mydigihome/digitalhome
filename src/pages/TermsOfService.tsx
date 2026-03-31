import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#111]">
      <div className="max-w-[760px] mx-auto px-6 py-16" style={{ fontFamily: 'Inter, sans-serif' }}>
        <Link to="/" className="inline-block font-bold text-sm text-[#6366f1] mb-8">
          Digital Home
        </Link>

        <h1 className="font-bold text-3xl text-[#111827] dark:text-white tracking-tight">Terms of Service</h1>
        <p className="text-sm text-[#9ca3af] mt-2 mb-10">Last updated: March 27, 2026</p>
        <div className="h-px bg-[#f0f0f0] dark:bg-white/10 mb-10" />

        <div className="space-y-8 text-sm text-[#374151] dark:text-[#d1d5db] leading-[1.8]">
          <p>Please read these Terms of Service carefully before using Digital Home. By accessing or using our service, you agree to be bound by these terms.</p>

          <Section title="1. Acceptance of Terms">
            <p>By creating an account or using Digital Home ("the Service"), you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service. We reserve the right to update these terms at any time with notice provided via email or in-app notification.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>Digital Home is a personal financial management, relationship tracking, project management, and content creator platform that helps users organize their money, network, goals, and content creation business. The Service includes integrations with third-party providers including Plaid (financial data), Stripe (payments), Google/Gmail, and LinkedIn.</p>
          </Section>

          <Section title="3. Account Registration">
            <List items={[
              "You must be at least 18 years old to create an account",
              "You must provide accurate and complete information during registration",
              "You are responsible for maintaining the confidentiality of your account credentials",
              "You are responsible for all activity that occurs under your account",
              "You must notify us immediately of any unauthorized use at contact@digitalhome.app",
              "One person may not maintain more than one account",
            ]} />
          </Section>

          <Section title="4. Subscription and Billing">
            <p className="font-semibold text-[#111827] dark:text-white mt-4">Plans and Pricing</p>
            <List items={[
              "Free Plan: limited access to basic features",
              "Pro Plan: $99.00 per year, billed annually",
              "Student Plan: $49.00 per year, billed annually (requires verification)",
              "Founding Member: $9.00 one-time payment, full access",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Billing</p>
            <List items={[
              "All payments are processed securely by Stripe",
              "Annual subscriptions renew automatically on the anniversary of your purchase date",
              "You will receive a reminder email 7 days before renewal",
              "We do not store your payment card information",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Founding Member Terms</p>
            <List items={[
              "Founding Member access ($9.00 one-time) grants full premium access",
              "This is a limited offer available to the first 50 users",
              "Founding Members will receive advance notice of any lifetime upgrade offers",
              "The $9.00 payment is non-refundable after 7 days",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Refund Policy</p>
            <List items={[
              "Annual subscriptions may be cancelled within 14 days of purchase for a full refund",
              "After 14 days, subscriptions are non-refundable but remain active until the end of the billing period",
              "To request a refund, contact contact@digitalhome.app with your account email and reason",
              "Founding Member payments are non-refundable after 7 days",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Cancellation</p>
            <List items={[
              "You may cancel your subscription at any time from Settings → Billing",
              "Access continues until the end of your current billing period",
              "Cancellation does not delete your account or data",
            ]} />

            <p className="font-semibold text-[#111827] dark:text-white mt-4">Student Plan Verification</p>
            <List items={[
              "Student plans require verification of current student status",
              "You must provide a valid .edu email address or current enrollment documentation",
              "False verification will result in immediate account suspension without refund",
            ]} />
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <List items={[
              "Use the Service for any unlawful purpose or in violation of any regulations",
              "Attempt to gain unauthorized access to any part of the Service",
              "Reverse engineer, decompile, or disassemble any part of the Service",
              "Use automated scripts to access the Service without our written consent",
              "Share your account credentials with others",
              "Upload malicious code, viruses, or harmful content",
              "Use the Service to harass, abuse, or harm others",
              "Violate the terms of any third-party service connected to Digital Home (Plaid, Google, LinkedIn, Stripe)",
              "Misrepresent your identity or affiliation",
            ]} />
          </Section>

          <Section title="6. Financial Data and Plaid Integration">
            <List items={[
              "Digital Home uses Plaid to connect to your financial accounts",
              "By connecting your bank account, you authorize Digital Home and Plaid to access your financial data",
              "Digital Home displays financial information for personal management purposes only",
              "Digital Home is NOT a licensed financial advisor and nothing in the Service constitutes financial advice",
              "You should consult a qualified financial professional before making financial decisions",
              "Digital Home is not responsible for any financial decisions you make based on information displayed in the app",
              "You can revoke financial data access at any time",
            ]} />
          </Section>

          <Section title="7. Third-Party Integrations">
            <p>The Service integrates with third-party platforms including Google, LinkedIn, Plaid, and Stripe. By connecting these services:</p>
            <List items={[
              "You agree to their respective terms of service and privacy policies",
              "Digital Home is not responsible for the availability, accuracy, or actions of third-party services",
              "Disruption of third-party services may affect certain features of Digital Home",
              "You are responsible for complying with third-party terms when using integrations",
            ]} />
          </Section>

          <Section title="8. Intellectual Property">
            <List items={[
              "Digital Home and its original content, features, and functionality are owned by Digital Home and protected by copyright law",
              "You retain ownership of all content you create within the app (projects, notes, content plans, etc.)",
              "By using the Service, you grant Digital Home a limited license to store and display your content solely for the purpose of providing the Service",
              "You may not copy, modify, or distribute any part of Digital Home without written permission",
            ]} />
          </Section>

          <Section title="9. Privacy and Data">
            <p>Your use of the Service is also governed by our <Link to="/privacy" className="text-[#6366f1] hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
          </Section>

          <Section title="10. Disclaimers">
            <p className="uppercase font-semibold text-[#111827] dark:text-white">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. DIGITAL HOME DOES NOT WARRANT THAT:</p>
            <List items={[
              "The Service will be uninterrupted or error-free",
              "Financial data displayed will be completely accurate or current",
              "The Service will meet your specific requirements",
            ]} />
            <p className="mt-4">Digital Home is a productivity and organization tool. It is NOT:</p>
            <List items={[
              "A licensed financial advisor or investment advisor",
              "A licensed therapist or mental health provider",
              "A legal services provider",
              "A banking institution",
            ]} />
          </Section>

          <Section title="11. Limitation of Liability">
            <p className="uppercase font-semibold text-[#111827] dark:text-white">TO THE MAXIMUM EXTENT PERMITTED BY LAW, DIGITAL HOME SHALL NOT BE LIABLE FOR:</p>
            <List items={[
              "Any indirect, incidental, special, or consequential damages",
              "Loss of profits, data, or business opportunities",
              "Damages arising from your use of third-party integrations",
              "Financial losses resulting from decisions made using information displayed in the app",
            ]} />
            <p className="mt-4 uppercase font-semibold text-[#111827] dark:text-white">OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
          </Section>

          <Section title="12. Indemnification">
            <p>You agree to indemnify and hold harmless Digital Home and its operators from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or violation of any third-party rights.</p>
          </Section>

          <Section title="13. Termination">
            <List items={[
              "We reserve the right to suspend or terminate your account for violation of these Terms",
              "We will provide notice before termination except in cases of serious violations",
              "Upon termination, your right to use the Service ceases immediately",
              "You may request export of your data before termination",
            ]} />
          </Section>

          <Section title="14. Governing Law">
            <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules, except where prohibited by law.</p>
          </Section>

          <Section title="15. Changes to Terms">
            <p>We may update these Terms at any time. Significant changes will be communicated via email at least 14 days before taking effect. Continued use of the Service after changes constitutes acceptance.</p>
          </Section>

          <Section title="16. Contact">
            <p>For questions about these Terms:</p>
            <List items={[
              "Email: contact@digitalhome.app",
              "Website: digitalhome.lovable.app",
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
