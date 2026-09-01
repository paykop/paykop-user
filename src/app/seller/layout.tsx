import { SellerGate } from "@/components/seller/SellerGate";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerGate>{children}</SellerGate>;
}
