import Link from "next/link";
import { ShieldCheck, Truck, Headphones, RotateCcw } from "lucide-react";

const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

export function Footer() {
  return (
    <footer className="bg-[var(--primary-dark)] text-white pt-16 pb-12 border-t border-[var(--primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[var(--accent-green)]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Hyperlocal Delivery</h4>
              <p className="text-xs text-white/60">Under 2 hours in your city</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[var(--accent-green)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Secure Payments</h4>
              <p className="text-xs text-white/60">Razorpay encrypted checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[var(--accent-green)]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Buyer support</h4>
              <p className="text-xs text-white/60">Help with orders and bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[var(--accent-green)]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">OTP handover</h4>
              <p className="text-xs text-white/60">Verified delivery codes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-white font-black text-lg">
                P
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Paykop<span className="text-[var(--accent-green)]">.</span>
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              Neighborhood shops, service pros, blood donors, and community campaigns — one hyperlocal marketplace.
            </p>
            <div className="text-xs text-white/50 space-y-1">
              <p>support@paykop.app{supportPhone ? ` | ${supportPhone}` : ""}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent-green)]">
              Shop
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
              <li><Link href="/services" className="hover:text-white">Services</Link></li>
              <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
              <li><Link href="/account/orders" className="hover:text-white">Orders</Link></li>
              <li><Link href="/account/support" className="hover:text-white">Support</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent-green)]">
              Community
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/donations" className="hover:text-white">Donations</Link></li>
              <li><Link href="/blood" className="hover:text-white">Blood requests</Link></li>
              <li><Link href="/chat" className="hover:text-white">Chat</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--accent-green)]">
              Sellers
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/seller" className="hover:text-white">Sell on Paykop</Link></li>
              <li><Link href="/seller/products" className="hover:text-white">Seller products</Link></li>
              <li><Link href="/seller/kyc" className="hover:text-white">Seller KYC</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/10 text-xs text-white/50">
        <p>© {new Date().getFullYear()} Paykop Marketplace. All rights reserved.</p>
      </div>
    </footer>
  );
}
