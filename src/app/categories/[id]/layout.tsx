import type { Metadata } from "next";
import { fetchPublicApi } from "@/lib/api/server";
import { ProductCategory } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const category = await fetchPublicApi<ProductCategory>(`/categories/${id}`);
  if (!category) {
    return { title: "Category | Paykop" };
  }
  return {
    title: `${category.name} | Paykop`,
    description: `Browse ${category.name} products from local sellers on Paykop`,
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
