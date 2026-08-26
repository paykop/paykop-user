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

export interface DonationCampaign {
  id: number;
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
  seller_id?: string;
  plan: string | SubscriptionPlan;
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

export interface UserPermissions {
  is_admin: boolean;
  is_agent: boolean;
  is_seller: boolean;
  is_buyer: boolean;
  is_subscriber: boolean;
  is_onboarded: boolean;
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

export interface AgentGrantTrialResponse {
  subscription_id: number;
  seller_id: string;
  plan: string;
  starts_at: string;
  expires_at?: string;
  is_trial: boolean;
}

export interface AgentBusinessLocationRequest {
  latitude: number;
  longitude: number;
  address: string;
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
