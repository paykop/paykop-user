import { AuthGate } from "@/components/auth/AuthGate";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
