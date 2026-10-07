// ── Paykop TypeScript Types & DTOs ──────────────────────────────────────────

export interface User {
  id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: "buyer" | "seller" | "agent" | "admin" | string;
  is_onboarded: boolean;
  has_subscription: boolean;
  /** Self-serve listing gate: must be "verified" to publish products/services. */
  kyc_status?: string;
  profile_picture_url?: string;
  address?: string;
  has_saved_addresses?: boolean;
  auth_provider?: string;
  current_latitude?: number;
  current_longitude?: number;
  current_city_id?: number;
  current_address?: string;
  is_seller_ready?: boolean;
  next_onboarding_step?: string;
  subscription_phase?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RequestOTPResponse {
  message: string;
  debug_otp?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  parent_id?: number;
  image_url?: string;
  children?: ProductCategory[];
}

export interface ServiceCategory {
  id: number;
  name: string;
  subtitle?: string;
  icon?: string;
  icon_color?: string;
  bg_color?: string;
  image_url?: string;
}

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  type?: string;
  link_type?: string;
  link_id?: string;
  link_url?: string;
  is_active: boolean;
  order?: number;
}

export interface Review {
  id: number;
  user_id: string;
  target_type: "product" | "service";
  target_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

export interface Product {
  id: number;
  seller_id: string;
  vendor_id?: string;
  title: string;
  name?: string;
  description: string;
  price: number; // in paise
  stock: number;
  category: string;
  category_id?: number;
  images: string[];
  status: string;
  reviews?: Review[];
  average_rating: number;
  review_count: number;
  distance_km?: number;
}

export interface ServiceItem {
  id: number;
  provider_id: string;
  title: string;
  description: string;
  fees: number; // in paise
  category_id: number;
  category?: ServiceCategory;
  images?: string[];
  image?: string;
  subtitle?: string;
  rating?: number;
  avg_rating?: number;
  review_count: number;
  status: string;
  operating_hours?: string;
  experience_years?: number;
}

export interface OrganizationPublic {
  id: string;
  legal_name: string;
  org_type: string;
  category: string;
  is_80g_registered: boolean;
  city_id?: number;
  logo_url?: string;
  description?: string;
  created_at: string;
}

export interface OrganizationPublicDetail extends OrganizationPublic {
  active_campaigns?: DonationCampaign[];
}

export interface OrganizationListResponse {
  organizations: OrganizationPublic[];
  total: number;
  page: number;
  limit: number;
}

export interface DonationCampaign {
  id: number;
  org_id?: string;
  organization?: OrganizationPublic;
  title: string;
  description: string;
  image_url?: string;
  image?: string;
  target_amount: number; // paise
  raised_amount: number; // paise
  remaining_amount?: number;
  progress?: number;
  donor_count?: number;
  urgent?: boolean;
  is_urgent?: boolean;
  status: string;
  beneficiary_name?: string;
  end_date?: string;
}

export interface CreateDonationIntentRequest {
  org_id: string;
  campaign_id?: number;
  amount_paise: number;
  donor_name: string;
  donor_phone: string;
  donor_email?: string;
  donor_pan?: string;
  tax_eligible?: boolean;
}

export interface DonationIntentResponse {
  donation_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
}

export interface DonationStatusResponse {
  id: string;
  org_id: string;
  campaign_id?: number;
  payment_status: "pending" | "retrying" | "captured" | "failed";
  reconciliation_status: "not_applicable" | "pending" | "reconciled" | "disputed";
  amount_paise: number;
  tax_eligible: boolean;
  financial_year: string;
  donor_name: string;
  donor_phone_masked: string;
  receipt_url?: string;
  created_at: string;
}

export interface OrgReceiptInfo {
  id: string;
  legal_name: string;
  org_type: string;
  category: string;
  registration_number?: string;
  pan?: string;
  is_80g_registered: boolean;
}

export interface DonorReceiptInfo {
  name: string;
  phone_masked: string;
  email?: string;
  pan?: string;
}

export interface DonationReceiptResponse {
  receipt_number: string;
  receipt_date: string;
  financial_year: string;
  donation_id: string;
  amount_paise: number;
  amount_inr: number;
  payment_method: string;
  payment_date: string;
  campaign_title?: string;
  organization: OrgReceiptInfo;
  donor: DonorReceiptInfo;
  statutory_note: string;
}

export interface UserDonationItem {
  id: string;
  org_id: string;
  org_name: string;
  campaign_id?: number;
  campaign_title?: string;
  amount_paise: number;
  amount_inr: number;
  payment_method: string;
  payment_status: string;
  reconciliation_status: string;
  tax_eligible: boolean;
  financial_year: string;
  receipt_number?: string;
  created_at: string;
}

export interface UserDonationsListResponse {
  donations: UserDonationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BloodRequest {
  id: number;
  patient_name: string;
  blood_type: string;
  units_needed: number;
  hospital: string;
  contact_phone: string;
  latitude?: number;
  longitude?: number;
  urgent?: boolean;
  is_urgent?: boolean;
  status?: string;
  created_at: string;
}

export interface HomeFeedResponse {
  banners: Banner[];
  services: {
    id: number;
    title: string;
    subtitle?: string;
    icon?: string;
    iconColor?: string;
    icon_color?: string;
    bgColor?: string;
    bg_color?: string;
    image_url?: string;
  }[];
  product_categories: {
    id: number;
    title: string;
    name?: string;
    subtitle?: string;
    image?: string;
    image_url?: string;
    product_count?: number;
  }[];
  active_donations: DonationCampaign[];
  active_blood_requests: BloodRequest[];
  nearby_services: {
    id: number;
    image: string;
    title: string;
    subtitle?: string;
    rating: number;
    review_count: number;
    price: number; // paise
  }[];
  featured_products: {
    id: number;
    seller_id: string;
    title: string;
    description: string;
    price: number; // paise
    stock?: number;
    category: string;
    image?: string;
    images?: string[];
    status: string;
    average_rating: number;
    review_count: number;
  }[];
  location_message?: string;
}

export interface Address {
  id: string;
  label: string;
  address_line: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  is_default: boolean;
  status?: string;
}

export interface CartItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  price: number; // paise
  product: {
    id: number;
    title: string;
    description: string;
    price: number; // paise
    images_json?: string;
    image?: string;
    stock: number;
    seller_id: string;
  };
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_price: number; // paise
}

export interface WishlistItem {
  id: number;
  user_id: string;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface Order {
  id: number;
  buyer_id: string;
  seller_id: string;
  product_id: number;
  quantity: number;
  total_price: number; // paise
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | string;
  address_id?: string;
  delivery_otp?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    title: string;
    description: string;
    price: number; // paise
    category: string;
    images?: string;
  };
}

export interface PaymentIntentResponse {
  id: number;
  order_id?: number;
  booking_id?: number;
  campaign_id?: number;
  subscription_id?: number;
  amount: number; // paise
  currency: string;
  status: string;
  provider: string;
  provider_ref: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
}

export interface Booking {
  id: number;
  customer_id: string;
  provider_id: string;
  service_id: number;
  service?: ServiceItem;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | string;
  total_price: number; // paise
  notes?: string;
  address?: string;
  verification_otp?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number; // paise
  duration_days: number;
  features?: string[];
  is_active: boolean;
}

export interface SellerSubscription {
  subscription_id: number;
  id?: number;
  seller_id?: string;
  user_id?: string;
  plan: string | SubscriptionPlan;
  status?: string;
  starts_at: string;
  expires_at?: string;
  is_trial?: boolean;
  is_active?: boolean;
}

export interface Conversation {
  id: number | string;
  conversation_id?: string;
  participant_id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: number | string;
  conversation_id: number | string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_read?: boolean;
}

export interface ReverseGeocodeResult {
  formatted_address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
}

export interface PlanTierLimits {
  max_active_products?: number;
  max_active_services?: number;
  max_monthly_order_count?: number;
  max_monthly_gmv?: number;
}

export interface PlanTierUsage {
  active_products: number;
  active_services: number;
  monthly_order_count: number;
  monthly_gmv: number;
}

export interface UserPermissions {
  is_admin: boolean;
  is_support?: boolean;
  is_agent: boolean;
  is_seller: boolean;
  is_buyer: boolean;
  is_subscriber: boolean;
  is_onboarded: boolean;
  kyc_status?: string;
  is_seller_ready?: boolean;
  seller_ready_missing?: string[];
  subscription_phase?: string;
  subscription_expires_at?: string;
  days_until_subscription_expiry?: number;
  is_trial?: boolean;
  commercial_access_status?: string;
  commission_rate_bps?: number;
  tier_name?: string;
  plan_limits?: PlanTierLimits;
  plan_usage?: PlanTierUsage;
  onboarding_fee_required?: boolean;
  onboarding_fee_amount?: number;
  next_onboarding_step?: string;
}

export interface SellerReadiness {
  kyc_status?: string;
  is_seller_ready: boolean;
  seller_ready_missing?: string[];
  next_onboarding_step?: string;
  subscription_phase?: string;
  subscription_expires_at?: string;
  days_until_subscription_expiry?: number;
  is_trial?: boolean;
  commercial_access_status?: string;
  commission_rate_bps?: number;
  tier_name?: string;
  plan_limits?: PlanTierLimits;
  plan_usage?: PlanTierUsage;
  onboarding_fee_required?: boolean;
  onboarding_fee_amount?: number;
}

export interface AgentSellerSummary {
  id: string;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  address?: string;
  role: string;
  is_onboarded: boolean;
  has_subscription: boolean;
  kyc_status: string;
  current_city_id?: number;
  created_by_agent_id?: string;
  onboarding_source: string;
  onboarded_by_agent_id?: string;
  onboarded_at?: string;
  commercial_access_status?: string;
  seller_ready_missing?: string[];
  is_seller_ready?: boolean;
  next_onboarding_step?: string;
  onboarding_fee_required?: boolean;
  onboarding_fee_amount?: number;
  subscription_plan?: string;
}

export interface AgentCreateSellerRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface AgentUpdateSellerProfileRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address: string;
  bio?: string;
  profile_picture_url?: string;
}

export interface AgentBusinessLocationRequest {
  address: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  postal_code?: string;
  location_enabled?: boolean;
}

export interface AgentBusinessLocationResponse {
  seller_id: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  postal_code?: string;
  location_enabled: boolean;
}

export interface AgentCreateProductRequest {
  title: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  images?: string[];
}

export interface AgentCreateServiceRequest {
  category_id: number;
  title: string;
  description?: string;
  fees: number;
  schedule_info: string;
  latitude?: number;
  longitude?: number;
  address: string;
  images?: string[];
}

export interface PublicProfileResponse {
  id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  bio?: string;
  social_links?: string;
  location_enabled?: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  products?: Product[];
}

// ── Search (federated) ─────────────────────────────────────────────────────

export type SearchResultType =
  | "product"
  | "service"
  | "donation_campaign"
  | "blood_request"
  | "blood_donor"
  | "user";

export interface SearchResult {
  type: SearchResultType;
  id: number | string;
  title: string;
  subtitle: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchParams {
  q?: string;
  type?: "product" | "service" | "donation" | "user" | string;
  category?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
  sort?: "price_asc" | "price_desc" | string;
  page?: number;
  limit?: number;
}

// ── Storage ────────────────────────────────────────────────────────────────

export interface PresignRequest {
  file_name: string;
  content_type: string;
  size?: number;
  purpose?: string;
}

export interface PresignResponse {
  upload_url: string;
  public_url: string;
  file_url: string;
  key: string;
}

// ── KYC ────────────────────────────────────────────────────────────────────

export interface KycRequirement {
  doc_type: string;
  required: boolean;
  label: string;
}

export interface KycDocumentInput {
  doc_type: string;
  file_url?: string;
  file_key: string;
  content_type?: string;
}

export interface KycDocumentItem {
  doc_type: string;
  file_url?: string;
  file_key: string;
  content_type?: string;
  uploaded_at?: string;
}

export interface KycSubmission {
  id?: number;
  seller_user_id?: string;
  status: string;
  category_kind?: string;
  primary_category_id?: number;
  primary_category_name?: string;
  gstin?: string;
  pan?: string;
  rejection_reason?: string;
  documents?: KycDocumentItem[];
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KycUpsertRequest {
  category_kind: string;
  primary_category_id: number;
  gstin?: string;
  pan?: string;
  documents?: KycDocumentInput[];
}

// ── Subscriptions (extended) ─────────────────────────────────────────────────

export interface SubscribeRequest {
  plan_id: number;
}

export interface SubscribeResponse {
  mode: "activated" | "payment_intent" | string;
  subscription?: {
    id: number;
    user_id: string;
    plan: string;
    status: string;
    starts_at: string;
    expires_at?: string;
    is_trial?: boolean;
  };
  payment?: PaymentIntentResponse;
}

export interface SubscriptionHistoryItem {
  id: number;
  plan: string;
  status: string;
  starts_at: string;
  expires_at?: string;
  is_trial?: boolean;
}

// ── Agent (extended) ─────────────────────────────────────────────────────

export interface AgentOnboardingStatus extends AgentSellerSummary {
  subscription?: SellerSubscription;
  subscription_status?: string;
  commercial_access_status?: string;
  seller_ready_missing?: string[];
  is_seller_ready?: boolean;
  next_onboarding_step?: string;
}

export type AgentSubscribeResponse = SubscribeResponse;

// ── Provider services ────────────────────────────────────────────────────────

export interface ProviderServiceInput {
  category_id: number;
  title: string;
  description?: string;
  fees: number;
  schedule_info?: string;
  operating_hours?: string;
  latitude?: number;
  longitude?: number;
  address: string;
  images?: string[];
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

// ── Support tickets ──────────────────────────────────────────────────────────

export interface SupportAttachment {
  file_key: string;
  file_url: string;
}

export interface SupportMessage {
  id: number;
  author_user_id: string;
  message: string;
  created_at: string;
  attachments?: SupportAttachment[];
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  description?: string;
  status: string;
  priority: string;
  user_id: string;
  order_id?: number;
  created_at: string;
  updated_at: string;
  attachments?: SupportAttachment[];
  messages?: SupportMessage[];
}

export interface CreateSupportTicketRequest {
  subject: string;
  category: string;
  description: string;
  priority?: string;
  order_id?: number;
  attachments?: SupportAttachment[];
}

// ── Blood (extended) ─────────────────────────────────────────────────────────

export interface BloodDonorProfile {
  id: number;
  donor_name: string;
  blood_type: string;
  phone: string;
  address?: string;
  city?: string;
  is_available?: boolean;
  notes?: string;
}

export interface RaiseBloodRequestInput {
  patient_name: string;
  blood_type: string;
  units_needed: number;
  hospital: string;
  contact_phone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  urgent?: boolean;
  notes?: string;
}

// ── Chat (extended) ──────────────────────────────────────────────────────────

export interface CreateConversationRequest {
  participant_id: string;
}

export interface BookingStatusResponse {
  id: number;
  status: string;
  booking_time?: string;
  verification_otp?: string;
}
