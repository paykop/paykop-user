"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { parseProductImages } from "@/lib/media";
import { SearchParams, Product } from "@/types";
import { queryKeys } from "./keys";
import { mapHomeFeed } from "@/lib/home/mapFeed";

function mapNearbyProduct(product: Product): Product {
  return {
    ...product,
    images: parseProductImages(product),
  };
}

export function useHomeFeed(latitude?: number, longitude?: number) {
  return useQuery({
    queryKey: queryKeys.home(latitude, longitude),
    queryFn: async () => {
      const raw = await api.home.getFeed({
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        radius: 15,
      });
      return mapHomeFeed(raw);
    },
  });
}

export function useNearbyProducts(opts: {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  limit?: number;
  categoryId?: number;
}) {
  const lat = opts.latitude ?? undefined;
  const lng = opts.longitude ?? undefined;
  const radius = opts.radius ?? 15;
  const hasLocation = typeof lat === "number" && typeof lng === "number";

  return useQuery({
    queryKey: queryKeys.nearbyProducts(lat, lng, radius, opts.categoryId),
    enabled: hasLocation,
    queryFn: async () => {
      const data = await api.products.list({
        lat,
        lng,
        radius,
        limit: opts.limit ?? 8,
        category_id: opts.categoryId,
      });
      return (data.products || [])
        .map(mapNearbyProduct)
        .filter((product) => typeof product.distance_km === "number");
    },
  });
}

export function useFarmProducts(limit = 8) {
  return useQuery({
    queryKey: ["products", "vertical", "farm", limit],
    queryFn: async () => {
      const data = await api.products.list({
        vertical: "farm",
        limit,
      });
      return data.products || [];
    },
  });
}

export function useCategories(vertical?: string) {
  return useQuery({
    queryKey: [...queryKeys.categories, vertical || "all"],
    queryFn: async () => {
      const data = await api.categories.getAll(vertical ? { vertical } : undefined);
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useCategory(id: number | string) {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => api.categories.getById(id),
    enabled: !!id,
  });
}

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    enabled: session.isAuthenticated(),
    queryFn: () => api.cart.get(),
  });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    enabled: session.isAuthenticated(),
    queryFn: () => api.auth.getMe(),
  });
}

export function usePermissions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.permissions,
    enabled: enabled && session.isAuthenticated(),
    queryFn: () => api.users.getPermissions(),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    enabled: session.isAuthenticated(),
    queryFn: () => api.orders.listBuyer(),
  });
}

export function useOrder(id: number | string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    enabled: session.isAuthenticated() && !!id,
    queryFn: () => api.orders.getById(id),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.orders.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    enabled: session.isAuthenticated(),
    queryFn: () => api.services.getBuyerBookings(),
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses,
    enabled: session.isAuthenticated(),
    queryFn: () => api.addresses.list(),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addresses.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.addresses.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.addresses.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.wishlist,
    enabled: session.isAuthenticated(),
    queryFn: () => api.wishlist.list(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: number; quantity?: number }) =>
      api.cart.add(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      window.dispatchEvent(new Event("paykop_cart_change"));
    },
  });
}

export function useUpdateCartQty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      api.cart.updateQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      window.dispatchEvent(new Event("paykop_cart_change"));
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.cart.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      window.dispatchEvent(new Event("paykop_cart_change"));
    },
  });
}

export function useProduct(id: number | string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    enabled: !!id,
    queryFn: () => api.products.getById(id),
  });
}

export function useProducts(params?: {
  page?: number;
  limit?: number;
  category_id?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: async () => {
      const data = await api.products.list(params);
      return data.products || [];
    },
  });
}

export function useService(id: number | string) {
  return useQuery({
    queryKey: queryKeys.service(id),
    enabled: !!id,
    queryFn: () => api.services.getById(id),
  });
}

export function useServices(params?: {
  category_id?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.services(params),
    queryFn: () => api.services.list(params),
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: queryKeys.serviceCategories,
    queryFn: () => api.services.listCategories(),
  });
}

export function useSellerProducts() {
  return useQuery({
    queryKey: queryKeys.sellerProducts,
    enabled: session.isAuthenticated(),
    queryFn: () => api.seller.listProducts(),
  });
}

export function useDeleteSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => api.seller.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sellerProducts }),
  });
}

export function useSellerBookings() {
  return useQuery({
    queryKey: queryKeys.sellerBookings,
    enabled: session.isAuthenticated(),
    queryFn: () => api.seller.getProviderBookings(),
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: number; status: string }) =>
      api.seller.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sellerBookings });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

export function useSellerPlans() {
  return useQuery({
    queryKey: queryKeys.sellerPlans,
    enabled: session.isAuthenticated(),
    queryFn: () => api.subscriptions.getPlans(),
  });
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    enabled: session.isAuthenticated(),
    queryFn: () => api.chat.getConversations(),
  });
}

export function useMessages(conversationId: number | string | null) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId ?? ""),
    enabled: session.isAuthenticated() && !!conversationId,
    queryFn: () => api.chat.getMessages(conversationId!),
  });
}

export function useDonations() {
  return useQuery({
    queryKey: queryKeys.donations,
    queryFn: () => api.donations.listCampaigns(),
  });
}

export function useDonation(id: number | string) {
  return useQuery({
    queryKey: queryKeys.donation(id),
    enabled: !!id,
    queryFn: () => api.donations.getCampaignById(id),
  });
}

export function useOrganizations(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...queryKeys.organizations, page, limit],
    queryFn: () => api.donations.listOrganizations(page, limit),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: queryKeys.organization(id),
    enabled: !!id,
    queryFn: () => api.donations.getOrganizationById(id),
  });
}

export function useBloodRequests() {
  return useQuery({
    queryKey: queryKeys.blood,
    queryFn: () => api.donations.listBloodRequests(),
  });
}

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: queryKeys.search(params as Record<string, unknown>),
    queryFn: () => api.search.query(params),
  });
}

export function useSearchProducts(params: SearchParams) {
  return useQuery({
    queryKey: queryKeys.searchProducts(params as Record<string, unknown>),
    queryFn: () => api.search.products(params),
  });
}

export function useKyc() {
  return useQuery({
    queryKey: queryKeys.kyc,
    enabled: session.isAuthenticated(),
    queryFn: () => api.kyc.getMyKyc(),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.subscription,
    enabled: session.isAuthenticated(),
    queryFn: () => api.subscriptions.getMySubscription(),
  });
}

export function useSubscriptionHistory() {
  return useQuery({
    queryKey: queryKeys.subscriptionHistory,
    enabled: session.isAuthenticated(),
    queryFn: () => api.subscriptions.getHistory(),
  });
}

export function useSellerOrders() {
  return useQuery({
    queryKey: queryKeys.sellerOrders,
    enabled: session.isAuthenticated(),
    queryFn: () => api.seller.listOrders(),
  });
}

export function useSupportTickets() {
  return useQuery({
    queryKey: queryKeys.supportTickets,
    enabled: session.isAuthenticated(),
    queryFn: async () => {
      const res = await api.support.listTickets();
      return res.tickets ?? [];
    },
  });
}

export function useProductReviews(productId: number | string) {
  return useQuery({
    queryKey: queryKeys.productReviews(productId),
    enabled: !!productId,
    queryFn: () => api.reviews.listProductReviews(productId),
  });
}

export function useServiceReviews(serviceId: number | string) {
  return useQuery({
    queryKey: queryKeys.serviceReviews(serviceId),
    enabled: !!serviceId,
    queryFn: () => api.reviews.listServiceReviews(serviceId),
  });
}

export function useBooking(id: number | string) {
  return useQuery({
    queryKey: queryKeys.booking(id),
    enabled: session.isAuthenticated() && !!id,
    queryFn: () => api.services.getBookingById(id),
  });
}

export function useBloodDonorMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.bloodDonorMe,
    enabled: enabled && session.isAuthenticated(),
    queryFn: () => api.donations.getMyDonorProfile(),
    retry: false,
  });
}

export function useAgentSellers() {
  return useQuery({
    queryKey: queryKeys.agentSellers,
    enabled: session.isAuthenticated(),
    queryFn: async () => {
      const res = await api.agent.listSellers();
      return res.sellers || [];
    },
  });
}

export function useAgentSeller(id: string) {
  return useQuery({
    queryKey: queryKeys.agentSeller(id),
    enabled: session.isAuthenticated() && !!id,
    queryFn: () => api.agent.getSeller(id),
  });
}

export function useSellerReadiness(enabled = true) {
  return useQuery({
    queryKey: queryKeys.sellerReadiness,
    enabled: enabled && session.isAuthenticated(),
    queryFn: () => api.sellers.getReadiness(),
  });
}

export function useSellerPayoutAccount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.sellerPayoutAccount,
    enabled: enabled && session.isAuthenticated(),
    queryFn: () => api.sellers.getPayoutAccount(),
    retry: false,
  });
}

export function useSellerPayouts(page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sellerPayouts(page, limit),
    enabled: enabled && session.isAuthenticated(),
    queryFn: () => api.sellers.listPayouts(page, limit),
  });
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications,
    enabled: enabled && session.isAuthenticated(),
    queryFn: async () => {
      const res = await api.notifications.list();
      if (Array.isArray(res)) return res;
      return res.notifications || [];
    },
  });
}

export function useMatchingDonors(requestId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.matchingDonors(requestId),
    enabled: enabled && !!requestId,
    queryFn: () => api.donations.getMatchingDonors(requestId),
  });
}

export function useNearbySellers(lat?: number | null, lng?: number | null, radius = 10) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: queryKeys.nearbySellers(lat ?? undefined, lng ?? undefined, radius),
    enabled: hasCoords,
    queryFn: async () => {
      const res = await api.sellers.getNearby({
        latitude: lat!,
        longitude: lng!,
        radius,
      });
      return res.sellers || [];
    },
  });
}

export function useBuyerReturns(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.buyerReturns(page, limit),
    enabled: session.isAuthenticated(),
    queryFn: () => api.returns.listBuyer({ page, limit }),
  });
}

export function useBuyerReturn(id: number | string) {
  return useQuery({
    queryKey: queryKeys.buyerReturn(id),
    enabled: session.isAuthenticated() && !!id,
    queryFn: () => api.returns.getBuyerReturn(id),
  });
}

export function useOrderReturns(orderId: number | string) {
  return useQuery({
    queryKey: queryKeys.orderReturns(orderId),
    enabled: session.isAuthenticated() && !!orderId,
    queryFn: () => api.returns.listOrderReturns(orderId),
  });
}

export function useSellerReturns(status?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.sellerReturns(status, page, limit),
    enabled: session.isAuthenticated(),
    queryFn: () => api.returns.listSeller({ status, page, limit }),
  });
}

export function useSellerReturn(id: number | string) {
  return useQuery({
    queryKey: queryKeys.sellerReturn(id),
    enabled: session.isAuthenticated() && !!id,
    queryFn: () => api.returns.getSellerReturn(id),
  });
}

