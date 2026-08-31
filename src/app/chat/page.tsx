"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Loader2,
  Store,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { useIsAuthenticated, useSessionUser } from "@/lib/auth/useSessionUser";
import { Conversation, ChatMessage } from "@/types";
import { chatWs } from "@/lib/chat/ws";

export default function ChatPage() {
  const user = useSessionUser();
  const isAuthenticated = useIsAuthenticated();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  /** On mobile, show thread pane only after user picks a conversation. */
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvIdRef = useRef<number | string | null>(null);

  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    chatWs.connect();

    const unsubscribe = chatWs.subscribe((envelope) => {
      if (envelope.type === "chat.message" && envelope.payload && typeof envelope.payload === "object") {
        const incomingMsg = envelope.payload as ChatMessage;
        const activeId = selectedConvIdRef.current;
        if (activeId && String(incomingMsg.conversation_id) === String(activeId)) {
          setMessages((prev) => {
            if (incomingMsg.id != null && prev.some((m) => String(m.id) === String(incomingMsg.id))) {
              return prev;
            }
            return [...prev, incomingMsg];
          });
        }
      }
    });

    api.chat
      .getConversations()
      .then((data) => {
        const convList = Array.isArray(data) ? data : [];
        setConversations(convList);
        const isDesktop =
          typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        if (convList.length > 0 && isDesktop) {
          setLoadingMsgs(true);
          setSelectedConvId(convList[0].id || convList[0].conversation_id || 1);
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false));

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedConvId) return;

    api.chat
      .getMessages(selectedConvId)
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const newMsg = await api.chat.sendMessage(selectedConvId, content);
      setMessages((prev) => [...prev, newMsg]);

      chatWs.send("chat.message", {
        conversation_id: selectedConvId,
        content,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (convKey: number | string) => {
    setLoadingMsgs(true);
    setSelectedConvId(convKey);
    setMobileThreadOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Direct Merchant Chat</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          Sign in to chat directly with verified local store owners and service providers.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("paykop_open_login"))}
          className="px-6 py-3 rounded-full shopcart-btn-primary font-bold text-xs shadow-md cursor-pointer"
        >
          Sign In to Open Chat
        </button>
      </div>
    );
  }

  const activeConv = conversations.find(
    (c) => String(c.id || c.conversation_id) === String(selectedConvId)
  );

  const showListOnMobile = !mobileThreadOpen;
  const showThreadOnMobile = mobileThreadOpen && selectedConvId != null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Messages & Support</span>
      </nav>

      <div className="shopcart-card bg-white overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[60vh] h-[calc(100dvh-12rem)] border border-gray-200">
        {/* Sidebar */}
        <div
          className={`md:col-span-4 border-r border-gray-100 flex-col h-full bg-[var(--canvas)] ${
            showListOnMobile ? "flex" : "hidden"
          } md:flex`}
        >
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="font-black text-base text-gray-900">Direct Messages</h2>
            <p className="text-[11px] text-gray-400">Neighborhood sellers & service providers</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loadingConvs ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
                <p>No chat conversations yet. Reach out to any store owner from their product page.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const convKey = conv.id || conv.conversation_id || 1;
                const isSelected = String(convKey) === String(selectedConvId);

                return (
                  <button
                    key={convKey}
                    type="button"
                    onClick={() => selectConversation(convKey)}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors cursor-pointer ${
                      isSelected ? "bg-emerald-50/80 border-r-2 border-[var(--primary)]" : "hover:bg-white"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {conv.participant_name ? conv.participant_name[0] : <Store className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {conv.participant_name || "Merchant"}
                        </span>
                        {conv.unread_count != null && conv.unread_count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[var(--accent-green)] text-[var(--primary-dark)] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {conv.last_message || "Tap to chat..."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div
          className={`md:col-span-8 flex-col h-full bg-white min-w-0 ${
            showThreadOnMobile ? "flex" : "hidden"
          } md:flex`}
        >
          <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 bg-white min-w-0">
            <button
              type="button"
              onClick={() => setMobileThreadOpen(false)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-600 shrink-0"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                {activeConv?.participant_name ? activeConv.participant_name[0] : <Store className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {activeConv?.participant_name || "Merchant Chat"}
                </h3>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online & Verified Merchant</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {!selectedConvId ? (
              <div className="py-20 text-center text-xs text-gray-400 space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto text-gray-300" />
                <p>Select a conversation to start chatting.</p>
              </div>
            ) : loadingMsgs ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-400 space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>Start a conversation! Ask about product availability, custom orders, or delivery timing.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user && msg.sender_id === user.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words ${
                        isMe
                          ? "bg-[var(--primary)] text-white rounded-br-none shadow-xs"
                          : "bg-white text-gray-900 rounded-bl-none border border-gray-200 shadow-xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!selectedConvId}
              className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-[var(--primary)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim() || !selectedConvId}
              className="w-10 h-10 shrink-0 rounded-full shopcart-btn-primary flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
              ) : (
                <Send className="w-4 h-4 text-[var(--accent-green)]" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
