import type { Metadata } from "next";
import { fetchPublicApi } from "@/lib/api/server";
import { Product } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchPublicApi<Product>(`/products/${id}`);
  if (!product) {
    return { title: "Product | Paykop" };
  }
  return {
    title: `${product.title} | Paykop`,
    description: product.description?.slice(0, 160) || `Shop ${product.title} on Paykop`,
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
