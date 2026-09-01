import type { Metadata } from "next";
import { fetchPublicApi } from "@/lib/api/server";
import { DonationCampaign } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const campaign = await fetchPublicApi<DonationCampaign>(`/donations/campaigns/${id}`);
  if (!campaign) {
    return { title: "Donation | Paykop" };
  }
  return {
    title: `${campaign.title} | Paykop Donations`,
    description: campaign.description?.slice(0, 160) || `Support ${campaign.title} on Paykop`,
  };
}

export default function DonationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
