import { AuthGate } from "@/components/auth/AuthGate";

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
