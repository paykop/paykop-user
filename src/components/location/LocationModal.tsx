"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Navigation, Search, Loader2, Check } from "lucide-react";
import { useLocationStore } from "@/lib/location/store";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";

const POPULAR_CITIES = [
  { name: "Hyderabad", lat: 17.385, lng: 78.4867, state: "Telangana" },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, state: "Maharashtra" },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209, state: "Delhi" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh" },
  { name: "Vijayawada", lat: 16.5062, lng: 80.648, state: "Andhra Pradesh" },
];

export function LocationModal() {
  const { isModalOpen, closeModal, setLocation, cityName } =
    useLocationStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { place_id: string; description: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setErrorMsg("");
      try {
        const res = await api.location.search(searchQuery);
        setSearchResults(res.predictions || []);
      } catch {
        // Fallback filter over popular cities if endpoint fails
        const filtered = POPULAR_CITIES.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((c) => ({
          place_id: c.name,
          description: `${c.name}, ${c.state}`,
        }));
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isModalOpen) return null;

  const displaySearchResults = searchQuery.trim() ? searchResults : [];

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let detectedCity = "";
        let formatted = "";

        // 1. Try backend reverse geocoding API
        try {
          const geoRes = await api.location.reverseGeocode(lat, lng);
          detectedCity = geoRes.city || geoRes.state || "";
          formatted = geoRes.formatted_address || (detectedCity ? `${detectedCity}, India` : "");
        } catch {
          // Backend geocoder not configured or returned 503 - proceed to fallback
        }

        // 2. Client-side reverse geocoding fallback if backend is offline/unconfigured
        if (!detectedCity || detectedCity === "GPS Location") {
          try {
            const fallbackRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              detectedCity = data.city || data.locality || data.principalSubdivision || "";
              if (detectedCity) {
                formatted = `${detectedCity}, ${data.principalSubdivision || "India"}`;
              }
            }
          } catch {
            // Ignore external geocoding network error
          }
        }

        // 3. Proximity fallback to nearest supported popular city
        if (!detectedCity || detectedCity === "GPS Location") {
          let nearest = POPULAR_CITIES[0];
          let minDistance = Infinity;
          for (const c of POPULAR_CITIES) {
            const dist = Math.hypot(c.lat - lat, c.lng - lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = c;
            }
          }
          detectedCity = nearest.name;
          formatted = `${nearest.name}, ${nearest.state}, India`;
        }

        setLocation({
          latitude: lat,
          longitude: lng,
          cityName: detectedCity,
          formattedAddress: formatted || `${detectedCity}, India`,
        });

        // Sync with user profile if logged in
        const currentUser = session.getUser();
        if (currentUser?.id) {
          api.users
            .updateCurrentLocation(currentUser.id, {
              latitude: lat,
              longitude: lng,
              city: detectedCity,
              formatted_address: formatted || `${detectedCity}, India`,
            })
            .catch(() => {});
        }

        setIsLocating(false);
        closeModal();
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Unable to retrieve your location. Please check browser permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (city: (typeof POPULAR_CITIES)[0]) => {
    setLocation({
      latitude: city.lat,
      longitude: city.lng,
      cityName: city.name,
      formattedAddress: `${city.name}, ${city.state}, India`,
    });

    const currentUser = session.getUser();
    if (currentUser?.id) {
      api.users.updateCurrentLocation(currentUser.id, {
        latitude: city.lat,
        longitude: city.lng,
        city: city.name,
        formatted_address: `${city.name}, ${city.state}`,
      }).catch(() => {});
    }

    closeModal();
  };

  const handleSelectPrediction = async (prediction: {
    place_id: string;
    description: string;
  }) => {
    try {
      const details = await api.location.placeDetails(prediction.place_id);
      setErrorMsg("");
      setLocation({
        latitude: details.lat,
        longitude: details.lng,
        cityName: prediction.description.split(",")[0],
        formattedAddress: details.formatted_address || prediction.description,
      });
      closeModal();
    } catch {
      setErrorMsg("Could not load details for that place. Please try again or use GPS.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[var(--canvas)]">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-bold text-gray-900">Select Your Location</h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* GPS Auto-detect Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl shopcart-btn-primary font-medium text-sm disabled:opacity-75 cursor-pointer shadow-sm"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                <span>Detecting your location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-[var(--accent-green)]" />
                <span>Use Current Location (GPS)</span>
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 text-center">
              {errorMsg}
            </p>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search area, city or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {displaySearchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1 bg-gray-50/50">
              {displaySearchResults.map((item) => (
                <button
                  key={item.place_id}
                  onClick={() => handleSelectPrediction(item)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white hover:shadow-xs transition-all flex items-center gap-2 text-gray-700"
                >
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{item.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Cities */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Popular Cities
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POPULAR_CITIES.map((city) => {
                const isSelected = cityName.toLowerCase() === city.name.toLowerCase();
                return (
                  <button
                    key={city.name}
                    onClick={() => handleSelectCity(city)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[var(--primary)] hover:bg-white"
                    }`}
                  >
                    <span className="truncate">{city.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
          Delivering hyperlocal products, services & verified community essentials in your area.
        </div>
      </div>
    </div>
  );
}
