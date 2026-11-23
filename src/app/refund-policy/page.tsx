import Link from "next/link";
import { ChevronRight, RotateCcw, ShieldCheck, AlertCircle, Clock, Banknote, CreditCard } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy | Paykop Hyperlocal Marketplace",
  description: "Official cancellation, return, and refund rules for product orders, service bookings, verified charitable donations, and seller subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-900">Refund &amp; Cancellation Policy</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <RotateCcw className="w-4 h-4" />
            <span>Customer Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Last Updated: September 10, 2026 &bull; Compliant with Consumer Protection (E-Commerce) Rules, 2020
          </p>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            This Policy outlines the terms and conditions governing order cancellations, product returns, refund timelines, service booking modifications, and donation disputes across the Paykop marketplace.
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-xs space-y-10 text-gray-800 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              1. Overview
            </h2>
            <p>
              Because product deliveries, professional service bookings, charitable donations, and merchant subscriptions involve distinct legal and logistical considerations, they are subject to separate operational rules as set out below. Where a specific Seller provides more generous return terms, those terms shall apply in addition to this Policy.
            </p>
          </section>

          {/* Section 2: Products */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              2. Product Orders
            </h2>
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">2.1 Cancellation Before Dispatch</h3>
              <p>
                An Order may be cancelled free of charge at any time before the Seller marks the parcel as dispatched, directly from your &quot;My Orders&quot; screen. Once an order is out for delivery, it cannot be cancelled mid-transit and must follow the standard return process.
              </p>

              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">2.2 Returns Window</h3>
              <p>
                Unless an item falls under non-returnable categories, buyers may request a return within <strong>7 calendar days</strong> of delivery, provided the item is unused, in original packaging with intact tags.
              </p>

              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">2.3 Refund Timeline &amp; Method</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-gray-200 rounded-xl">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                      <th className="py-2.5 px-4">Payment Method at Order</th>
                      <th className="py-2.5 px-4">Refund Method</th>
                      <th className="py-2.5 px-4">Typical Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Online (UPI / Card / Netbanking via Razorpay)</td>
                      <td className="py-2.5 px-4">Refunded to original payment source</td>
                      <td className="py-2.5 px-4">5–7 business days from return approval</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Cash on Delivery (COD)</td>
                      <td className="py-2.5 px-4">Bank transfer or UPI to verified buyer account</td>
                      <td className="py-2.5 px-4">7–10 business days from return approval</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">2.4 Non-Returnable Categories</h3>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                <li>Perishable food items, fresh produce, and bakery goods;</li>
                <li>Opened personal hygiene, wellness, or cosmetic items;</li>
                <li>Customized or made-to-order goods;</li>
                <li>Items explicitly designated as non-returnable at checkout.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Services */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              3. Service Bookings
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs border border-gray-200 rounded-xl">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                    <th className="py-2.5 px-4">Initiated By</th>
                    <th className="py-2.5 px-4">Cancellation Timing</th>
                    <th className="py-2.5 px-4">Refund Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold">Customer</td>
                    <td className="py-2.5 px-4">&gt; 24 hours prior to appointment</td>
                    <td className="py-2.5 px-4 text-emerald-700 font-bold">100% Full Refund</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold">Customer</td>
                    <td className="py-2.5 px-4">Within 24 hours of appointment</td>
                    <td className="py-2.5 px-4 text-amber-700 font-bold">50% Cancellation Fee; 50% Refund</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold">Customer</td>
                    <td className="py-2.5 px-4">No-Show / Failure to attend</td>
                    <td className="py-2.5 px-4 text-red-700 font-bold">No Refund</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold">Service Provider</td>
                    <td className="py-2.5 px-4">Any time before slot or Provider No-Show</td>
                    <td className="py-2.5 px-4 text-emerald-700 font-bold">100% Full Refund to Customer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Donations */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              4. Charitable Donations &amp; Tax Deductions
            </h2>
            <div className="space-y-3">
              <p>
                <strong>General Rule:</strong> Donations made to verified Organizations or active emergency relief campaigns are final and non-refundable once captured. By contributing, donors confirm that gifts are voluntary without expectation of commercial consideration.
              </p>
              <p>
                <strong>Exceptional Circumstances:</strong> Refunds may be granted if requested within <strong>7 days</strong> under conditions of duplicate payment errors, technical charge discrepancies, or confirmed unauthorized transactions, provided funds have not yet been disbursed to the receiving NGO.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-gray-900">
                  <ShieldCheck className="w-4 h-4 text-pink-600" />
                  Tax Receipt Voidance Notice
                </div>
                <p className="text-gray-600">
                  If a donation for which a Section 80G tax receipt was generated is refunded, the receipt is rendered null and void. Paykop will file an amended return with the Income Tax Department.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Subscriptions */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              5. Seller &amp; Agent Subscriptions
            </h2>
            <p>
              Sellers on paid monthly or yearly commercial plans may cancel within <strong>3 days</strong> of initial purchase for a full refund, provided no commercial sales have occurred. Cancellations after 3 days remain active until the end of the billing period without proration.
            </p>
          </section>

          {/* Section 6: How to Request */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              6. Raising a Refund Request
            </h2>
            <p>
              To initiate a cancellation or refund, navigate to your Order or Booking details and click &quot;Request Refund&quot;, or submit a support ticket via our customer helpdesk. For unresolved grievances, contact our Grievance Officer at <strong>grievance@paykop.app</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
