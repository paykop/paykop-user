import Link from "next/link";
import { ChevronRight, ShieldAlert, FileText, Scale } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | Paykop Hyperlocal Marketplace",
  description: "Official Terms and Conditions governing use of the Paykop platform, buyer orders, service bookings, verified donations, and seller subscriptions.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-900">Terms & Conditions</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Scale className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
            Terms and Conditions
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Last Updated: September 10, 2026 &bull; Effective Immediately
          </p>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            These Terms and Conditions constitute a legally binding agreement between you and Paykop Hyperlocal Marketplace governing your access to and use of our mobile applications, website, APIs, and associated services.
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs space-y-10 text-gray-800 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, registering on, or transacting through the Paykop platform (the &quot;Platform&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions (&quot;Terms&quot;) along with our Privacy Policy and Refund &amp; Cancellation Policy. If you do not agree to these Terms, you must immediately discontinue using the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              2. Eligibility &amp; Account Registration
            </h2>
            <p>
              To create an account or transact on the Platform, you must be at least 18 years of age and legally capable of entering into binding contracts under the Indian Contract Act, 1872. You agree to provide accurate, current, and complete registration information and to keep your credentials secure. You are solely responsible for all activities occurring under your authenticated account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              3. Platform Nature &amp; Intermediary Status
            </h2>
            <p>
              Paykop operates as an online marketplace and technology intermediary under Section 79 of the Information Technology Act, 2000. Paykop connects buyers, local merchants (&quot;Sellers&quot;), professional service providers (&quot;Providers&quot;), field agents, and verified non-profit organizations (&quot;Organizations&quot;). Except where expressly stated otherwise, Paykop does not manufacture, stock, sell, or inspect the products or services listed by third-party sellers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              4. Orders, Delivery &amp; OTP Handover
            </h2>
            <p>
              Hyperlocal product orders are delivered by seller-managed or platform-integrated delivery partners. For all orders, including Cash on Delivery (COD), order handover is verified through a one-time delivery verification PIN/OTP provided to the buyer. Successful OTP verification at handover constitutes conclusive evidence of completed delivery.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              5. Payments &amp; Gateway Processing
            </h2>
            <p>
              All online payments on the Platform are processed through Razorpay, a Reserve Bank of India (RBI) authorized payment aggregator. Paykop does not store sensitive cardholder data or netbanking passwords. All payment transactions comply with PCI-DSS standards and 256-bit SSL encryption.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              6. Service Bookings
            </h2>
            <p>
              When booking professional services (such as repair, plumbing, health, or tutoring), you enter into a direct agreement with the independent Service Provider. Both customers and providers must adhere to confirmed time slots. Repeated unexcused no-shows or late cancellations may lead to account penalties or suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              7. Donations, Section 80G Receipts &amp; statutory Caps
            </h2>
            <p>
              Paykop provides fundraising infrastructure for verified Non-Governmental Organizations (NGOs) and public charitable trusts.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Verification Gate:</strong> Donations can only be accepted by Organizations whose regulatory registration (12A/80G, PAN, bank account) has been verified by platform administrators.
              </li>
              <li>
                <strong>Section 80G(5D) Statutory Cash Cap:</strong> Under Section 80G(5D) of the Income Tax Act, 1961, cash donations exceeding ₹2,000 in a single gift or cumulatively across an Indian Financial Year (April 1 – March 31) are strictly ineligible for tax deduction. Cash donations exceeding this statutory limit are accepted without Section 80G tax benefits.
              </li>
              <li>
                <strong>Disbursement:</strong> Paykop disburses captured donation funds to organizations via batched bank settlements following regulatory reconciliation.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              8. Blood Donation Matching
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Emergency Medical Notice
              </div>
              <p>
                The blood request feature is an informational directory connecting community donors to patient families. Paykop is NOT a blood bank, medical facility, or healthcare provider. All transfusions must occur at licensed blood banks and hospitals under qualified medical supervision.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              9. Prohibited Activities
            </h2>
            <p>Users, sellers, and agents shall not:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
              <li>Upload counterfeit, stolen, hazardous, or illegal goods;</li>
              <li>Submit forged KYC documents, false NGO credentials, or inaccurate tax registrations;</li>
              <li>Engage in payment structuring to circumvent statutory cash reporting thresholds;</li>
              <li>Scrape, reverse-engineer, or tamper with the Platform&apos;s security systems;</li>
              <li>Circumvent on-platform transactions to evade statutory commission or fee obligations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by Indian law, Paykop&apos;s cumulative liability for any claims arising out of or related to use of the Platform shall not exceed the fees paid by you to Paykop in the preceding twelve (12) months or ₹5,000, whichever is greater. Paykop is not liable for consequential, incidental, or punitive damages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              11. Grievance Redressal
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, our Grievance Officer details are published below:
            </p>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
              <p><strong>Officer:</strong> Grievance Redressal Officer, Paykop Technologies</p>
              <p><strong>Email:</strong> grievance@paykop.app</p>
              <p><strong>Response Time:</strong> Acknowledged within 48 hours; resolved within 30 days.</p>
              <p><strong>Jurisdiction:</strong> Visakhapatnam, Andhra Pradesh, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
