import { TourDefinition, TourId } from "./types";

export const DEFAULT_TOUR_CONFIG = {
  animate: true,
  overlayColor: "#0f172a",
  overlayOpacity: 0.75,
  stagePadding: 8,
  stageRadius: 12,
  allowClose: true,
  showProgress: true,
  nextBtnText: "Next →",
  prevBtnText: "← Back",
  doneBtnText: "Got it!",
  popoverClass: "paykop-tour-popover",
};

export const TOURS_REGISTRY: Record<TourId, TourDefinition> = {
  buyer_home: {
    id: "buyer_home",
    title: "Welcome to Paykop",
    config: DEFAULT_TOUR_CONFIG,
    steps: [
      {
        element: '[data-tour="location-selector"]',
        popover: {
          title: "Select Your Neighborhood",
          description:
            "Set your city or precise location to browse products and local services available for instant 2-hour delivery.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="search-input"]',
        popover: {
          title: "Hyperlocal Search",
          description:
            "Search across neighborhood products, local service pros, emergency blood requests, and charity campaigns.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: '[data-tour="categories-shelf"]',
        popover: {
          title: "Shop by Department",
          description:
            "Discover verified local merchants sorted by category with real-time stock and transparent prices.",
          side: "top",
          align: "start",
        },
      },
      {
        element: '[data-tour="cart-button"]',
        popover: {
          title: "Direct Merchant Checkout",
          description:
            "Items in your cart are fulfilled directly by verified local shops with secure Razorpay payment or cash on delivery.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },

  seller_hub: {
    id: "seller_hub",
    title: "Seller Hub Walkthrough",
    config: DEFAULT_TOUR_CONFIG,
    steps: [
      {
        element: '[data-tour="seller-kyc-badge"]',
        popover: {
          title: "Seller KYC Verification",
          description:
            "Self-serve sellers must be verified before listing products or services. Submit documents via the KYC portal to get verified.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="seller-quick-actions"]',
        popover: {
          title: "Merchant Management",
          description:
            "Manage your catalog, schedule service appointments, track buyer orders, and verify COD handovers with buyer OTPs.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="seller-plans"]',
        popover: {
          title: "Subscription Plans",
          description:
            "Choose a commercial subscription tier to activate product listings, lower transaction fees, and unlock priority placement.",
          side: "top",
          align: "center",
        },
      },
    ],
  },

  agent_hub: {
    id: "agent_hub",
    title: "Field Agent Onboarding Tour",
    config: DEFAULT_TOUR_CONFIG,
    steps: [
      {
        element: '[data-tour="agent-stats"]',
        popover: {
          title: "Onboarding Progress",
          description:
            "Track how many neighborhood sellers you have registered, subscribed, and guided to 'Ready' status.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="agent-create-seller"]',
        popover: {
          title: "Create Seller Account",
          description:
            "Register a new merchant and guide them through subscription, auto-verified KYC, and shop GPS location setup.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="agent-sellers-list"]',
        popover: {
          title: "Managed Sellers Directory",
          description:
            "View and manage each seller's profile, subscription payments, location, and published listings in the field.",
          side: "top",
          align: "start",
        },
      },
    ],
  },
};
