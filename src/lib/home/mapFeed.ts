import {
  Banner,
  BloodRequest,
  DonationCampaign,
  HomeFeedResponse,
} from "@/types";

export interface MappedHomeFeed {
  banners: Banner[];
  locationMessage?: string;
  productCategories: {
    id: number;
    title: string;
    subtitle?: string;
    image: string | null;
  }[];
  serviceCategories: {
    id: number;
    title: string;
    subtitle?: string;
    icon?: string;
    iconColor?: string;
    bgColor?: string;
    imageUrl?: string;
  }[];
  nearbyServices: {
    id: number;
    title: string;
    subtitle?: string;
    image: string | null;
    rating: number;
    reviewCount: number;
    price: number;
  }[];
  donations: DonationCampaign[];
  bloodRequests: BloodRequest[];
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function mapHomeFeed(raw: HomeFeedResponse | null | undefined): MappedHomeFeed {
  const feed = raw || ({} as HomeFeedResponse);

  return {
    banners: asArray(feed.banners),
    locationMessage: feed.location_message,
    productCategories: asArray(feed.product_categories).map((cat) => ({
      id: cat.id,
      title: cat.title || cat.name || "Category",
      subtitle: cat.subtitle,
      image: cat.image || cat.image_url || null,
    })),
    serviceCategories: asArray(feed.services).map((svc) => ({
      id: svc.id,
      title: svc.title,
      subtitle: svc.subtitle,
      icon: svc.icon,
      iconColor: svc.iconColor || svc.icon_color,
      bgColor: svc.bgColor || svc.bg_color,
      imageUrl: svc.image_url,
    })),
    nearbyServices: asArray(feed.nearby_services).map((svc) => ({
      id: svc.id,
      title: svc.title,
      subtitle: svc.subtitle,
      image: svc.image || null,
      rating: svc.rating,
      reviewCount: svc.review_count,
      price: svc.price,
    })),
    donations: asArray(feed.active_donations).map((d) => ({
      ...d,
      image_url: d.image_url || d.image,
      urgent: d.urgent || d.is_urgent,
    })),
    bloodRequests: asArray(feed.active_blood_requests),
  };
}
