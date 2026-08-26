"use client";

import { useState, useEffect, useRef } from "react";
import { X, Phone, Mail, KeyRound, ArrowRight, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { postLoginPath } from "@/lib/auth/postLogin";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

type AuthMode = "phone" | "email";
type Step = "identity" | "otp";

export function LoginModal({ isOpen, onClose, onSuccess, redirectTo }: LoginModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("phone");
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

  if (!isOpen) return null;

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

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpInputRefs.current[5]?.focus();
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
        onClose();
        if (onSuccess) onSuccess();
        router.push(postLoginPath(user, redirectTo));
      } catch {
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid OTP or code expired.");
    } finally {
      setLoading(false);
    }
  };

  const identityLabel = mode === "phone" ? "Sign In / Register" : "Agent Email Sign In";
  const otpLabel = mode === "phone" ? "Verify Phone" : "Verify Email";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-100">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 bg-[var(--canvas)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white">
              {step === "identity" ? (
                mode === "phone" ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {step === "identity" ? identityLabel : otpLabel}
              </h3>
              <p className="text-xs text-gray-500">
                {step === "identity"
                  ? mode === "phone"
                    ? "Enter your mobile number to get started"
                    : "Field agents: sign in with your registered email"
                  : mode === "phone"
                    ? `Code sent to +91 ${phone}`
                    : `Code sent to ${email}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "identity" && (
            <div className="flex gap-2 mb-4 p-1 rounded-xl bg-gray-100">
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  mode === "phone" ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-600"
                }`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  mode === "email" ? "bg-white text-[var(--primary)] shadow-sm" : "text-gray-600"
                }`}
              >
                Agent email
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
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
                  <div className="flex rounded-xl border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] focus-within:bg-white transition-all">
                    <span className="inline-flex items-center px-3.5 text-sm font-semibold text-gray-700 bg-gray-100/80 border-r border-gray-200">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                      className="w-full px-3.5 py-3 text-base text-gray-900 bg-transparent focus:outline-none"
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
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:bg-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Only accounts approved as agents can use email OTP.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === "phone" ? phone.length !== 10 : !email.trim())}
                className="w-full py-3 px-4 rounded-xl shopcart-btn-primary font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with OTP</span>
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
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors"
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
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-2" onPaste={handlePaste}>
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
                      className="w-11 h-13 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-900 transition-all"
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
                  {mode === "phone" ? "Change phone number" : "Change email"}
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
                className="w-full py-3 px-4 rounded-xl shopcart-btn-primary font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
            By signing in, you agree to Paykop&apos;s Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
