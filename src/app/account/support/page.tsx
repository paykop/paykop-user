"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, MessageSquare, Plus } from "lucide-react";
import { useSupportTickets } from "@/lib/queries/hooks";
import { api } from "@/lib/api/endpoints";
import { toast } from "@/lib/toast";

export default function SupportPage() {
  const { data: tickets = [], isLoading, refetch } = useSupportTickets();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.support.createTicket({ subject, category, description, priority: "medium" });
      toast.success("Ticket created");
      setShowForm(false);
      setSubject("");
      setDescription("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/account" className="hover:text-gray-900">
          Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Support</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[var(--primary)]" /> Support tickets
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New ticket
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="shopcart-card p-6 bg-white space-y-3">
          <input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          >
            {["general", "order", "payment", "kyc", "product", "service", "account", "other"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
          <textarea
            placeholder="Describe your issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            rows={4}
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl shopcart-btn-primary text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">No support tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="shopcart-card p-4 bg-white">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-gray-900">{t.subject}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t.ticket_number} · {t.category}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100">
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
