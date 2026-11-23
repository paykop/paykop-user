import { AuthGate } from "@/components/auth/AuthGate";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
