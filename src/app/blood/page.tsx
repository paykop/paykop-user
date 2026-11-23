"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Droplet,
  Heart,
  Phone,
  Hospital,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { BloodDonorProfile, BloodRequest } from "@/types";
import { useLocationStore } from "@/lib/location/store";
import { toast } from "@/lib/toast";

const BLOOD_GROUPS = ["All", "A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"];

function BloodContent() {
  const searchParams = useSearchParams();
  const highlightRequestId = searchParams.get("request_id");
  const { cityName, latitude, longitude } = useLocationStore();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [myDonorProfile, setMyDonorProfile] = useState<BloodDonorProfile | null>(null);

  // Donor Registration Modal state
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [donorBloodType, setDonorBloodType] = useState("O+");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorCity, setDonorCity] = useState(cityName || "Hyderabad");
  const [donorNotes, setDonorNotes] = useState("");
  const [registering, setRegistering] = useState(false);
  const [donorSuccess, setDonorSuccess] = useState(false);

  // Raise blood request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [requestBloodType, setRequestBloodType] = useState("O+");
  const [unitsNeeded, setUnitsNeeded] = useState("1");
  const [hospital, setHospital] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [raisingRequest, setRaisingRequest] = useState(false);

  // Interest Submission state
  const [interestRequestId, setInterestRequestId] = useState<number | null>(null);
  const [interestNotes, setInterestNotes] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestSuccessMsg, setInterestSuccessMsg] = useState("");

  useEffect(() => {
    api.donations
      .listBloodRequests()
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));

    if (session.isAuthenticated()) {
      api.donations
        .getMyDonorProfile()
        .then(setMyDonorProfile)
        .catch(() => setMyDonorProfile(null));
    }
  }, []);

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    setRegistering(true);
    const cleanPhone = donorPhone.startsWith("+91") ? donorPhone : `+91${donorPhone.replace(/\D/g, "")}`;

    try {
      if (myDonorProfile) {
        await api.donations.updateMyDonorProfile({
          blood_type: donorBloodType,
          phone: cleanPhone,
          city: donorCity,
          notes: donorNotes || undefined,
          is_available: true,
        });
      } else {
        await api.donations.registerDonor({
          blood_type: donorBloodType,
          phone: cleanPhone,
          city: donorCity,
          is_available: true,
        });
      }
      const profile = await api.donations.getMyDonorProfile();
      setMyDonorProfile(profile);
      setDonorSuccess(true);
      setTimeout(() => {
        setDonorSuccess(false);
        setShowDonorModal(false);
      }, 2500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to register donor profile");
    } finally {
      setRegistering(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!myDonorProfile) return;
    try {
      const next = !myDonorProfile.is_available;
      await api.donations.toggleDonorAvailability(next);
      setMyDonorProfile({ ...myDonorProfile, is_available: next });
      toast.success(next ? "You are now available to donate" : "Marked as unavailable");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update availability");
    }
  };

  const handleDeleteDonorProfile = async () => {
    if (!confirm("Remove your donor profile?")) return;
    try {
      await api.donations.deleteMyDonorProfile();
      setMyDonorProfile(null);
      toast.success("Donor profile removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove profile");
    }
  };

  const handleRaiseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }
    setRaisingRequest(true);
    try {
      const cleanPhone = contactPhone.startsWith("+91")
        ? contactPhone
        : `+91${contactPhone.replace(/\D/g, "")}`;
      const created = await api.donations.raiseBloodRequest({
        patient_name: patientName.trim(),
        blood_type: requestBloodType,
        units_needed: Number(unitsNeeded) || 1,
        hospital: hospital.trim(),
        contact_phone: cleanPhone,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        urgent: true,
      });
      setRequests((prev) => [created, ...prev]);
      setShowRequestModal(false);
      setPatientName("");
      setHospital("");
      setContactPhone("");
      toast.success("Blood request posted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post request");
    } finally {
      setRaisingRequest(false);
    }
  };

  const handleSubmitInterest = async (requestId: number) => {
    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    setSubmittingInterest(true);
    try {
      await api.donations.submitInterest(requestId, interestNotes);
      setInterestSuccessMsg(`Interest submitted for Request #${requestId}! Hospital has been notified.`);
      setInterestRequestId(null);
      setInterestNotes("");
      setTimeout(() => setInterestSuccessMsg(""), 4000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit donation interest");
    } finally {
      setSubmittingInterest(false);
    }
  };

  const filtered = selectedGroup === "All"
    ? requests
    : requests.filter((r) => r.blood_type.toLowerCase() === selectedGroup.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Emergency Blood Bank</span>
      </nav>

      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-red-900 to-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-200 text-xs font-bold">
              <Droplet className="w-3.5 h-3.5 text-red-400" />
              <span>Hyperlocal Emergency Network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Urgent Blood Requests & Donors
            </h1>
            <p className="text-sm text-white/80">
              Direct connection between emergency hospital cases and verified neighborhood blood donors.
            </p>
          </div>

          <button
            onClick={() => setShowDonorModal(true)}
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>{myDonorProfile ? "Update Donor Profile" : "Register as a Blood Donor"}</span>
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 self-start cursor-pointer"
          >
            <Hospital className="w-4 h-4" />
            <span>Post Emergency Request</span>
          </button>
        </div>
      </div>

      {session.isAuthenticated() && myDonorProfile && (
        <div className="shopcart-card p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Your donor profile</p>
            <p className="font-bold text-gray-900">
              {myDonorProfile.blood_type} · {myDonorProfile.city}
            </p>
            <p className="text-xs text-gray-500">
              {myDonorProfile.is_available ? "Available to donate" : "Currently unavailable"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleToggleAvailability}
              className="px-4 py-2 rounded-full bg-red-50 text-red-700 text-xs font-bold cursor-pointer"
            >
              {myDonorProfile.is_available ? "Mark unavailable" : "Mark available"}
            </button>
            <button
              onClick={() => {
                setDonorBloodType(myDonorProfile.blood_type);
                setDonorPhone(myDonorProfile.phone.replace(/^\+91/, ""));
                setDonorCity(myDonorProfile.city || donorCity);
                setDonorNotes(myDonorProfile.notes || "");
                setShowDonorModal(true);
              }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteDonorProfile}
              className="px-4 py-2 rounded-full text-red-600 text-xs font-bold cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {interestSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{interestSuccessMsg}</span>
        </div>
      )}

      {/* Blood Group Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {BLOOD_GROUPS.map((grp) => (
          <button
            key={grp}
            onClick={() => setSelectedGroup(grp)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedGroup === grp
                ? "bg-red-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {grp === "All" ? "All Groups" : `Blood Group ${grp}`}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Checking active emergency requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <Droplet className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="font-bold text-lg text-gray-900">No active requests for this group</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No emergency requests currently logged. Register as a donor to be notified when someone needs your blood group.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((req) => {
            const isHighlighted = highlightRequestId && String(req.id) === highlightRequestId;

            return (
              <div
                key={req.id}
                className={`shopcart-card p-6 bg-white flex flex-col justify-between space-y-4 transition-all ${
                  isHighlighted ? "border-2 border-red-500 shadow-md" : "border-gray-200 hover:border-red-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                        {req.blood_type}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-gray-900">{req.patient_name}</h3>
                        <div className="text-xs font-semibold text-red-600">
                          {req.units_needed} {req.units_needed === 1 ? "Unit" : "Units"} Required
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-[10px] uppercase">
                      Urgent Case
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Hospital className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-900 truncate">{req.hospital}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{req.contact_phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  {interestRequestId === req.id ? (
                    <div className="space-y-2 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Optional note / arrival time..."
                        value={interestNotes}
                        onChange={(e) => setInterestNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSubmitInterest(req.id)}
                          disabled={submittingInterest}
                          className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          {submittingInterest && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Confirm Interest</span>
                        </button>
                        <button
                          onClick={() => setInterestRequestId(null)}
                          className="px-3 py-2 text-xs font-semibold text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInterestRequestId(req.id)}
                      className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>I Can Donate Blood</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Donor Registration Modal */}
      {showDonorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Register as a Blood Donor</h3>
              <p className="text-xs text-gray-500">
                Help save lives in your neighborhood when emergencies arise
              </p>
            </div>

            {donorSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Donor Profile Registered!</h4>
                <p className="text-xs text-emerald-700">Thank you for being a community hero.</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterDonor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Your Blood Group *
                  </label>
                  <select
                    value={donorBloodType}
                    onChange={(e) => setDonorBloodType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900"
                  >
                    {["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={donorCity}
                    onChange={(e) => setDonorCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={donorNotes}
                    onChange={(e) => setDonorNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={registering}
                    className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    {registering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Registration</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDonorModal(false)}
                    className="px-4 py-3 text-xs font-semibold text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Post emergency blood request</h3>
            <form onSubmit={handleRaiseRequest} className="space-y-3">
              <input
                required
                placeholder="Patient name *"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <select
                value={requestBloodType}
                onChange={(e) => setRequestBloodType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold"
              >
                {["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                required
                placeholder="Units needed *"
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <input
                required
                placeholder="Hospital name *"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <input
                required
                maxLength={10}
                placeholder="Contact phone *"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={raisingRequest}
                  className="flex-1 py-3 rounded-full bg-red-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {raisingRequest ? "Posting…" : "Post request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-3 text-xs font-semibold text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BloodPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-400">Loading blood requests...</div>}>
      <BloodContent />
    </Suspense>
  );
}
