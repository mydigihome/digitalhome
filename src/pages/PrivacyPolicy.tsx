import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Digital Home
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 28, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground">Digital Home collects the following types of data to provide our services:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Account information:</strong> Name, email address, profile photo</li>
              <li><strong>Financial data:</strong> Income, expenses, investments, net worth, credit score (entered manually or via Plaid)</li>
              <li><strong>Contacts:</strong> Names, emails, relationship notes imported from Gmail or LinkedIn or added manually</li>
              <li><strong>Projects & tasks:</strong> Goals, stages, task descriptions, deadlines</li>
              <li><strong>Usage data:</strong> Feature usage, page visits, session duration</li>
              <li><strong>Journal entries:</strong> Personal journal content (encrypted at rest)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. How We Store Your Data</h2>
            <p className="text-muted-foreground">All data is stored securely using Supabase (PostgreSQL) with the following protections:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>AES-256 encryption at rest</li>
              <li>TLS 1.3 encryption in transit</li>
              <li>Row-Level Security (RLS) ensuring users can only access their own data</li>
              <li>Regular automated backups</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Third-Party Services</h2>
            <p className="text-muted-foreground">We integrate with the following services:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Plaid:</strong> Bank account linking for financial data (read-only)</li>
              <li><strong>Stripe:</strong> Payment processing for subscriptions</li>
              <li><strong>Google/Gmail:</strong> Email import and calendar sync (with your explicit consent)</li>
              <li><strong>LinkedIn:</strong> Contact import (with your explicit consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Access:</strong> Export all your data at any time from Settings → Account</li>
              <li><strong>Deletion:</strong> Permanently delete your account and all associated data from Settings → Account</li>
              <li><strong>Correction:</strong> Update any personal information through the Settings page</li>
              <li><strong>Portability:</strong> Download your data in JSON format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <p className="text-muted-foreground">We retain your data for as long as your account is active. Upon account deletion, all data is permanently removed within 30 days. Backups are purged within 90 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Contact</h2>
            <p className="text-muted-foreground">For privacy-related requests, contact us at: <strong>[PLACEHOLDER: privacy@yourdomain.com]</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
