import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[720px] mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Digital Home
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 28, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold">1. Subscription Terms</h2>
            <p className="text-muted-foreground">Digital Home offers the following plans:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Founding Member:</strong> $9 one-time payment — full lifetime access</li>
              <li><strong>Pro Plan:</strong> $99/year — billed annually</li>
              <li><strong>Student Plan:</strong> $49/year — requires .edu email verification, billed annually</li>
            </ul>
            <p className="text-muted-foreground">All subscriptions are billed annually. No monthly billing option is available.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Refund Policy</h2>
            <p className="text-muted-foreground">[PLACEHOLDER: Define your refund policy. Example: We offer a 14-day money-back guarantee for annual subscriptions. Founding Member payments are non-refundable.]</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use the platform for unlawful purposes</li>
              <li>Attempt to access other users' data</li>
              <li>Reverse engineer or scrape the platform</li>
              <li>Share your account credentials with others</li>
              <li>Upload malicious content or files</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
            <p className="text-muted-foreground">[PLACEHOLDER: Digital Home is provided "as is." We are not liable for any financial decisions made based on data displayed in the platform. We do not provide financial advice.]</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Governing Law</h2>
            <p className="text-muted-foreground">[PLACEHOLDER: These terms are governed by the laws of the State of [YOUR STATE], United States.]</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Changes to Terms</h2>
            <p className="text-muted-foreground">We may update these terms from time to time. We will notify users of material changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Contact</h2>
            <p className="text-muted-foreground">For questions about these terms, contact us at: <strong>[PLACEHOLDER: legal@yourdomain.com]</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
