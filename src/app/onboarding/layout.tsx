import { AuthGate } from "@/components/auth/AuthGate";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
