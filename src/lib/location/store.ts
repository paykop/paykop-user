import { create } from "zustand";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  cityId: number | null;
  cityName: string;
  formattedAddress: string;
  isLocating: boolean;
  isModalOpen: boolean;
  /** True after client has applied localStorage (avoids SSR/client mismatch). */
  hasHydrated: boolean;
  setLocation: (loc: {
    latitude: number;
    longitude: number;
    cityId?: number | null;
    cityName?: string;
    formattedAddress?: string;
  }) => void;
  hydrateFromStorage: () => void;
  openModal: () => void;
  closeModal: () => void;
  setIsLocating: (status: boolean) => void;
}

// Default to Hyderabad — must match SSR and first client paint
const DEFAULT_LAT = 17.385;
const DEFAULT_LNG = 78.4867;
const DEFAULT_CITY = "Hyderabad";
const DEFAULT_ADDRESS = "Hyderabad, Telangana";

export const useLocationStore = create<LocationState>((set) => ({
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LNG,
  cityId: null,
  cityName: DEFAULT_CITY,
  formattedAddress: DEFAULT_ADDRESS,
  isLocating: false,
  isModalOpen: false,
  hasHydrated: false,

  hydrateFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("paykop_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          set({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            cityName: parsed.cityName || DEFAULT_CITY,
            formattedAddress: parsed.formattedAddress || DEFAULT_ADDRESS,
            cityId: parsed.cityId || null,
            hasHydrated: true,
          });
          return;
        }
      }
    } catch {
      // keep defaults
    }
    set({ hasHydrated: true });
  },

  setLocation: ({
    latitude,
    longitude,
    cityId = null,
    cityName = "Your Location",
    formattedAddress = "",
  }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "paykop_location",
        JSON.stringify({ latitude, longitude, cityId, cityName, formattedAddress })
      );
    }
    set({
      latitude,
      longitude,
      cityId,
      cityName,
      formattedAddress: formattedAddress || cityName,
      hasHydrated: true,
    });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setIsLocating: (status: boolean) => set({ isLocating: status }),
}));
