import { Loader2 } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function AccountLoading() {
  return (
    <Container className="py-20 flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      <p className="text-xs text-gray-500 mt-2">Loading account...</p>
    </Container>
  );
}
