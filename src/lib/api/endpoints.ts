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
  OrganizationPublic,
  OrganizationPublicDetail,
  OrganizationListResponse,
  CreateDonationIntentRequest,
  DonationIntentResponse,
  DonationStatusResponse,
  DonationReceiptResponse,
  UserDonationsListResponse,
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
  AgentBusinessLocationRequest,
  AgentBusinessLocationResponse,
  AgentCreateProductRequest,
  AgentCreateServiceRequest,
  Review,
  SearchResponse,
  SearchProductsResponse,
  SearchParams,
  PresignRequest,
  PresignResponse,
  KycRequirement,
  KycSubmission,
  KycUpsertRequest,
  SubscribeRequest,
  SubscribeResponse,
  SubscriptionHistoryItem,
  AgentOnboardingStatus,
  ProviderServiceInput,
  CreateReviewRequest,
  SupportTicket,
  CreateSupportTicketRequest,
  SupportMessage,
  BloodDonorProfile,
  RaiseBloodRequestInput,
  BookingStatusResponse,
  PublicProfileResponse,
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

    logoutAgent: (refreshToken: string) =>
      apiClient<{ message: string }>("/auth/agent/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),

    logoutSupport: (refreshToken: string) =>
      apiClient<{ message: string }>("/auth/support/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),

    logoutAllDevices: () =>
      apiClient<{ message: string }>("/auth/logout-all-devices", {
        method: "POST",
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
    query: (params: SearchParams | string) => {
      const p = typeof params === "string" ? { q: params } : params;
      return apiClient<SearchResponse>("/search", {
        params: p as Record<string, string | number | boolean | null | undefined>,
        skipAuth: true,
      });
    },

    products: (params?: SearchParams) =>
      apiClient<SearchProductsResponse>("/search/products", {
        params: params as Record<string, string | number | boolean | null | undefined> | undefined,
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
    regenerateOtp: (id: number | string) =>
      apiClient<{ delivery_otp: string }>(`/buyer/orders/${id}/regenerate-otp`, {
        method: "POST",
      }),
    getPayment: (id: number | string) =>
      apiClient<PaymentIntentResponse>(`/buyer/orders/${id}/payment`),
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
    getBookingStatus: (id: number | string) =>
      apiClient<BookingStatusResponse>(`/bookings/${id}/status`),
    regenerateBookingOtp: (id: number | string) =>
      apiClient<{ verification_otp: string }>(`/bookings/${id}/regenerate-otp`, {
        method: "POST",
      }),
  },

  // ── Donations & Blood ────────────────────────────────────────────────────
  donations: {
    listCampaigns: async (): Promise<DonationCampaign[]> => {
      const res = await apiClient<DonationCampaign[] | { campaigns?: DonationCampaign[] }>(
        "/donations/campaigns",
        { skipAuth: true }
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.campaigns)) return res.campaigns;
      return [];
    },
    getCampaignById: (id: number | string) =>
      apiClient<DonationCampaign>(`/donations/campaigns/${id}`, { skipAuth: true }),

    listOrganizations: (page?: number, limit?: number) =>
      apiClient<OrganizationListResponse>("/donations/organizations", {
        skipAuth: true,
        params: { page, limit },
      }),

    getOrganizationById: (id: string) =>
      apiClient<OrganizationPublicDetail>(`/donations/organizations/${id}`, {
        skipAuth: true,
      }),

    createIntent: (data: CreateDonationIntentRequest, idempotencyKey?: string) =>
      apiClient<DonationIntentResponse>("/donations/intent", {
        method: "POST",
        body: JSON.stringify(data),
        idempotencyKey,
        skipAuth: true,
      }),

    getStatus: (id: string) =>
      apiClient<DonationStatusResponse>(`/donations/${id}/status`, {
        skipAuth: true,
      }),

    getReceipt: (id: string) =>
      apiClient<DonationReceiptResponse>(`/donations/${id}/receipt`, {
        skipAuth: true,
      }),

    getMyDonations: (page?: number, limit?: number) =>
      apiClient<UserDonationsListResponse>("/user/donations", {
        params: { page, limit },
      }),

    agentCollectCash: (data: {
      org_id: string;
      campaign_id?: number;
      amount_paise: number;
      donor_name: string;
      donor_phone: string;
      donor_email?: string;
      donor_pan?: string;
      tax_eligible: boolean;
      dpdp_consent_given: boolean;
      collection_proof_url?: string;
    }) =>
      apiClient<{
        donation_id: string;
        payment_status: string;
        reconciliation_status: string;
        amount_paise: number;
      }>("/agent/donations/collect", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    agentListDonations: (page?: number, limit?: number) =>
      apiClient<{
        donations: Array<{
          id: string;
          org_id: string;
          campaign_id?: number;
          payment_method: string;
          amount_paise: number;
          donor_name: string;
          donor_phone_masked: string;
          donor_email?: string;
          tax_eligible: boolean;
          financial_year: string;
          payment_status: string;
          reconciliation_status: string;
          collected_by_agent_id: string;
          collection_proof_url?: string;
          deposit_proof_url?: string;
          created_at: string;
        }>;
        total: number;
        page: number;
        limit: number;
      }>("/agent/donations", {
        params: { page, limit },
      }),

    agentUploadDepositProof: (id: string, depositProofUrl: string) =>
      apiClient<{ message: string; deposit_proof_url: string }>(`/agent/donations/${id}/deposit-proof`, {
        method: "POST",
        body: JSON.stringify({ deposit_proof_url: depositProofUrl }),
      }),

    listBloodRequests: async (): Promise<BloodRequest[]> => {
      const res = await apiClient<BloodRequest[] | { requests?: BloodRequest[] }>(
        "/donations/blood",
        { skipAuth: true }
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.requests)) return res.requests;
      return [];
    },
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

    getMyDonorProfile: () => apiClient<BloodDonorProfile>("/donations/blood/donors/me"),
    updateMyDonorProfile: (data: Partial<BloodDonorProfile>) =>
      apiClient<BloodDonorProfile>("/donations/blood/donors/me", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggleDonorAvailability: (isAvailable: boolean) =>
      apiClient<{ message: string }>("/donations/blood/donors/me/availability", {
        method: "PATCH",
        body: JSON.stringify({ is_available: isAvailable }),
      }),
    deleteMyDonorProfile: () =>
      apiClient<{ message: string }>("/donations/blood/donors/me", {
        method: "DELETE",
      }),

    raiseBloodRequest: (data: RaiseBloodRequestInput) =>
      apiClient<BloodRequest>("/donations/blood", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    raiseCampaign: (data: {
      title: string;
      description: string;
      target_amount: number;
      beneficiary_name?: string;
      image_url?: string;
    }) =>
      apiClient<DonationCampaign>("/donations/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  chat: {
    createConversation: (participantId: string) =>
      apiClient<Conversation>("/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ participant_id: participantId }),
      }),
    getConversations: () => apiClient<Conversation[]>("/chat/conversations"),
    getMessages: (conversationId: number | string) =>
      apiClient<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: number | string, content: string) =>
      apiClient<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    markAsRead: (conversationId: number | string) =>
      apiClient<{ message: string }>(`/chat/conversations/${conversationId}/read`, {
        method: "PUT",
      }),
  },

  // ── Subscriptions & Seller ───────────────────────────────────────────────
  subscriptions: {
    getPlans: () => apiClient<SubscriptionPlan[]>("/subscriptions/plans"),
    getMySubscription: () => apiClient<SellerSubscription>("/subscriptions/me"),
    getHistory: () => apiClient<SubscriptionHistoryItem[]>("/subscriptions/history"),
    subscribe: (data: SubscribeRequest) =>
      apiClient<SubscribeResponse>("/subscriptions/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: () =>
      apiClient<{ message: string }>("/subscriptions/cancel", {
        method: "POST",
      }),
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
    listOrders: () => apiClient<Order[]>("/seller/orders"),
    getOrderById: (id: number | string) => apiClient<Order>(`/seller/orders/${id}`),
    verifyCod: (orderId: number | string, otp: string) =>
      apiClient<{ message: string }>(`/seller/orders/${orderId}/verify-cod`, {
        method: "POST",
        body: JSON.stringify({ otp }),
      }),
    listServiceCategories: () =>
      apiClient<ServiceCategory[]>("/seller/service-categories"),
  },

  provider: {
    createService: (data: ProviderServiceInput) =>
      apiClient<ServiceItem>("/provider/services", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateService: (id: number | string, data: Partial<ProviderServiceInput>) =>
      apiClient<ServiceItem>(`/provider/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteService: (id: number | string) =>
      apiClient<{ message: string }>(`/provider/services/${id}`, {
        method: "DELETE",
      }),
  },

  storage: {
    getPresignedUrl: (data: PresignRequest) =>
      apiClient<PresignResponse>("/storage/presigned-url", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  kyc: {
    getRequirements: (categoryKind: string, categoryId: number) =>
      apiClient<{ requirements: KycRequirement[] }>("/sellers/me/kyc/requirements", {
        params: { kind: categoryKind, category_id: categoryId },
      }),
    getMyKyc: () => apiClient<KycSubmission>("/sellers/me/kyc"),
    upsertDraft: (data: KycUpsertRequest) =>
      apiClient<KycSubmission>("/sellers/me/kyc", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    submit: () =>
      apiClient<KycSubmission>("/sellers/me/kyc/submit", {
        method: "POST",
      }),
  },

  reviews: {
    listProductReviews: (productId: number | string) =>
      apiClient<Review[]>(`/products/${productId}/reviews`, { skipAuth: true }),
    createProductReview: (productId: number | string, data: CreateReviewRequest) =>
      apiClient<Review>(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listServiceReviews: (serviceId: number | string) =>
      apiClient<Review[]>(`/services/${serviceId}/reviews`, { skipAuth: true }),
    createServiceReview: (serviceId: number | string, data: CreateReviewRequest) =>
      apiClient<Review>(`/services/${serviceId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  support: {
    createTicket: (data: CreateSupportTicketRequest) =>
      apiClient<{ ticket: SupportTicket }>("/support/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listTickets: () => apiClient<{ tickets: SupportTicket[]; total: number }>("/support/tickets"),
    getTicket: (id: number | string) => apiClient<SupportTicket>(`/support/tickets/${id}`),
    addMessage: (id: number | string, message: string) =>
      apiClient<SupportMessage>(`/support/tickets/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    closeTicket: (id: number | string) =>
      apiClient<{ status: string }>(`/support/tickets/${id}/close`, {
        method: "PATCH",
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

    getOnboardingStatus: (sellerId: string) =>
      apiClient<AgentOnboardingStatus>(`/agent/sellers/${sellerId}/onboarding-status`),

    getSellerSubscription: (sellerId: string) =>
      apiClient<SellerSubscription>(`/agent/sellers/${sellerId}/subscription`),

    subscribeSeller: (sellerId: string, planId: number) =>
      apiClient<SubscribeResponse>(`/agent/sellers/${sellerId}/subscription/subscribe`, {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      }),

    subscribeSellerIntent: (sellerId: string, planId: number) =>
      apiClient<SubscribeResponse>(`/agent/sellers/${sellerId}/subscription/intent`, {
        method: "POST",
        body: JSON.stringify({ plan_id: planId }),
      }),

    cancelSellerSubscription: (sellerId: string) =>
      apiClient<{ message: string }>(`/agent/sellers/${sellerId}/subscription/cancel`, {
        method: "POST",
      }),

    getSellerServiceCategories: (sellerId: string) =>
      apiClient<{ categories: ServiceCategory[] }>(
        `/agent/sellers/${sellerId}/service-categories`
      ),

    getSellerKyc: (sellerId: string) =>
      apiClient<KycSubmission>(`/agent/sellers/${sellerId}/kyc`),

    getSellerKycRequirements: (
      sellerId: string,
      categoryKind: string,
      categoryId: number
    ) =>
      apiClient<{ requirements: KycRequirement[] }>(
        `/agent/sellers/${sellerId}/kyc/requirements`,
        { params: { kind: categoryKind, category_id: categoryId } }
      ),

    getSellerKycPresignedUrl: (sellerId: string, data: PresignRequest) =>
      apiClient<PresignResponse>(`/agent/sellers/${sellerId}/kyc/presigned-url`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    upsertSellerKyc: (sellerId: string, data: KycUpsertRequest) =>
      apiClient<KycSubmission>(`/agent/sellers/${sellerId}/kyc`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    submitSellerKyc: (sellerId: string) =>
      apiClient<KycSubmission>(`/agent/sellers/${sellerId}/kyc/submit`, {
        method: "POST",
      }),

    getSellerProducts: async (sellerId: string) => {
      try {
        const profile = await apiClient<PublicProfileResponse>(`/profiles/${sellerId}`, {
          skipAuth: true,
        });
        return Array.isArray(profile.products) ? profile.products : [];
      } catch {
        return [];
      }
    },
  },

  profiles: {
    get: (id: string) =>
      apiClient<PublicProfileResponse>(`/profiles/${id}`, {
        skipAuth: true,
      }),
  },
};

export const endpoints = api;
