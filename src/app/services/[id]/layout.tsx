import type { Metadata } from "next";
import { fetchPublicApi } from "@/lib/api/server";
import { ServiceItem } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = await fetchPublicApi<ServiceItem>(`/services/${id}`);
  if (!service) {
    return { title: "Service | Paykop" };
  }
  return {
    title: `${service.title} | Paykop`,
    description: service.description?.slice(0, 160) || `Book ${service.title} on Paykop`,
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
