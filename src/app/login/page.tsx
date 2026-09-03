"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Phone, Mail, ArrowRight, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/auth/postLogin";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

type AuthMode = "phone" | "email";
type Step = "identity" | "otp";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "agent" ? "email" : "phone"
  );
  const [step, setStep] = useState<Step>("identity");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setStep("identity");
    setOtp(["", "", "", "", "", ""]);
    setErrorMsg("");
    setDebugOtp(null);
  };

  const handleRequestOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setDebugOtp(null);

    try {
      if (mode === "phone") {
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
          setErrorMsg("Please enter a valid 10-digit Indian phone number");
          setLoading(false);
          return;
        }
        const res = await api.auth.requestOTP(`+91${cleanPhone}`);
        if (res.debug_otp && process.env.NODE_ENV === "development") {
          setDebugOtp(res.debug_otp);
        }
      } else {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes("@")) {
          setErrorMsg("Please enter a valid agent email address");
          setLoading(false);
          return;
        }
        const res = await api.auth.requestAgentEmailOTP(trimmed);
        if (res.debug_otp && process.env.NODE_ENV === "development") {
          setDebugOtp(res.debug_otp);
        }
      }
      setStep("otp");
      setCountdown(30);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const fillDebugOtp = (code: string) => {
    const digits = code.slice(0, 6).split("");
    setOtp(digits);
    if (digits.length === 6) {
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the OTP");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const pair =
        mode === "phone"
          ? await api.auth.verifyOTP(`+91${phone.replace(/\D/g, "")}`, otpCode)
          : await api.auth.verifyAgentEmailOTP(email.trim().toLowerCase(), otpCode);

      session.setSession(pair);

      try {
        const user = await api.auth.getMe();
        session.setUser(user);
        router.push(postLoginPath(user, searchParams.get("redirect")));
      } catch {
        router.push("/");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid OTP or code expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/brand/paykop-icon.png"
            alt="Paykop"
            width={48}
            height={48}
            className="w-12 h-12 rounded-2xl mx-auto shadow-md"
            priority
          />
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {step === "identity"
              ? mode === "phone"
                ? "Sign In to Paykop"
                : "Agent Sign In"
              : mode === "phone"
                ? "Verify Phone Number"
                : "Verify Email"}
          </h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {step === "identity"
              ? mode === "phone"
                ? "Enter your 10-digit mobile number to access your cart, orders, and saved addresses."
                : "Field agents: use the email registered when admin approved your account."
              : mode === "phone"
                ? `We've sent a 6-digit code to +91 ${phone}`
                : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === "identity" && (
          <div className="flex gap-2 p-1 rounded-2xl bg-gray-100">
            <button
              type="button"
              onClick={() => switchMode("phone")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "phone" ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-600"
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Phone
            </button>
            <button
              type="button"
              onClick={() => switchMode("email")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === "email" ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-600"
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Agent email
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        {step === "identity" ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            {mode === "phone" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="flex rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] focus-within:bg-white transition-all">
                  <span className="inline-flex items-center px-4 text-sm font-semibold text-gray-700 bg-gray-100/80 border-r border-gray-200">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    className="w-full px-4 py-3.5 text-base text-gray-900 bg-transparent focus:outline-none font-medium"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Agent Email
                </label>
                <input
                  type="email"
                  placeholder="agent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:bg-white font-medium"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "phone" ? phone.length !== 10 : !email.trim())}
              className="w-full py-3.5 px-4 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 text-[var(--accent-green)]" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            {debugOtp && (
              <div
                onClick={() => fillDebugOtp(debugOtp)}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Test OTP: <strong className="tracking-widest">{debugOtp}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Auto-Fill
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-900 transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <button
                type="button"
                onClick={() => {
                  setStep("identity");
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="text-gray-600 hover:text-gray-900 underline cursor-pointer"
              >
                {mode === "phone" ? "Change number" : "Change email"}
              </button>

              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={() => handleRequestOTP()}
                className="text-[var(--primary)] font-medium hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full py-3.5 px-4 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Hyperlocal commerce powered by Paykop.
        </div>
      </div>
    </div>
  );
}
