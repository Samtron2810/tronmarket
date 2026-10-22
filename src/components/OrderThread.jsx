import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getOrderThread, sendOrderMessage } from "../services/storefrontService";

const ROLE_LABEL = { buyer: "Buyer", seller: "Seller", admin: "Support" };

// A conversation about one order with one seller. Polls while open so both
// sides see new messages without reloading.
export default function OrderThread({ orderId, sellerId, title = "Messages" }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getOrderThread(orderId, sellerId);
      setMessages(res.data?.messages || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load messages");
    } finally {
      setLoading(false);
    }
  }, [orderId, sellerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load on mount, then poll.
    void load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await sendOrderMessage(orderId, { body, sellerId });
      setMessages((prev) => [...prev, res.data]);
      setDraft("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send your message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#667085]">{title}</div>
      <div ref={listRef} className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {loading && <p className="text-xs text-[#667085]">Loading…</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-xs text-[#667085]">No messages yet. Questions about this order start here.</p>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {messages.map((m) => (
          <div key={m._id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.mine ? "bg-[#047857] text-white" : "bg-gray-100 text-[#101828]"
              }`}
            >
              <div className={`mb-0.5 text-[10px] font-semibold ${m.mine ? "text-emerald-100" : "text-[#667085]"}`}>
                {m.mine ? "You" : ROLE_LABEL[m.senderRole] || "Message"} · {new Date(m.createdAt).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Write a message…"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-lg bg-[#101828] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
