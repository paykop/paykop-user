import { apiClient } from "./client";
import {
  User,
  TokenPair,
  RequestOTPResponse,
  HomeFeedResponse,
  ProductCategory,
  Product,
  ServiceItem,
  ServiceCategory,
  DonationCampaign,
  BloodRequest,
  Address,
  CartResponse,
  WishlistItem,
  Order,
  PaymentIntentResponse,
  Booking,
  SubscriptionPlan,
  SellerSubscription,
  Conversation,
  ChatMessage,
  ReverseGeocodeResult,
  PlacePrediction,
  Banner,
  UserPermissions,
  AgentSellerSummary,
  AgentCreateSellerRequest,
  AgentUpdateSellerProfileRequest,
  AgentGrantTrialResponse,
  AgentBusinessLocationRequest,
  AgentBusinessLocationResponse,
  AgentCreateProductRequest,
  AgentCreateServiceRequest,
} from "@/types";

export const api = {
  // ── Auth & Profile ────────────────────────────────────────────────────────
  auth: {
    requestOTP: (phone: string, pushToken?: string) =>
      apiClient<RequestOTPResponse>("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone, push_token: pushToken }),
        skipAuth: true,
      }),

    verifyOTP: (phone: string, otp: string) =>
      apiClient<TokenPair>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
        skipAuth: true,
      }),

    refreshToken: (refreshToken: string) =>
      apiClient<TokenPair>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
        skipAuth: true,
      }),

    getMe: () => apiClient<User>("/auth/me"),

    requestAgentEmailOTP: (email: string) =>
      apiClient<RequestOTPResponse>("/auth/agent/email-otp/request", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      }),

    verifyAgentEmailOTP: (email: string, otp: string) =>
      apiClient<TokenPair>("/auth/agent/email-otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
        skipAuth: true,
      }),

    logout: (refreshToken: string) =>
      apiClient<{ message: string }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
  },

  // ── Users & Onboarding ───────────────────────────────────────────────────
  users: {
    onboarding: (data: {
      first_name: string;
      last_name: string;
      phone: string;
      address: string;
      bio?: string;
      profile_picture_url?: string;
    }) =>
      apiClient<User>("/users/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateProfile: (data: {
      first_name: string;
      last_name: string;
      phone?: string;
      address?: string;
    }) =>
      apiClient<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    getPermissions: () => apiClient<UserPermissions>("/users/me/permissions"),

    updateCurrentLocation: (userId: string, data: {
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
      city?: string;
      address?: string;
      formatted_address?: string;
    }) =>
      apiClient<{ message: string }>(`/users/${userId}/current-location`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // ── Location ─────────────────────────────────────────────────────────────
  location: {
    reverseGeocode: (lat: number, lng: number) =>
      apiClient<ReverseGeocodeResult>("/location/reverse-geocode", {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
        skipAuth: true,
      }),

    search: (query: string) =>
      apiClient<{ predictions: PlacePrediction[] }>("/location/search", {
        params: { query },
        skipAuth: true,
      }),

    placeDetails: (placeId: string) =>
      apiClient<ReverseGeocodeResult>("/location/place-details", {
        params: { place_id: placeId },
        skipAuth: true,
      }),
  },

  // ── Home & Categories ────────────────────────────────────────────────────
  home: {
    getFeed: (params?: {
      latitude?: number;
      longitude?: number;
      lat?: number;
      lng?: number;
      radius?: number;
      category_id?: number;
      city_id?: number;
    }) =>
      apiClient<HomeFeedResponse>("/home", {
        params: {
          latitude: params?.latitude ?? params?.lat,
          longitude: params?.longitude ?? params?.lng,
          radius: params?.radius || 15,
          category_id: params?.category_id,
          city_id: params?.city_id,
        },
        skipAuth: true,
      }),
  },

  categories: {
    getAll: () => apiClient<ProductCategory[]>("/categories", { skipAuth: true }),
    getById: (id: number | string) =>
      apiClient<ProductCategory & { products?: Product[] }>(`/categories/${id}`, { skipAuth: true }),
  },

  banners: {
    getAll: () => apiClient<Banner[]>("/banners", { skipAuth: true }),
  },

  // ── Products & Search ────────────────────────────────────────────────────
  products: {
    list: (params?: {
      page?: number;
      limit?: number;
      category?: string;
      category_id?: number;
      lat?: number;
      lng?: number;
      radius?: number;
      search?: string;
    }) =>
      apiClient<{
        products: Product[];
        total: number;
        page: number;
        location_serviceable: boolean;
        message?: string;
      }>("/products", {
        params,
        skipAuth: true,
      }),

    getById: (id: number | string) =>
      apiClient<Product>(`/products/${id}`, { skipAuth: true }),
  },

  search: {
    query: (q: string) =>
      apiClient<{ products: Product[]; services: ServiceItem[] }>("/search", {
        params: { q },
        skipAuth: true,
      }),

    suggestions: (q: string) =>
      apiClient<{ suggestions: string[] }>("/search/suggestions", {
        params: { q },
        skipAuth: true,
      }),
  },

  // ── Addresses ────────────────────────────────────────────────────────────
  addresses: {
    list: () => apiClient<Address[]>("/addresses"),
    create: (data: Omit<Address, "id">) =>
      apiClient<Address>("/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Address>) =>
      apiClient<Address>(`/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiClient<{ message: string }>(`/addresses/${id}`, {
        method: "DELETE",
      }),
    setDefault: (id: string) =>
      apiClient<{ message: string }>(`/addresses/${id}/set-default`, {
        method: "PATCH",
      }),
  },

  // ── Cart & Wishlist ──────────────────────────────────────────────────────
  cart: {
    get: () => apiClient<CartResponse>("/cart"),
    add: (productId: number, quantity = 1) =>
      apiClient<CartResponse>("/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      }),
    updateQuantity: (itemId: number, quantity: number) =>
      apiClient<CartResponse>(`/cart/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      }),
    remove: (itemId: number) =>
      apiClient<CartResponse>(`/cart/${itemId}`, {
        method: "DELETE",
      }),
  },

  wishlist: {
    list: () => apiClient<WishlistItem[]>("/wishlist"),
    add: (productId: number) =>
      apiClient<{ message: string }>("/wishlist", {
        method: "POST",
        body: JSON.stringify({ product_id: productId }),
      }),
    remove: (productId: number) =>
      apiClient<{ message: string }>(`/wishlist/${productId}`, {
        method: "DELETE",
      }),
  },

  // ── Orders & Payments ────────────────────────────────────────────────────
  orders: {
    create: (data: {
      product_id: number;
      quantity: number;
      payment_method?: "online" | "cash" | string;
      address_id?: string;
    }) =>
      apiClient<Order>("/buyer/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    listBuyer: () => apiClient<Order[]>("/buyer/orders"),
    getById: (id: number | string) => apiClient<Order>(`/buyer/orders/${id}`),
    cancel: (id: number | string) =>
      apiClient<{ message: string }>(`/buyer/orders/${id}/cancel`, {
        method: "POST",
      }),
  },

  payments: {
    createIntent: (data: {
      order_id?: number;
      booking_id?: number;
      campaign_id?: number;
      subscription_id?: number;
      provider?: string;
      currency?: string;
    }) =>
      apiClient<PaymentIntentResponse>("/buyer/payments/intent", {
        method: "POST",
        body: JSON.stringify({
          order_id: data.order_id,
          booking_id: data.booking_id,
          campaign_id: data.campaign_id,
          subscription_id: data.subscription_id,
          provider: data.provider || "razorpay",
          currency: data.currency || "INR",
        }),
      }),

    confirm: (data: {
      provider_ref: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) =>
      apiClient<{ message: string; payment_id?: number }>("/buyer/payments/confirm", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getById: (id: number | string) => apiClient<PaymentIntentResponse>(`/payments/${id}`),
  },

  // ── Services & Bookings ──────────────────────────────────────────────────
  services: {
    list: (params?: {
      category_id?: number;
      lat?: number;
      lng?: number;
      radius?: number;
      search?: string;
    }) =>
      apiClient<ServiceItem[]>("/services", {
        params,
        skipAuth: true,
      }),

    getById: (id: number | string) =>
      apiClient<ServiceItem>(`/services/${id}`, { skipAuth: true }),

    listCategories: () =>
      apiClient<ServiceCategory[]>("/service-categories", { skipAuth: true }),

    createBooking: (data: {
      service_id: number;
      booking_time: string;
      address?: string;
      notes?: string;
    }) =>
      apiClient<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getBuyerBookings: () => apiClient<Booking[]>("/buyer/bookings"),
    getBookingById: (id: number | string) => apiClient<Booking>(`/bookings/${id}`),
  },

  // ── Donations & Blood ────────────────────────────────────────────────────
  donations: {
    listCampaigns: () => apiClient<DonationCampaign[]>("/donations/campaigns", { skipAuth: true }),
    getCampaignById: (id: number | string) =>
      apiClient<DonationCampaign>(`/donations/campaigns/${id}`, { skipAuth: true }),

    listBloodRequests: () => apiClient<BloodRequest[]>("/donations/blood", { skipAuth: true }),
    getBloodRequestById: (id: number | string) =>
      apiClient<BloodRequest>(`/donations/blood/${id}`, { skipAuth: true }),

    submitInterest: (requestId: number, notes?: string) =>
      apiClient<{ message: string }>(`/donations/blood/${requestId}/interest`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),

    registerDonor: (data: {
      blood_type: string;
      phone: string;
      city: string;
      is_available?: boolean;
    }) =>
      apiClient<{ message: string }>("/donations/donors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  chat: {
    getConversations: () => apiClient<Conversation[]>("/chat/conversations"),
    getMessages: (conversationId: number | string) =>
      apiClient<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: number | string, content: string) =>
      apiClient<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  // ── Subscriptions & Seller ───────────────────────────────────────────────
  subscriptions: {
    getPlans: () => apiClient<SubscriptionPlan[]>("/subscriptions/plans"),
    getMySubscription: () => apiClient<SellerSubscription>("/subscriptions/me"),
  },

  seller: {
    listProducts: () => apiClient<Product[]>("/seller/products"),
    getProductById: (id: number | string) => apiClient<Product>(`/seller/products/${id}`),
    createProduct: (data: {
      title: string;
      description: string;
      price: number; // in paise
      stock: number;
      category_id: number;
      images: string[];
    }) =>
      apiClient<Product>("/seller/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateProduct: (id: number | string, data: Partial<Product>) =>
      apiClient<Product>(`/seller/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteProduct: (id: number | string) =>
      apiClient<{ message: string }>(`/seller/products/${id}`, {
        method: "DELETE",
      }),
    getProviderBookings: () => apiClient<Booking[]>("/provider/bookings"),
    updateBookingStatus: (bookingId: number, status: string) =>
      apiClient<{ message: string }>(`/provider/bookings/${bookingId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },

  // ── Field Agent ──────────────────────────────────────────────────────────
  agent: {
    listSellers: () =>
      apiClient<{ sellers: AgentSellerSummary[] }>("/agent/sellers"),

    createSeller: (data: AgentCreateSellerRequest) =>
      apiClient<AgentSellerSummary>("/agent/sellers", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getSeller: (sellerId: string) =>
      apiClient<AgentSellerSummary>(`/agent/sellers/${sellerId}`),

    updateSellerProfile: (sellerId: string, data: AgentUpdateSellerProfileRequest) =>
      apiClient<AgentSellerSummary>(`/agent/sellers/${sellerId}/profile`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    updateSellerLocation: (
      sellerId: string,
      data: {
        latitude?: number;
        longitude?: number;
        lat?: number;
        lng?: number;
        city?: string;
        address?: string;
        formatted_address?: string;
      }
    ) =>
      apiClient<{ success: boolean; user: User }>(`/agent/sellers/${sellerId}/current-location`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    updateSellerBusinessLocation: (sellerId: string, data: AgentBusinessLocationRequest) =>
      apiClient<AgentBusinessLocationResponse>(`/agent/sellers/${sellerId}/business-location`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    createProduct: (sellerId: string, data: AgentCreateProductRequest) =>
      apiClient<Product>(`/agent/sellers/${sellerId}/products`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    createService: (sellerId: string, data: AgentCreateServiceRequest) =>
      apiClient<ServiceItem>(`/agent/sellers/${sellerId}/services`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    grantTrial: (sellerId: string) =>
      apiClient<AgentGrantTrialResponse>(`/agent/sellers/${sellerId}/subscription/grant-trial`, {
        method: "POST",
      }),
  },
};
