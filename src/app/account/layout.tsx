import { AuthGate } from "@/components/auth/AuthGate";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
